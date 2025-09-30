// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @desc    Login pathologist
// @route   POST /api/auth/login
// @access  Public
const loginPathologist = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    let query, params;
    if (email) {
      query = 'SELECT * FROM pathologists WHERE email = ?';
      params = [email];
    } else {
      query = 'SELECT * FROM pathologists WHERE username = ?';
      params = [username];
    }

    const [rows] = await pool.execute(query, params);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials - user not found' });
    }

    const pathologist = rows[0];

    // verify password, support $2y$ hashes
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, pathologist.password);
      if (!isPasswordValid && pathologist.password.startsWith('$2y$')) {
        const convertedHash = pathologist.password.replace(/^\$2y\$/, '$2b$');
        isPasswordValid = await bcrypt.compare(password, convertedHash);
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Password verification failed' });
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials - password mismatch' });
    }

    const tokenPayload = {
      id: pathologist.id,
      user_id: pathologist.user_id,
      email: pathologist.email,
      username: pathologist.username,
      role: pathologist.role,
      designation: pathologist.designation
    };
    const token = generateToken(tokenPayload);

    try {
      await pool.execute('UPDATE pathologists SET updated_at = NOW() WHERE id = ?', [pathologist.id]);
    } catch {}

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: pathologist.id,
        user_id: pathologist.user_id,
        name: pathologist.name,
        designation: pathologist.designation,
        username: pathologist.username,
        email: pathologist.email,
        role: pathologist.role,
        contact: pathologist.contact,
        state: pathologist.state,
        city: pathologist.city,
        photo: pathologist.photo
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current pathologist profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, name, designation, username, email, gender, dob, contact, 
              state, city, address, pincode, photo, signature, role, created_at, updated_at 
       FROM pathologists WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pathologist not found' });
    }

    res.status(200).json({ success: true, user: rows[0] });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error getting profile' });
  }
};

// @desc    Check if username is available (excluding current user)
// @route   GET /api/auth/check-username?username=foo
// @access  Private
const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, message: 'username is required' });
    }
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM pathologists WHERE username = ? AND id <> ?',
      [username, req.user.id]
    );
    const available = rows[0].cnt === 0;
    res.status(200).json({ success: true, available });
  } catch (error) {
    console.error('checkUsernameAvailability error:', error);
    res.status(500).json({ success: false, message: 'Server error checking username' });
  }
};

// @desc    Update pathologist profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      username,
      designation,
      contact,
      state,
      city,
      address,
      pincode,
      email
    } = req.body;

    const pathologistId = req.user.id;

    // If client attempts to change username, enforce uniqueness
    if (username !== undefined) {
      const [rowsU] = await pool.execute(
        'SELECT COUNT(*) AS cnt FROM pathologists WHERE username = ? AND id <> ?',
        [username, pathologistId]
      );
      if (rowsU[0].cnt > 0) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    // Build absolute URLs if files were uploaded
    const host = `${req.protocol}://${req.get('host')}`;
    const uploadedPhoto = req.files?.photo?.[0] ? `${host}/uploads/${req.files.photo[0].filename}` : undefined;
    const uploadedSignature = req.files?.signature?.[0] ? `${host}/uploads/${req.files.signature[0].filename}` : undefined;

    // Helper to map undefined -> null for COALESCE
    const n = (v) => (v === undefined ? null : v);

    await pool.execute(
      `UPDATE pathologists 
       SET
         name        = COALESCE(?, name),
         username    = COALESCE(?, username),
         designation = COALESCE(?, designation),
         photo       = COALESCE(?, photo),
         signature   = COALESCE(?, signature),
         contact     = COALESCE(?, contact),
         state       = COALESCE(?, state),
         city        = COALESCE(?, city),
         address     = COALESCE(?, address),
         pincode     = COALESCE(?, pincode),
         email       = COALESCE(?, email),
         updated_at  = NOW()
       WHERE id = ?`,
      [
        n(name),
        n(username),
        n(designation),
        n(uploadedPhoto),
        n(uploadedSignature),
        n(contact),
        n(state),
        n(city),
        n(address),
        n(pincode),
        n(email),
        pathologistId
      ]
    );

    const [rows] = await pool.execute(
      `SELECT id, user_id, name, designation, username, email, gender, dob, contact, 
              state, city, address, pincode, photo, signature, role, created_at, updated_at 
       FROM pathologists WHERE id = ?`,
      [pathologistId]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};



// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const pathologistId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    const [rows] = await pool.execute('SELECT password FROM pathologists WHERE id = ?', [pathologistId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let isCurrentPasswordValid = false;
    try {
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!isCurrentPasswordValid && rows[0].password.startsWith('$2y$')) {
        const convertedHash = rows[0].password.replace(/^\$2y\$/, '$2b$');
        isCurrentPasswordValid = await bcrypt.compare(currentPassword, convertedHash);
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error verifying current password' });
    }

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.execute(
      'UPDATE pathologists SET password = ?, re_password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, hashedNewPassword, pathologistId]
    );

    res.status(200).json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};

module.exports = {
  loginPathologist,
  getProfile,
  updateProfile,
  changePassword,
  checkUsernameAvailability
};
