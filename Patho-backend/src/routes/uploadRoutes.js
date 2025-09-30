const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../middlewares/errorMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.body.type || 'general';
    const dest = path.join(uploadDir, subfolder);
    
    // Create subfolder if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'text/plain', 'text/csv'],
    all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain', 'text/csv']
  };

  const uploadType = req.body.uploadType || 'all';
  const allowed = allowedTypes[uploadType] || allowedTypes.all;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} not allowed for ${uploadType} upload`, 400), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private
router.post('/single', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.body.type || 'general'}/${req.file.filename}`
    };

    logger.info(`File uploaded: ${req.file.originalname} by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: fileData
    });
  } catch (error) {
    logger.error('Single file upload error:', error);
    next(error);
  }
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', upload.array('files', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded', 400));
    }

    const filesData = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${req.body.type || 'general'}/${file.filename}`
    }));

    logger.info(`${req.files.length} files uploaded by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: `${req.files.length} files uploaded successfully`,
      data: filesData
    });
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    next(error);
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private
router.delete('/:type/:filename', (req, res, next) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadDir, type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found', 404));
    }

    // Delete file
    fs.unlinkSync(filePath);

    logger.info(`File deleted: ${filename} by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error('File delete error:', error);
    next(error);
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field name', 400));
    }
  }
  next(error);
});

module.exports = router;