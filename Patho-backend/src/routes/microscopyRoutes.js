// src/routes/dashboardRoutes.js
const express = require('express');
const { 
  getDashboardStats,
  getCampDetails
} = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authMiddleware, getDashboardStats);

// @route   GET /api/dashboard/camps
// @desc    Get detailed camp information
// @access  Private
router.get('/camps', authMiddleware, getCampDetails);

module.exports = router;