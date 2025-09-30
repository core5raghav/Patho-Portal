// src/middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // prefix user id + fieldname + timestamp to avoid clashes
    const safe = `${(req.user?.id || 'anon')}-${file.fieldname}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Only JPG/PNG/WEBP images are allowed'));
  cb(null, true);
};

const limits = { fileSize: 2 * 1024 * 1024 }; // 2MB

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
