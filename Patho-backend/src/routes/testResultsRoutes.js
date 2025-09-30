// src/routes/testResultsRoutes.js
const express = require('express');
const { 
  saveTestComment, 
  getTestComment, 
  deleteTestComment 
} = require('../controllers/testResultsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   POST /api/test-results/:testResultId/comment
// @desc    Save comment for specific test result
// @access  Private
router.post('/:testResultId/comment', authMiddleware, saveTestComment);

// @route   GET /api/test-results/:testResultId/comment
// @desc    Get comment for specific test result
// @access  Private
router.get('/:testResultId/comment', authMiddleware, getTestComment);

// @route   DELETE /api/test-results/:testResultId/comment
// @desc    Delete comment for specific test result
// @access  Private
router.delete('/:testResultId/comment', authMiddleware, deleteTestComment);

module.exports = router;