// src/controllers/testResultsController.js
const { pool } = require('../config/db');

// @desc    Save comment for specific test result
// @route   POST /api/test-results/:testResultId/comment
// @access  Private
const saveTestComment = async (req, res) => {
  try {
    const { testResultId } = req.params;
    const { comment, pathologist_id, report_id } = req.body;
    const userId = req.user?.id;

    console.log('Saving test comment:', { 
      testResultId, 
      comment: comment?.substring(0, 50) + '...', 
      pathologist_id, 
      report_id, 
      userId 
    });

    // Validate input
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment too long (max 1000 characters)'
      });
    }

    // First, verify the test result exists and belongs to a report the pathologist can access
    const verifyQuery = `
      SELECT tr.id, tr.report_id, r.pathologist_id, t.test_name
      FROM test_results tr
      INNER JOIN reports r ON tr.report_id = r.id
      LEFT JOIN tests t ON tr.test_id = t.id
      WHERE tr.id = ? AND r.pathologist_id = ?
    `;

    const [verifyResults] = await pool.query(verifyQuery, [testResultId, userId]);

    if (verifyResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found or access denied'
      });
    }

    const testName = verifyResults[0].test_name || `Test ID ${testResultId}`;

    // Update the test result with the comment
    const updateQuery = `
      UPDATE test_results 
      SET pathologist_comment = ?, 
          updated_at = NOW()
      WHERE id = ?
    `;

    const [updateResult] = await pool.query(updateQuery, [comment.trim(), testResultId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update test result'
      });
    }

    // Log audit trail entry with test name and comment content
    const currentUser = req.user.name || req.user.username || `User ${req.user.id}`;
    const auditQuery = `
      INSERT INTO report_audit_trail (report_id, action, user, details, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;

    // Include the actual comment in the audit trail
    const auditDetails = `Comment added for test: ${testName}\nComment: "${comment.trim()}"`;

    await pool.query(auditQuery, [
      verifyResults[0].report_id,
      'Test Comment Added',
      currentUser,
      auditDetails
    ]);

    res.json({
      success: true,
      message: 'Test comment saved successfully',
      data: {
        testResultId: testResultId,
        comment: comment.trim(),
        reportId: verifyResults[0].report_id
      }
    });

  } catch (error) {
    console.error('Error saving test comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get test comment
// @route   GET /api/test-results/:testResultId/comment
// @access  Private
const getTestComment = async (req, res) => {
  try {
    const { testResultId } = req.params;
    const userId = req.user?.id;

    // Get the test result with comment, ensuring user has access
    const query = `
      SELECT tr.pathologist_comment, tr.id, tr.report_id
      FROM test_results tr
      INNER JOIN reports r ON tr.report_id = r.id
      WHERE tr.id = ? AND r.pathologist_id = ?
    `;

    const [results] = await pool.query(query, [testResultId, userId]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found or access denied'
      });
    }

    res.json({
      success: true,
      data: {
        testResultId: testResultId,
        comment: results[0].pathologist_comment || '',
        reportId: results[0].report_id
      }
    });

  } catch (error) {
    console.error('Error getting test comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// @desc    Delete test comment
// @route   DELETE /api/test-results/:testResultId/comment
// @access  Private
const deleteTestComment = async (req, res) => {
  try {
    const { testResultId } = req.params;
    const userId = req.user?.id;

    // First, verify the test result exists and belongs to a report the pathologist can access
    const verifyQuery = `
      SELECT tr.id, tr.report_id, r.pathologist_id, t.test_name
      FROM test_results tr
      INNER JOIN reports r ON tr.report_id = r.id
      LEFT JOIN tests t ON tr.test_id = t.id
      WHERE tr.id = ? AND r.pathologist_id = ?
    `;

    const [verifyResults] = await pool.query(verifyQuery, [testResultId, userId]);

    if (verifyResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found or access denied'
      });
    }

    const testName = verifyResults[0].test_name || `Test ID ${testResultId}`;

    // Get the existing comment before deleting it (for audit trail)
    const getCommentQuery = `SELECT pathologist_comment FROM test_results WHERE id = ?`;
    const [commentResult] = await pool.query(getCommentQuery, [testResultId]);
    const existingComment = commentResult[0]?.pathologist_comment || '';

    // Clear the comment
    const updateQuery = `
      UPDATE test_results 
      SET pathologist_comment = NULL, 
          updated_at = NOW()
      WHERE id = ?
    `;

    const [updateResult] = await pool.query(updateQuery, [testResultId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }

    // Log audit trail entry with test name and deleted comment content
    const currentUser = req.user.name || req.user.username || `User ${req.user.id}`;
    const auditQuery = `
      INSERT INTO report_audit_trail (report_id, action, user, details, timestamp)
      VALUES (?, ?, ?, ?, NOW())
    `;

    const auditDetails = existingComment 
      ? `Comment removed for test: ${testName}\nDeleted comment: "${existingComment}"`
      : `Comment removed for test: ${testName}`;

    await pool.query(auditQuery, [
      verifyResults[0].report_id,
      'Test Comment Deleted',
      currentUser,
      auditDetails
    ]);

    res.json({
      success: true,
      message: 'Test comment deleted successfully',
      data: {
        testResultId: testResultId,
        reportId: verifyResults[0].report_id
      }
    });

  } catch (error) {
    console.error('Error deleting test comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  saveTestComment,
  getTestComment,
  deleteTestComment
};