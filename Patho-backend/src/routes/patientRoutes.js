const express = require('express');
const { body } = require('express-validator');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All patient routes require authentication
router.use(authMiddleware.protect);

// Validation rules
const createPatientValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name is required and must be between 2-100 characters'),
  body('phone')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('campId')
    .isMongoId()
    .withMessage('Valid camp ID is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required if provided')
];

const updatePatientValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const transferPatientValidation = [
  body('newCampId')
    .isMongoId()
    .withMessage('Valid new camp ID is required')
];

// Routes
router.get('/stats', patientController.getPatientStats);
router.get('/search', patientController.searchPatients);
router.get('/', patientController.getPatients);
router.post('/', createPatientValidation, validateRequest, patientController.createPatient);

router.get('/:id', patientController.getPatient);
router.put('/:id', updatePatientValidation, validateRequest, patientController.updatePatient);
router.delete('/:id', authMiddleware.restrictTo('admin'), patientController.deletePatient);

// Transfer patient to different camp - restricted to coordinators and admins
router.patch('/:id/transfer', 
  authMiddleware.restrictTo('coordinator', 'admin'),
  transferPatientValidation,
  validateRequest,
  patientController.transferPatient
);

module.exports = router;