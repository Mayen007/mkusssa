const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    console.log('📤 Multer File Filter - Received:', file.originalname, `(${file.mimetype})`);
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      console.log('   ❌ Rejected: Not an image file');
      const error = new Error('Only image files are allowed');
      error.statusCode = 400;
      return callback(error);
    }
    console.log('   ✅ Accepted: Valid image file');
    return callback(null, true);
  },
});

const uploadSingleImage = upload.single('image');

module.exports = {
  uploadSingleImage,
};