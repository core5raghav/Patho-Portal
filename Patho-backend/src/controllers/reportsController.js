// src/controllers/reportsController.js
const { pool } = require('../config/db');

// @desc    Get all reports with filtering
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
  try {
    const pathologistId = req.user?.id;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      camp = '', 
      organization = '',
      dateFrom = '',
      dateTo = '' 
    } = req.query;

    // Validate inputs
    if (!pathologistId || isNaN(parseInt(pathologistId))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing pathologist ID. Authentication required.'
      });
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page number. Must be a positive integer.'
      });
    }
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit. Must be a positive integer.'
      });
    }

    console.log('Request params:', { pathologistId, page, limit, search, status, camp, organization, dateFrom, dateTo });

    // Build dynamic WHERE clause
    let whereClause = 'WHERE r.pathologist_id = ?';
    let countQueryParams = [parseInt(pathologistId)];
    let reportsQueryParams = [parseInt(pathologistId)];

    if (search) {
      whereClause += ` AND (
        p.username LIKE ? OR 
        CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) LIKE ? OR
        r.id LIKE ? OR
        c.camp_name LIKE ? OR
        o.organization_name LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      countQueryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      reportsQueryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'All Status') {
      whereClause += ' AND r.status = ?';
      countQueryParams.push(status.toLowerCase());
      reportsQueryParams.push(status.toLowerCase());
    }

    if (camp && camp !== 'All Camps') {
      whereClause += ' AND c.camp_name = ?';
      countQueryParams.push(camp);
      reportsQueryParams.push(camp);
    }

    if (organization && organization !== 'All Organizations') {
      whereClause += ' AND o.organization_name = ?';
      countQueryParams.push(organization);
      reportsQueryParams.push(organization);
    }

    if (dateFrom) {
      whereClause += ' AND DATE(r.created_at) >= ?';
      countQueryParams.push(dateFrom);
      reportsQueryParams.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(r.created_at) <= ?';
      countQueryParams.push(dateTo);
      reportsQueryParams.push(dateTo);
    }

    // Get reports with test profiles
    const reportsQuery = `
      SELECT 
        r.id as report_id,
        r.status,
        r.created_at as report_date,
        r.updated_at,
        r.comments,
        r.rejection_reason,
        r.approved_at,
        r.rejected_at,
        p.id as patient_id,
        p.first_name,
        p.last_name,
        CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as full_name,
        p.age,
        p.gender,
        c.id as camp_id,
        c.camp_name,
        c.location as camp_location,
        o.organization_name,
        GROUP_CONCAT(DISTINCT tp.name SEPARATOR ', ') as test_profiles
      FROM reports r
      INNER JOIN patients p ON r.patient_id = p.id
      INNER JOIN camps c ON r.camp_id = c.id
      INNER JOIN organizations o ON c.organization_id = o.id
      LEFT JOIN test_results tr ON r.id = tr.report_id
      LEFT JOIN tests t ON tr.test_id = t.id
      LEFT JOIN test_profile tp ON t.profile_id = tp.id
      ${whereClause}
      GROUP BY r.id, r.status, r.created_at, r.updated_at, r.comments, 
              p.id, p.first_name, p.last_name, p.age, p.gender,
              c.id, c.camp_name, c.location, o.organization_name
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    reportsQueryParams.push(parseInt(limit), offset);

    console.log('Query params:', reportsQueryParams);

    const [reports] = await pool.query(reportsQuery, reportsQueryParams);
    console.log('Query executed successfully, got', reports.length, 'reports');

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM reports r
      INNER JOIN patients p ON r.patient_id = p.id
      INNER JOIN camps c ON r.camp_id = c.id
      INNER JOIN organizations o ON c.organization_id = o.id
      LEFT JOIN test_results tr ON r.id = tr.report_id
      LEFT JOIN tests t ON tr.test_id = t.id
      LEFT JOIN test_profile tp ON t.profile_id = tp.id
      ${whereClause}
    `;

    const [countResult] = await pool.query(countQuery, countQueryParams);
    const totalReports = countResult[0].total;

    // Format the response
    const formattedReports = reports.map(report => ({
      id: `RPT-${String(report.report_id).padStart(3, '0')}`,
      patientName: `${report.first_name || ''} ${report.last_name || ''}`.trim() || 'Unknown',
      age: report.age || 0,
      gender: report.gender || 'Unknown',
      testName: report.test_profiles || 'No tests',
      date: report.report_date.toISOString().split('T')[0],
      status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
      camp: report.camp_name,
      organization: report.organization_name || 'Unknown Organization',
      location: report.camp_location || '',
      comments: report.comments || '',
      rejectionReason: report.rejection_reason || '',
      approvedAt: report.approved_at,
      rejectedAt: report.rejected_at,
      updatedAt: report.updated_at
    }));

    const totalPages = Math.ceil(totalReports / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        reports: formattedReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalReports: totalReports,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get filter options (camps, organizations, etc.)
// @route   GET /api/reports/filters
// @access  Private
const getFilterOptions = async (req, res) => {
  try {
    const pathologistId = req.user.id;

    // Get unique camps
    const [camps] = await pool.execute(`
      SELECT DISTINCT c.camp_name
      FROM camps c
      INNER JOIN reports r ON c.id = r.camp_id
      WHERE r.pathologist_id = ?
      ORDER BY c.camp_name
    `, [pathologistId]);

    // Get unique organizations
    const [organizations] = await pool.execute(`
      SELECT DISTINCT o.organization_name
      FROM organizations o
      INNER JOIN camps c ON o.id = c.organization_id
      INNER JOIN reports r ON c.id = r.camp_id
      WHERE r.pathologist_id = ?
      ORDER BY o.organization_name
    `, [pathologistId]);

    // Get unique test types
    const [testTypes] = await pool.execute(`
      SELECT DISTINCT t.test_name
      FROM tests t
      INNER JOIN test_results tr ON t.id = tr.test_id
      INNER JOIN reports r ON tr.report_id = r.id
      WHERE r.pathologist_id = ?
      ORDER BY t.test_name
    `, [pathologistId]);

    res.status(200).json({
      success: true,
      data: {
        camps: camps.map(c => c.camp_name),
        organizations: organizations.map(o => o.organization_name),
        testTypes: testTypes.map(t => t.test_name),
        statuses: ['Pending', 'Approved', 'Rejected']
      }
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching filter options'
    });
  }
};

// @desc    Get single report with audit trail and test comments
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const pathologistId = req.user.id;

    console.log('Fetching report details for:', { id, pathologistId });

    // Get report details
    const reportQuery = `
      SELECT 
        r.*,
        CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as patientName,
        p.age,
        p.gender,
        p.mobile_number,
        p.email,
        c.camp_name as campName,
        o.organization_name as organizationName
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN camps c ON r.camp_id = c.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE r.id = ? AND r.pathologist_id = ?
    `;

    const [reportResults] = await pool.query(reportQuery, [id, pathologistId]);

    if (reportResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reportResults[0];

    // Get test results for this report WITH COMMENTS
    const testResultsQuery = `
      SELECT 
        tr.*,
        tr.pathologist_comment,
        t.test_name as testName,
        t.unit,
        t.male_upper_range,
        t.male_lower_range,
        t.female_upper_range,
        t.female_lower_range,
        t.child_upper_range,
        t.child_lower_range
      FROM test_results tr
      LEFT JOIN tests t ON tr.test_id = t.id
      WHERE tr.report_id = ?
      ORDER BY tr.id
    `;

    const [testResults] = await pool.query(testResultsQuery, [id]);

    // Get audit trail for this report
    const auditTrailQuery = `
      SELECT 
        id,
        action,
        user,
        details,
        timestamp,
        created_at
      FROM report_audit_trail
      WHERE report_id = ?
      ORDER BY timestamp DESC
    `;

    const [auditTrail] = await pool.query(auditTrailQuery, [id]);

    // Format the response
    const reportDetails = {
      ...report,
      id: `RPT-${String(report.id).padStart(3, '0')}`, // Format ID like RPT-001
      status: report.status.charAt(0).toUpperCase() + report.status.slice(1), // Capitalize status
      date: report.created_at ? report.created_at.toISOString().split('T')[0] : null,
      testResults: testResults.map(result => ({
        ...result,
        testResultId: result.id, // Important: This is the test_results table ID
        testName: result.testName,
        parameter: result.testName,
        pathologistComment: result.pathologist_comment // Include the comment from test_results table
      })),
      auditTrail: auditTrail.map(entry => ({
        id: entry.id,
        action: entry.action,
        user: entry.user,
        details: entry.details,
        timestamp: entry.timestamp,
        createdAt: entry.created_at
      }))
    };

    console.log('Successfully fetched report with', testResults.length, 'test results');

    res.json({
      success: true,
      data: reportDetails
    });

  } catch (error) {
    console.error('Error fetching report details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Add audit trail entry
// @route   POST /api/reports/:id/audit
// @access  Private
const addAuditTrailEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, user, details, timestamp } = req.body;
    const pathologistId = req.user.id;

    // Verify report exists and belongs to the pathologist
    const verifyQuery = `
      SELECT id FROM reports 
      WHERE id = ? AND pathologist_id = ?
    `;

    const [verifyResults] = await pool.query(verifyQuery, [id, pathologistId]);

    if (verifyResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Add audit trail entry
    const insertQuery = `
      INSERT INTO report_audit_trail (report_id, action, user, details, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const [insertResult] = await pool.query(insertQuery, [
      id,
      action,
      user,
      details || ''
    ]);

    res.json({
      success: true,
      message: 'Audit trail entry added successfully',
      data: {
        id: insertResult.insertId,
        reportId: id,
        action,
        user,
        details,
        timestamp
      }
    });

  } catch (error) {
    console.error('Error adding audit trail entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Update report status (approve/reject) - UPDATED WITH AUDIT TRAIL
// @route   PUT /api/reports/:id/status
// @access  Private
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, rejectionReason } = req.body;
    const pathologistId = req.user.id;
    const currentUser = req.user.name || req.user.username || 'Unknown User';

    console.log('Update report status:', { id, status, comments, rejectionReason, pathologistId });

    // Validate status
    if (!['approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected.'
      });
    }

    // Check if report exists and belongs to this pathologist
    const [reportCheck] = await pool.execute(`
      SELECT id, status as currentStatus FROM reports 
      WHERE id = ? AND pathologist_id = ?
    `, [id, pathologistId]);

    if (reportCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or access denied'
      });
    }

    const currentStatus = reportCheck[0].currentStatus;

    // Update report status
    let updateQuery = '';
    let updateParams = [];

    if (status.toLowerCase() === 'approved') {
      updateQuery = `
        UPDATE reports 
        SET status = 'approved', 
            approved_at = NOW(), 
            rejected_at = NULL,
            comments = ?,
            rejection_reason = NULL,
            updated_at = NOW()
        WHERE id = ?
      `;
      updateParams = [comments || '', id];
    } else {
      updateQuery = `
        UPDATE reports 
        SET status = 'rejected', 
            rejected_at = NOW(), 
            approved_at = NULL,
            comments = ?,
            rejection_reason = ?,
            updated_at = NOW()
        WHERE id = ?
      `;
      updateParams = [comments || '', rejectionReason || 'No reason provided', id];
    }

    await pool.execute(updateQuery, updateParams);

    // Add audit trail entry
    const auditDetails = status === 'rejected' 
      ? `${comments || 'Status changed'} - ${rejectionReason || ''}`
      : comments || 'Status changed';

    const auditQuery = `
      INSERT INTO report_audit_trail (report_id, action, user, details, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;

    await pool.query(auditQuery, [
      id,
      `Status Changed from ${currentStatus} to ${status}`,
      currentUser,
      auditDetails.trim()
    ]);

    res.status(200).json({
      success: true,
      message: `Report ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating report status'
    });
  }
};

