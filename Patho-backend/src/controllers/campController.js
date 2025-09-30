const Camp = require('../models/campModel');
const Patient = require('../models/patientModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorMiddleware');

// @desc    Get all camps with filtering
// @route   GET /api/camps
// @access  Private
const getCamps = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      organizer,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All Status') {
      filter.status = status;
    }

    if (organizer) {
      filter.organizer = organizer;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const camps = await Camp.find(filter)
      .populate('organizer', 'name email')
      .populate('assignedStaff.user', 'name role')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Camp.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        camps,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCamps: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get camps error:', error);
    next(error);
  }
};

// @desc    Get single camp
// @route   GET /api/camps/:id
// @access  Private
const getCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id)
      .populate('organizer', 'name email phone role')
      .populate('assignedStaff.user', 'name email role qualification')
      .populate('patients');

    if (!camp || !camp.isActive) {
      return next(new AppError('Camp not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { camp }
    });
  } catch (error) {
    logger.error('Get camp error:', error);
    next(error);
  }
};

// @desc    Create new camp
// @route   POST /api/camps
// @access  Private (Admin/Coordinator only)
const createCamp = async (req, res, next) => {
  try {
    const {
      name,
      description,
      location,
      startDate,
      endDate,
      capacity,
      services,
      equipment,
      budget,
      notes
    } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return next(new AppError('End date must be after start date', 400));
    }

    if (new Date(startDate) < new Date()) {
      return next(new AppError('Start date cannot be in the past', 400));
    }

    const camp = await Camp.create({
      name,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity,
      organizer: req.user.id,
      services: services || [],
      equipment: equipment || [],
      budget,
      notes,
      status: 'planned'
    });

    const populatedCamp = await Camp.findById(camp._id)
      .populate('organizer', 'name email');

    logger.info(`Camp created: ${camp.name} by ${req.user.name}`);

    res.status(201).json({
      status: 'success',
      data: { camp: populatedCamp }
    });
  } catch (error) {
    logger.error('Create camp error:', error);
    next(error);
  }
};

// @desc    Update camp
// @route   PUT /api/camps/:id
// @access  Private
const updateCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp || !camp.isActive) {
      return next(new AppError('Camp not found', 404));
    }

    // Check permissions
    if (camp.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You can only update camps you organize', 403));
    }

    // Validate dates if provided
    if (req.body.startDate && req.body.endDate) {
      if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
        return next(new AppError('End date must be after start date', 400));
      }
    }

    const updateFields = { ...req.body };
    if (updateFields.startDate) updateFields.startDate = new Date(updateFields.startDate);
    if (updateFields.endDate) updateFields.endDate = new Date(updateFields.endDate);

    const updatedCamp = await Camp.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    logger.info(`Camp updated: ${updatedCamp.name} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      data: { camp: updatedCamp }
    });
  } catch (error) {
    logger.error('Update camp error:', error);
    next(error);
  }
};

// @desc    Delete camp (soft delete)
// @route   DELETE /api/camps/:id
// @access  Private (Admin only)
const deleteCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return next(new AppError('Camp not found', 404));
    }

    // Check if camp has patients
    const patientCount = await Patient.countDocuments({ camp: req.params.id, isActive: true });
    if (patientCount > 0) {
      return next(new AppError('Cannot delete camp with registered patients', 400));
    }

    camp.isActive = false;
    await camp.save();

    logger.info(`Camp deleted: ${camp.name} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Camp deleted successfully'
    });
  } catch (error) {
    logger.error('Delete camp error:', error);
    next(error);
  }
};

// @desc    Add staff to camp
// @route   POST /api/camps/:id/staff
// @access  Private (Organizer/Admin only)
const addStaffToCamp = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const camp = await Camp.findById(req.params.id);
    if (!camp || !camp.isActive) {
      return next(new AppError('Camp not found', 404));
    }

    // Check permissions
    if (camp.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Only camp organizers can add staff', 403));
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await camp.addStaff(userId, role);

    res.status(200).json({
      status: 'success',
      message: 'Staff member added successfully'
    });
  } catch (error) {
    logger.error('Add staff to camp error:', error);
    next(error);
  }
};

// @desc    Remove staff from camp
// @route   DELETE /api/camps/:id/staff/:userId
// @access  Private (Organizer/Admin only)
const removeStaffFromCamp = async (req, res, next) => {
  try {
    const camp = await Camp.findById(req.params.id);
    if (!camp || !camp.isActive) {
      return next(new AppError('Camp not found', 404));
    }

    // Check permissions
    if (camp.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Only camp organizers can remove staff', 403));
    }

    await camp.removeStaff(req.params.userId);

    res.status(200).json({
      status: 'success',
      message: 'Staff member removed successfully'
    });
  } catch (error) {
    logger.error('Remove staff from camp error:', error);
    next(error);
  }
};

// @desc    Get camp statistics
// @route   GET /api/camps/stats
// @access  Private
const getCampStats = async (req, res, next) => {
  try {
    const stats = await Camp.getStats();
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Get camp stats error:', error);
    next(error);
  }
};

module.exports = {
  getCamps,
  getCamp,
  createCamp,
  updateCamp,
  deleteCamp,
  addStaffToCamp,
  removeStaffFromCamp,
  getCampStats
};