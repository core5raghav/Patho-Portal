const express = require('express');
const { body } = require('express-validator');
const campController = require('../controllers/campController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All camp routes require authentication
router.use(authMiddleware.protect);

// Validation rules
const createCampValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Camp name must be between 3-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('location.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('location.pincode')
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Valid pincode is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1')
];

const updateCampValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Camp name must be between 3-200 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
];

const addStaffValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
];

// Routes
router.get('/stats', campController.getCampStats);
router.get('/', campController.getCamps);
router.post('/', 
  authMiddleware.restrictTo('admin', 'coordinator'),
  createCampValidation, 
  validateRequest, 
  campController.createCamp
);

router.get('/:id', campController.getCamp);
router.put('/:id', updateCampValidation, validateRequest, campController.updateCamp);
router.delete('/:id', authMiddleware.restrictTo('admin'), campController.deleteCamp);

// Staff management routes
router.post('/:id/staff', 
  authMiddleware.restrictTo('admin', 'coordinator'),
  addStaffValidation, 
  validateRequest, 
  campController.addStaffToCamp
);
router.delete('/:id/staff/:userId', 
  authMiddleware.restrictTo('admin', 'coordinator'),
  campController.removeStaffFromCamp
);

module.exports = router;