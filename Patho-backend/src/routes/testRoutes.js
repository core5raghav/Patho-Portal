const express = require('express');
const { body } = require('express-validator');
const testController = require('../controllers/testController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All test routes require authentication (handled in app.js)

// Validation rules
const createTestValidation = [
  body('testName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Test name must be between 2-200 characters'),
  body('testType')
    .isIn(['blood', 'urine', 'x-ray', 'ecg', 'ultrasound', 'bmi', 'blood-pressure', 'other'])
    .withMessage('Valid test type is required'),
  body('patientId')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  body('campId')
    .isMongoId()
    .withMessage('Valid camp ID is required'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date')
];

const updateTestValidation = [
  body('testName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Test name must be between 2-200 characters'),
  body('followUpDate')
    .optional()
    .isISO8601()
    .withMessage('Follow-up date must be a valid date')
];

const reviewTestValidation = [
  body('result')
    .isIn(['normal', 'abnormal', 'pending'])
    .withMessage('Result must be normal, abnormal, or pending'),
  body('reviewComments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review comments must not exceed 1000 characters')
];

// Routes
router.get('/stats', testController.getTestStats);
router.get('/patient/:patientId', testController.getTestsByPatient);
router.get('/', testController.getTests);
router.post('/', createTestValidation, validateRequest, testController.createTest);

router.get('/:id', testController.getTest);
router.put('/:id', updateTestValidation, validateRequest, testController.updateTest);
router.delete('/:id', authMiddleware.restrictTo('admin'), testController.deleteTest);

// Review route - restricted to doctors and admins
router.patch('/:id/review', 
  authMiddleware.restrictTo('doctor', 'admin'),
  reviewTestValidation,
  validateRequest,
  testController.reviewTest
);

module.exports = router;