// @desc    Bulk update report status - UPDATED WITH AUDIT TRAIL
// @route   PUT /api/reports/bulk-status
// @access  Private
const bulkUpdateReportStatus = async (req, res) => {
  try {
    const { reportIds, status, comments, rejectionReason } = req.body;
    const pathologistId = req.user.id;
    const currentUser = req.user.name || req.user.username || 'Unknown User';

    console.log('Bulk update:', { reportIds, status, comments, rejectionReason, pathologistId });

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Report IDs array is required'
      });
    }

    if (!['approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected.'
      });
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // Get current statuses for audit trail
      const placeholders = reportIds.map(() => '?').join(',');
      const [currentStatusResults] = await pool.execute(`
        SELECT id, status as currentStatus FROM reports 
        WHERE id IN (${placeholders}) AND pathologist_id = ?
      `, [...reportIds, pathologistId]);

      if (currentStatusResults.length !== reportIds.length) {
        throw new Error('Some reports not found or access denied');
      }

      // Update all reports
      let updateQuery = '';
      let updateParams = [];

      if (status.toLowerCase() === 'approved') {
        updateQuery = `
          UPDATE reports 
          SET status = 'approved', 
              approved_at = NOW(), 
              rejected_at = NULL,
              comments = ?,
              rejection_reason = NULL,
              updated_at = NOW()
          WHERE id IN (${placeholders})
        `;
        updateParams = [comments || 'Bulk approved', ...reportIds];
      } else {
        updateQuery = `
          UPDATE reports 
          SET status = 'rejected', 
              rejected_at = NOW(), 
              approved_at = NULL,
              comments = ?,
              rejection_reason = ?,
              updated_at = NOW()
          WHERE id IN (${placeholders})
        `;
        updateParams = [comments || 'Bulk rejected', rejectionReason || 'Bulk rejection', ...reportIds];
      }

      await pool.execute(updateQuery, updateParams);

      // Add audit trail entries for each report
      const auditDetails = status === 'rejected' 
        ? `${comments || 'Bulk status change'} - ${rejectionReason || ''}`
        : comments || 'Bulk status change';

      for (const reportData of currentStatusResults) {
        const auditQuery = `
          INSERT INTO report_audit_trail (report_id, action, user, details, timestamp)
          VALUES (?, ?, ?, ?, NOW())
        `;

        await pool.query(auditQuery, [
          reportData.id,
          `Bulk Status Changed from ${reportData.currentStatus} to ${status}`,
          currentUser,
          auditDetails.trim()
        ]);
      }

      // Commit transaction
      await pool.query('COMMIT');

      res.status(200).json({
        success: true,
        message: `${reportIds.length} reports ${status.toLowerCase()} successfully`
      });

    } catch (error) {
      // Rollback transaction
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Bulk update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating report status'
    });
  }
};

module.exports = {
  getReports,
  getFilterOptions,
  updateReportStatus,
  bulkUpdateReportStatus,
  getReportById,
  addAuditTrailEntry
};