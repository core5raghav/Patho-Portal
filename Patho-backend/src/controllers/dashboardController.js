// src/controllers/dashboardController.js
const { pool } = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const pathologistId = req.user.id;
    console.log('Fetching dashboard stats for pathologist:', pathologistId);
    
    // Get camp statistics
    const [campStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_camps,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_camps,
        SUM(CASE WHEN camp_start_date > CURDATE() THEN 1 ELSE 0 END) as upcoming_camps
      FROM camps 
      WHERE pathologist_id = ?
    `, [pathologistId]);

    // Get patient statistics
    const [patientStats] = await pool.execute(`
      SELECT COUNT(*) as total_patients
      FROM patients p
      INNER JOIN camps c ON p.camp_id = c.id
      WHERE c.pathologist_id = ? AND p.deleted_at IS NULL
    `, [pathologistId]);

    // Get report statistics
    const [reportStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports
      FROM reports 
      WHERE pathologist_id = ?
    `, [pathologistId]);

    // Get test result statistics based on actual data and reference ranges
    const [testResults] = await pool.execute(`
      SELECT 
        tr.id,
        tr.value,
        tr.reference_range,
        tr.is_abnormal,
        t.male_upper_range,
        t.male_lower_range,
        t.female_upper_range,
        t.female_lower_range,
        t.child_upper_range,
        t.child_lower_range,
        p.gender,
        p.age
      FROM test_results tr
      INNER JOIN reports r ON tr.report_id = r.id
      INNER JOIN tests t ON tr.test_id = t.id
      INNER JOIN patients p ON r.patient_id = p.id
      WHERE r.pathologist_id = ?
    `, [pathologistId]);

    // Calculate normal and abnormal tests based on reference ranges
    let normalTests = 0;
    let abnormalTests = 0;

    testResults.forEach(result => {
      const value = parseFloat(result.value);
      const gender = result.gender;
      const age = result.age;
      let upperRange, lowerRange;

      // Determine which reference range to use based on gender and age
      if (age < 18) {
        // If age is less than 18, use child ranges
        upperRange = parseFloat(result.child_upper_range);
        lowerRange = parseFloat(result.child_lower_range);
      } else if (gender === 'male') {
        // If gender is male, use male ranges
        upperRange = parseFloat(result.male_upper_range);
        lowerRange = parseFloat(result.male_lower_range);
      } else if (gender === 'female') {
        // If gender is female, use female ranges
        upperRange = parseFloat(result.female_upper_range);
        lowerRange = parseFloat(result.female_lower_range);
      } else {
        // Default to male range if gender is not specified or other
        upperRange = parseFloat(result.male_upper_range);
        lowerRange = parseFloat(result.male_lower_range);
      }

      // Check if value is within normal range (inclusive of bounds)
      // Normal: value >= lowerRange AND value <= upperRange
      // Abnormal: value < lowerRange OR value > upperRange
      if (value >= lowerRange && value <= upperRange) {
        normalTests++;
      } else {
        abnormalTests++;
      }
    });

    const testStats = {
      normal_tests: normalTests,
      abnormal_tests: abnormalTests
    };

    // Get recent camp activity
    const [recentActivity] = await pool.execute(`
      SELECT 
        c.camp_name,
        c.location,
        c.updated_at,
        COUNT(p.id) as patient_count
      FROM camps c
      LEFT JOIN patients p ON c.id = p.camp_id AND p.deleted_at IS NULL
      WHERE c.pathologist_id = ?
      GROUP BY c.id, c.camp_name, c.location, c.updated_at
      ORDER BY c.updated_at DESC
      LIMIT 5
    `, [pathologistId]);

    const response = {
      success: true,
      data: {
        camps: {
          total: parseInt(campStats[0].total_camps) || 0,
          active: parseInt(campStats[0].active_camps) || 0,
          upcoming: parseInt(campStats[0].upcoming_camps) || 0
        },
        patients: {
          total: parseInt(patientStats[0].total_patients) || 0
        },
        reports: {
          total: parseInt(reportStats[0].total_reports) || 0,
          approved: parseInt(reportStats[0].approved_reports) || 0,
          pending: parseInt(reportStats[0].pending_reports) || 0,
          rejected: parseInt(reportStats[0].rejected_reports) || 0
        },
        tests: testStats,
        recentActivity: recentActivity.map(activity => ({
          camp_name: activity.camp_name,
          location: activity.location,
          patient_count: activity.patient_count,
          updated_at: activity.updated_at,
          description: `${activity.patient_count} patients registered`
        }))
      }
    };

    console.log('Dashboard stats response:', response);
    res.status(200).json(response);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get detailed camp statistics
// @route   GET /api/dashboard/camps
// @access  Private
const getCampDetails = async (req, res) => {
  try {
    const pathologistId = req.user.id;
    
    const [camps] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as patient_count,
        COUNT(DISTINCT r.id) as report_count
      FROM camps c
      LEFT JOIN patients p ON c.id = p.camp_id AND p.deleted_at IS NULL
      LEFT JOIN reports r ON c.id = r.camp_id
      WHERE c.pathologist_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [pathologistId]);

    res.status(200).json({
      success: true,
      data: camps
    });

  } catch (error) {
    console.error('Camp details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching camp details'
    });
  }
};

module.exports = {
  getDashboardStats,
  getCampDetails
};