const Test = require('../models/testModel');
const Patient = require('../models/patientModel');
const Camp = require('../models/campModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorMiddleware');

// @desc    Get all tests with filtering
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      testType,
      result,
      patient,
      camp,
      conductedBy,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { testName: { $regex: search, $options: 'i' } },
        { findings: { $regex: search, $options: 'i' } },
        { recommendations: { $regex: search, $options: 'i' } }
      ];
    }

    if (testType && testType !== 'All Types') {
      filter.testType = testType;
    }

    if (result && result !== 'All Results') {
      filter.result = result;
    }

    if (patient) {
      filter.patient = patient;
    }

    if (camp) {
      filter.camp = camp;
    }

    if (conductedBy) {
      filter.conductedBy = conductedBy;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.testDate = {};
      if (startDate) filter.testDate.$gte = new Date(startDate);
      if (endDate) filter.testDate.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const tests = await Test.find(filter)
      .populate('patient', 'name age gender')
      .populate('camp', 'name location')
      .populate('conductedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ testDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Test.countDocuments(filter);

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
    logger.error('Get tests error:', error);
    next(error);
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private
const getTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('patient', 'name age gender phone email')
      .populate('camp', 'name location organization')
      .populate('conductedBy', 'name role email')
      .populate('reviewedBy', 'name role email');

    if (!test || !test.isActive) {
      return next(new AppError('Test not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    logger.error('Get test error:', error);
    next(error);
  }
};

// @desc    Create new test
// @route   POST /api/tests
// @access  Private
const createTest = async (req, res, next) => {
  try {
    const {
      testName,
      testType,
      patientId,
      campId,
      values,
      findings,
      recommendations,
      followUpRequired,
      followUpDate,
      attachments,
      notes
    } = req.body;

    // Verify patient and camp exist
    const patient = await Patient.findById(patientId);
    const camp = await Camp.findById(campId);

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    if (!camp) {
      return next(new AppError('Camp not found', 404));
    }

    const test = await Test.create({
      testName,
      testType,
      patient: patientId,
      camp: campId,
      conductedBy: req.user.id,
      testDate: new Date(),
      values: values || { numeric: [], text: [] },
      findings,
      recommendations,
      followUpRequired: followUpRequired || false,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      attachments: attachments || [],
      notes
    });

    const populatedTest = await Test.findById(test._id)
      .populate('patient', 'name age gender')
      .populate('camp', 'name')
      .populate('conductedBy', 'name');

    logger.info(`Test created: ${test.testName} for patient ${patient.name} by ${req.user.name}`);

    res.status(201).json({
      status: 'success',
      data: { test: populatedTest }
    });
  } catch (error) {
    logger.error('Create test error:', error);
    next(error);
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private
const updateTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test || !test.isActive) {
      return next(new AppError('Test not found', 404));
    }

    // Check permissions - only conductor or admin can update
    if (test.conductedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You can only update tests you conducted', 403));
    }

    const updateFields = { ...req.body };
    if (updateFields.followUpDate) {
      updateFields.followUpDate = new Date(updateFields.followUpDate);
    }

    const updatedTest = await Test.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('patient', 'name age gender')
     .populate('camp', 'name')
     .populate('conductedBy', 'name');

    logger.info(`Test updated: ${updatedTest.testName} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      data: { test: updatedTest }
    });
  } catch (error) {
    logger.error('Update test error:', error);
    next(error);
  }
};

// @desc    Review test
// @route   PATCH /api/tests/:id/review
// @access  Private (Doctor/Admin only)
const reviewTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test || !test.isActive) {
      return next(new AppError('Test not found', 404));
    }

    const { result, reviewComments } = req.body;

    test.result = result;
    test.reviewedBy = req.user.id;
    test.reviewDate = new Date();
    if (reviewComments) {
      test.notes = test.notes ? `${test.notes}\n\nReview: ${reviewComments}` : `Review: ${reviewComments}`;
    }

    await test.save();

    logger.info(`Test reviewed: ${test.testName} marked as ${result} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Test reviewed successfully',
      data: { test }
    });
  } catch (error) {
    logger.error('Review test error:', error);
    next(error);
  }
};

// @desc    Delete test (soft delete)
// @route   DELETE /api/tests/:id
// @access  Private (Admin only)
const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return next(new AppError('Test not found', 404));
    }

    test.isActive = false;
    await test.save();

    logger.info(`Test deleted: ${test.testName} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Test deleted successfully'
    });
  } catch (error) {
    logger.error('Delete test error:', error);
    next(error);
  }
};

// @desc    Get test statistics
// @route   GET /api/tests/stats
// @access  Private
const getTestStats = async (req, res, next) => {
  try {
    const stats = await Test.getStats();
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Get test stats error:', error);
    next(error);
  }
};

// @desc    Get tests by patient
// @route   GET /api/tests/patient/:patientId
// @access  Private
const getTestsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const tests = await Test.find({ 
      patient: patientId, 
      isActive: true 
    })
    .populate('conductedBy', 'name role')
    .populate('reviewedBy', 'name role')
    .sort({ testDate: -1 });

    res.status(200).json({
      status: 'success',
      data: { tests }
    });
  } catch (error) {
    logger.error('Get tests by patient error:', error);
    next(error);
  }
};

module.exports = {
  getTests,
  getTest,
  createTest,
  updateTest,
  reviewTest,
  deleteTest,
  getTestStats,
  getTestsByPatient
};