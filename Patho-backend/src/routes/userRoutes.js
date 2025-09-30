const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All user routes require authentication (handled in app.js)

// Validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2-100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'nurse', 'coordinator', 'volunteer'])
    .withMessage('Invalid role'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];

const updateRoleValidation = [
  body('role')
    .isIn(['admin', 'doctor', 'nurse', 'coordinator', 'volunteer'])
    .withMessage('Valid role is required')
];

// Routes accessible to all authenticated users
router.get('/search', userController.searchUsers);

// Admin-only routes
router.get('/stats', authMiddleware.restrictTo('admin'), userController.getUserStats);
router.get('/', authMiddleware.restrictTo('admin'), userController.getUsers);

// Routes accessible to user themselves or admin
router.get('/:id', userController.getUser);
router.put('/:id', updateUserValidation, validateRequest, userController.updateUser);

// Admin-only user management routes
router.delete('/:id', authMiddleware.restrictTo('admin'), userController.deleteUser);
router.patch('/:id/activate', authMiddleware.restrictTo('admin'), userController.activateUser);
router.patch('/:id/role', 
  authMiddleware.restrictTo('admin'),
  updateRoleValidation,
  validateRequest,
  userController.updateUserRole
);

module.exports = router;