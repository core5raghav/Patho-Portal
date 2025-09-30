// src/routes/reportsRoutes.js
const express = require('express');
const { 
  getReports,
  getFilterOptions,
  updateReportStatus,
  bulkUpdateReportStatus,
  // Add these new imports:
  getReportById,
  addAuditTrailEntry
} = require('../controllers/reportsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports with filtering and pagination
// @access  Private
router.get('/', authMiddleware, getReports);

// @route   GET /api/reports/filters
// @desc    Get filter options (camps, organizations, test types)
// @access  Private
router.get('/filters', authMiddleware, getFilterOptions);

// ADD THESE NEW ROUTES:
// @route   GET /api/reports/:id
// @desc    Get single report details with audit trail
// @access  Private
router.get('/:id', authMiddleware, getReportById);

// @route   POST /api/reports/:id/audit
// @desc    Add audit trail entry to report
// @access  Private
router.post('/:id/audit', authMiddleware, addAuditTrailEntry);

// @route   PUT /api/reports/:id/status
// @desc    Update single report status (approve/reject)
// @access  Private
router.put('/:id/status', authMiddleware, updateReportStatus);

// @route   PUT /api/reports/bulk-status
// @desc    Bulk update report status
// @access  Private
router.put('/bulk-status', authMiddleware, bulkUpdateReportStatus);

module.exports = router;