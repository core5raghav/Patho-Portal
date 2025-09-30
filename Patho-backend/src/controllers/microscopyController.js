const Microscopy = require('../models/microscopyModel');
const Patient = require('../models/patientModel');
const Camp = require('../models/campModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorMiddleware');

// @desc    Get all microscopy reports
// @route   GET /api/microscopy
// @access  Private
const getMicroscopyReports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      testType,
      camp,
      organization,
      search,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (status && status !== 'All Status') {
      filter.status = status;
    }

    if (testType && testType !== 'All Test Types') {
      filter.testName = testType;
    }

    if (search) {
      filter.$or = [
        { reportId: { $regex: search, $options: 'i' } },
        { testName: { $regex: search, $options: 'i' } },
        { comments: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const reports = await Microscopy.find(filter)
      .populate('patient', 'name age gender')
      .populate('camp', 'name organization')
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Microscopy.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get microscopy reports error:', error);
    next(error);
  }
};

// @desc    Get single microscopy report
// @route   GET /api/microscopy/:id
// @access  Private
const getMicroscopyReport = async (req, res, next) => {
  try {
    const report = await Microscopy.findById(req.params.id)
      .populate('patient', 'name age gender phone email address')
      .populate('camp', 'name organization location startDate endDate')
      .populate('createdBy', 'name role')
      .populate('reviewedBy', 'name role');

    if (!report || !report.isActive) {
      return next(new AppError('Microscopy report not found', 404));
    }

    // Add audit entry for viewing
    await report.addAuditEntry('Viewed', req.user.name, 'Report accessed for review');

    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    logger.error('Get microscopy report error:', error);
    next(error);
  }
};

// @desc    Create new microscopy report
// @route   POST /api/microscopy
// @access  Private
const createMicroscopyReport = async (req, res, next) => {
  try {
    const {
      patientId,
      campId,
      testName,
      investigations,
      comments,
      images
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

    // Generate unique report ID
    const reportCount = await Microscopy.countDocuments({}) + 1;
    const reportId = `RPT-${String(reportCount).padStart(3, '0')}`;

    const report = await Microscopy.create({
      reportId,
      patient: patientId,
      camp: campId,
      testName,
      investigations: investigations || [],
      comments,
      images: images || [],
      createdBy: req.user.id,
      auditTrail: [{
        action: 'Created',
        user: req.user.name,
        details: 'Microscopy report created',
        timestamp: new Date()
      }]
    });

    const populatedReport = await Microscopy.findById(report._id)
      .populate('patient', 'name age gender')
      .populate('camp', 'name')
      .populate('createdBy', 'name');

    logger.info(`Microscopy report created: ${reportId} by ${req.user.name}`);

    res.status(201).json({
      status: 'success',
      data: { report: populatedReport }
    });
  } catch (error) {
    logger.error('Create microscopy report error:', error);
    next(error);
  }
};

// @desc    Update microscopy report
// @route   PUT /api/microscopy/:id
// @access  Private
const updateMicroscopyReport = async (req, res, next) => {
  try {
    const report = await Microscopy.findById(req.params.id);

    if (!report || !report.isActive) {
      return next(new AppError('Microscopy report not found', 404));
    }

    // Check if user can update this report
    if (report.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You can only update your own reports', 403));
    }

    const {
      testName,
      investigations,
      comments,
      images
    } = req.body;

    // Update fields
    if (testName) report.testName = testName;
    if (investigations) report.investigations = investigations;
    if (comments !== undefined) report.comments = comments;
    if (images) report.images = images;

    report.lastUpdated = new Date();

    // Add audit entry
    await report.addAuditEntry('Updated', req.user.name, 'Report data updated');

    await report.save();

    const updatedReport = await Microscopy.findById(report._id)
      .populate('patient', 'name age gender')
      .populate('camp', 'name')
      .populate('createdBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { report: updatedReport }
    });
  } catch (error) {
    logger.error('Update microscopy report error:', error);
    next(error);
  }
};

// @desc    Approve microscopy report
// @route   PATCH /api/microscopy/:id/approve
// @access  Private (Doctor/Admin only)
const approveMicroscopyReport = async (req, res, next) => {
  try {
    const report = await Microscopy.findById(req.params.id);

    if (!report || !report.isActive) {
      return next(new AppError('Microscopy report not found', 404));
    }

    // Check user permissions
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return next(new AppError('Only doctors and admins can approve reports', 403));
    }

    const { comments } = req.body;

    report.status = 'Approved';
    report.reviewedBy = req.user.id;
    report.reviewDate = new Date();
    report.reviewComments = comments;
    report.lastUpdated = new Date();

    await report.addAuditEntry('Approved', req.user.name, comments || 'Report approved');

    await report.save();

    logger.info(`Microscopy report approved: ${report.reportId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Report approved successfully',
      data: { report }
    });
  } catch (error) {
    logger.error('Approve microscopy report error:', error);
    next(error);
  }
};

// @desc    Reject microscopy report
// @route   PATCH /api/microscopy/:id/reject
// @access  Private (Doctor/Admin only)
const rejectMicroscopyReport = async (req, res, next) => {
  try {
    const report = await Microscopy.findById(req.params.id);

    if (!report || !report.isActive) {
      return next(new AppError('Microscopy report not found', 404));
    }

    // Check user permissions
    if (!['doctor', 'admin'].includes(req.user.role)) {
      return next(new AppError('Only doctors and admins can reject reports', 403));
    }

    const { reason, rejectedTests } = req.body;

    if (!reason) {
      return next(new AppError('Rejection reason is required', 400));
    }

    report.status = 'Rejected';
    report.reviewedBy = req.user.id;
    report.reviewDate = new Date();
    report.rejectionReason = reason;
    report.lastUpdated = new Date();

    const auditDetails = rejectedTests && rejectedTests.length > 0 
      ? `Report rejected - ${reason} (Specific tests: ${rejectedTests.join(', ')})`
      : `Report rejected - ${reason}`;

    await report.addAuditEntry('Rejected', req.user.name, auditDetails);

    await report.save();

    logger.info(`Microscopy report rejected: ${report.reportId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Report rejected successfully',
      data: { report }
    });
  } catch (error) {
    logger.error('Reject microscopy report error:', error);
    next(error);
  }
};

