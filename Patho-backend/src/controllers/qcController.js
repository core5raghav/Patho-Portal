const QCTest = require('../models/qcModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorMiddleware');

// @desc    Get all QC tests with filtering
// @route   GET /api/qc
// @access  Private
const getQCTests = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      testType,
      status,
      deviceId,
      operator,
      timeFilter = 'today',
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (testType && testType !== 'All Tests') {
      filter.testType = testType;
    }

    if (status && status !== 'All Status') {
      filter.status = status;
    }

    if (deviceId) {
      filter.deviceId = deviceId;
    }

    if (operator) {
      filter.operator = operator;
    }

    // Date filtering
    const now = new Date();
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      switch (timeFilter.toLowerCase()) {
        case 'today':
          dateFilter = {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          };
          break;
        case 'yesterday':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          dateFilter = {
            $gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          };
          break;
        case 'last 7 days':
          dateFilter = {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          };
          break;
        case 'last 30 days':
          dateFilter = {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          };
          break;
      }
    }

    if (Object.keys(dateFilter).length > 0) {
      filter.timestamp = dateFilter;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const tests = await QCTest.find(filter)
      .populate('operator', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await QCTest.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        tests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTests: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get QC tests error:', error);
    next(error);
  }
};

// @desc    Get single QC test
// @route   GET /api/qc/:id
// @access  Private
const getQCTest = async (req, res, next) => {
  try {
    const test = await QCTest.findById(req.params.id)
      .populate('operator', 'name role')
      .populate('correctiveActions.takenBy', 'name');

    if (!test || !test.isActive) {
      return next(new AppError('QC test not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    logger.error('Get QC test error:', error);
    next(error);
  }
};

// @desc    Create new QC test
// @route   POST /api/qc
// @access  Private
const createQCTest = async (req, res, next) => {
  try {
    const {
      testName,
      testType,
      l1, l2, c1, c2, c3,
      expectedValue,
      observedValue,
      unit,
      deviceId,
      controlLot,
      acceptanceCriteria,
      qcRun,
      comments
    } = req.body;

    // Calculate deviation
    const deviation = ((observedValue - expectedValue) / expectedValue * 100).toFixed(1);
    const deviationString = deviation >= 0 ? `+${deviation}%` : `${deviation}%`;

    // Generate test ID
    const testCount = await QCTest.countDocuments({}) + 1;
    const testId = `QC-${testType.substring(0, 3).toUpperCase()}-${String(testCount).padStart(4, '0')}`;

    const test = await QCTest.create({
      testId,
      testName,
      testType,
      l1, l2, c1, c2, c3,
      expectedValue,
      observedValue,
      deviation: deviationString,
      unit,
      deviceId,
      operator: req.user.id,
      operatorName: req.user.name,
      controlLot,
      acceptanceCriteria,
      qcRun,
      comments
    });

    const populatedTest = await QCTest.findById(test._id)
      .populate('operator', 'name');

    logger.info(`QC test created: ${testId} by ${req.user.name}, Status: ${test.status}`);

    res.status(201).json({
      status: 'success',
      data: { test: populatedTest }
    });
  } catch (error) {
    logger.error('Create QC test error:', error);
    next(error);
  }
};

// @desc    Update QC test
// @route   PUT /api/qc/:id
// @access  Private
const updateQCTest = async (req, res, next) => {
  try {
    const test = await QCTest.findById(req.params.id);

    if (!test || !test.isActive) {
      return next(new AppError('QC test not found', 404));
    }

    // Check permissions
    if (test.operator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You can only update your own QC tests', 403));
    }

    const updateFields = { ...req.body };
    
    // Recalculate deviation if values changed
    if (updateFields.expectedValue || updateFields.observedValue) {
      const expectedValue = updateFields.expectedValue || test.expectedValue;
      const observedValue = updateFields.observedValue || test.observedValue;
      
      const deviation = ((observedValue - expectedValue) / expectedValue * 100).toFixed(1);
      updateFields.deviation = deviation >= 0 ? `+${deviation}%` : `${deviation}%`;
    }

    const updatedTest = await QCTest.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('operator', 'name');

    logger.info(`QC test updated: ${updatedTest.testId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      data: { test: updatedTest }
    });
  } catch (error) {
    logger.error('Update QC test error:', error);
    next(error);
  }
};

// @desc    Add corrective action to failed QC test
// @route   POST /api/qc/:id/corrective-action
// @access  Private
const addCorrectiveAction = async (req, res, next) => {
  try {
    const test = await QCTest.findById(req.params.id);

    if (!test || !test.isActive) {
      return next(new AppError('QC test not found', 404));
    }

    if (test.status !== 'Failed') {
      return next(new AppError('Corrective actions can only be added to failed tests', 400));
    }

    const { action, result } = req.body;

    if (!action) {
      return next(new AppError('Action description is required', 400));
    }

    await test.addCorrectiveAction(action, req.user.id, result);

    const updatedTest = await QCTest.findById(test._id)
      .populate('operator', 'name')
      .populate('correctiveActions.takenBy', 'name');

    logger.info(`Corrective action added to QC test: ${test.testId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      data: { test: updatedTest }
    });
  } catch (error) {
    logger.error('Add corrective action error:', error);
    next(error);
  }
};

// @desc    Get QC statistics
// @route   GET /api/qc/stats
// @access  Private
const getQCStats = async (req, res, next) => {
  try {
    const { timeFilter = 'today' } = req.query;
    
    const stats = await QCTest.getStats(timeFilter);
    
    // Get additional metrics
    const failingTests = await QCTest.getFailingTests();
    const deviceStats = await QCTest.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$deviceId',
          totalTests: { $sum: 1 },
          failedTests: {
            $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalTests: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        ...stats,
        failingTestsCount: failingTests.length,
        deviceStats
      }
    });
  } catch (error) {
    logger.error('Get QC stats error:', error);
    next(error);
  }
};

// @desc    Get QC tests by device
// @route   GET /api/qc/device/:deviceId
// @access  Private
const getQCTestsByDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const tests = await QCTest.getByDevice(deviceId, parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: { tests }
    });
  } catch (error) {
    logger.error('Get QC tests by device error:', error);
    next(error);
  }
};

// @desc    Get failing QC tests that need attention
// @route   GET /api/qc/failing
// @access  Private
const getFailingQCTests = async (req, res, next) => {
  try {
    const tests = await QCTest.getFailingTests();

    res.status(200).json({
      status: 'success',
      data: { tests }
    });
  } catch (error) {
    logger.error('Get failing QC tests error:', error);
    next(error);
  }
};

// @desc    Delete QC test (soft delete)
// @route   DELETE /api/qc/:id
// @access  Private (Admin only)
const deleteQCTest = async (req, res, next) => {
  try {
    const test = await QCTest.findById(req.params.id);

    if (!test) {
      return next(new AppError('QC test not found', 404));
    }

    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can delete QC tests', 403));
    }

    test.isActive = false;
    await test.save();

    logger.info(`QC test deleted: ${test.testId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'QC test deleted successfully'
    });
  } catch (error) {
    logger.error('Delete QC test error:', error);
    next(error);
  }
};

module.exports = {
  getQCTests,
  getQCTest,
  createQCTest,
  updateQCTest,
  addCorrectiveAction,
  getQCStats,
  getQCTestsByDevice,
  getFailingQCTests,
  deleteQCTest
};