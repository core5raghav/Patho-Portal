const Patient = require('../models/patientModel');
const Camp = require('../models/campModel');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorMiddleware');

// @desc    Get all patients with filtering
// @route   GET /api/patients
// @access  Private
const getPatients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      camp,
      gender,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'All Status') {
      filter.status = status;
    }

    if (camp) {
      filter.camp = camp;
    }

    if (gender && gender !== 'all') {
      filter.gender = gender;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(filter)
      .populate('camp', 'name location startDate endDate')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPatients: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    next(error);
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('camp', 'name location startDate endDate organization')
      .populate('tests');

    if (!patient || !patient.isActive) {
      return next(new AppError('Patient not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  } catch (error) {
    logger.error('Get patient error:', error);
    next(error);
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      age,
      gender,
      address,
      emergencyContact,
      medicalHistory,
      allergies,
      currentMedications,
      campId,
      notes
    } = req.body;

    // Verify camp exists
    const camp = await Camp.findById(campId);
    if (!camp) {
      return next(new AppError('Camp not found', 404));
    }

    // Check camp capacity
    if (camp.currentPatientCount >= camp.capacity) {
      return next(new AppError('Camp has reached maximum capacity', 400));
    }

    const patient = await Patient.create({
      name,
      email,
      phone,
      age,
      gender,
      address,
      emergencyContact,
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      currentMedications: currentMedications || [],
      camp: campId,
      notes,
      registrationDate: new Date()
    });

    // Update camp patient count
    await Camp.findByIdAndUpdate(campId, {
      $inc: { currentPatientCount: 1 }
    });

    const populatedPatient = await Patient.findById(patient._id)
      .populate('camp', 'name location');

    logger.info(`Patient created: ${patient.name} (ID: ${patient._id}) in camp ${camp.name}`);

    res.status(201).json({
      status: 'success',
      data: { patient: populatedPatient }
    });
  } catch (error) {
    logger.error('Create patient error:', error);
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient || !patient.isActive) {
      return next(new AppError('Patient not found', 404));
    }

    const updateFields = { ...req.body };
    delete updateFields.camp; // Prevent camp changes through this endpoint

    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('camp', 'name location');

    logger.info(`Patient updated: ${updatedPatient.name} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    logger.error('Update patient error:', error);
    next(error);
  }
};

// @desc    Transfer patient to different camp
// @route   PATCH /api/patients/:id/transfer
// @access  Private (Admin/Coordinator only)
const transferPatient = async (req, res, next) => {
  try {
    const { newCampId } = req.body;

    if (!newCampId) {
      return next(new AppError('New camp ID is required', 400));
    }

    const patient = await Patient.findById(req.params.id);
    const newCamp = await Camp.findById(newCampId);

    if (!patient || !patient.isActive) {
      return next(new AppError('Patient not found', 404));
    }

    if (!newCamp) {
      return next(new AppError('New camp not found', 404));
    }

    // Check new camp capacity
    if (newCamp.currentPatientCount >= newCamp.capacity) {
      return next(new AppError('New camp has reached maximum capacity', 400));
    }

    const oldCampId = patient.camp;

    // Update patient's camp
    patient.camp = newCampId;
    await patient.save();

    // Update camp patient counts
    await Camp.findByIdAndUpdate(oldCampId, {
      $inc: { currentPatientCount: -1 }
    });
    await Camp.findByIdAndUpdate(newCampId, {
      $inc: { currentPatientCount: 1 }
    });

    const updatedPatient = await Patient.findById(patient._id)
      .populate('camp', 'name location');

    logger.info(`Patient transferred: ${patient.name} from ${oldCampId} to ${newCampId} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Patient transferred successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    logger.error('Transfer patient error:', error);
    next(error);
  }
};

// @desc    Delete patient (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    // Soft delete
    patient.isActive = false;
    await patient.save();

    // Update camp patient count
    await Camp.findByIdAndUpdate(patient.camp, {
      $inc: { currentPatientCount: -1 }
    });

    logger.info(`Patient deleted: ${patient.name} by ${req.user.name}`);

    res.status(200).json({
      status: 'success',
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    logger.error('Delete patient error:', error);
    next(error);
  }
};

// @desc    Get patient statistics
// @route   GET /api/patients/stats
// @access  Private
const getPatientStats = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments({ isActive: true });
    
    const statusStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const genderStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const ageGroupStats = await Patient.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: 'Under 18' },
                { case: { $lt: ['$age', 35] }, then: '18-34' },
                { case: { $lt: ['$age', 50] }, then: '35-49' },
                { case: { $lt: ['$age', 65] }, then: '50-64' },
              ],
              default: '65+'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent registrations (this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = await Patient.countDocuments({
      isActive: true,
      registrationDate: { $gte: thisMonth }
    });

    const stats = {
      total: totalPatients,
      byStatus: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byGender: genderStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byAgeGroup: ageGroupStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      newThisMonth
    };

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    logger.error('Get patient stats error:', error);
    next(error);
  }
};

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private
const searchPatients = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return next(new AppError('Search query must be at least 2 characters', 400));
    }

    const patients = await Patient.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('camp', 'name')
    .limit(parseInt(limit))
    .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      data: { patients }
    });
  } catch (error) {
    logger.error('Search patients error:', error);
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  transferPatient,
  deletePatient,
  getPatientStats,
  searchPatients
};