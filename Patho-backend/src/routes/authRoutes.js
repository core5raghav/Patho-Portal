// src/routes/authRoutes.js
const express = require('express');
const { 
  loginPathologist, 
  getProfile, 
  updateProfile, 
  changePassword,
  checkUsernameAvailability
} = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/login', loginPathologist);

router.get('/profile', authMiddleware, getProfile);

// Accept multipart: photo + signature, plus normal fields
router.put(
  '/profile',
  authMiddleware,
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'signature', maxCount: 1 }]),
  updateProfile
);

router.put('/change-password', authMiddleware, changePassword);

router.get('/check-username', authMiddleware, checkUsernameAvailability);

module.exports = router;