// @desc    Delete microscopy report (soft delete)
// @route   DELETE /api/microscopy/:id
// @access  Private (Admin only)
const deleteMicroscopyReport = async (req, res, next) => {
  try {
    const report = await Microscopy.findById(req.params.id);

    if (!report) {
      return next(new AppError('Microscopy report not found', 404));
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      return next(new AppError('Only admins can delete reports', 403));
    }

    report.isActive = false;
    await report.addAuditEntry('Deleted', req.user.name, 'Report deleted by admin');
    await report.save();

    logger.info(`Microscopy report deleted: ${report.reportId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Delete microscopy report error:', error);
    next(error);
  }
};

// @desc    Get microscopy statistics
// @route   GET /api/microscopy/stats
// @access  Private
const getMicroscopyStats = async (req, res, next) => {
  try {
    const stats = await Microscopy.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalReports = await Microscopy.countDocuments({ isActive: true });
    
    const formattedStats = {
      total: totalReports,
      pending: stats.find(s => s._id === 'Pending')?.count || 0,
      approved: stats.find(s => s._id === 'Approved')?.count || 0,
      rejected: stats.find(s => s._id === 'Rejected')?.count || 0
    };

    res.status(200).json({
      status: 'success',
      data: formattedStats
    });
  } catch (error) {
    logger.error('Get microscopy stats error:', error);
    next(error);
  }
};

module.exports = {
  getMicroscopyReports,
  getMicroscopyReport,
  createMicroscopyReport,
  updateMicroscopyReport,
  approveMicroscopyReport,
  rejectMicroscopyReport,
  deleteMicroscopyReport,
  getMicroscopyStats
};