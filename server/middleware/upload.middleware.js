const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      const error = new Error('Only image files are allowed');
      error.statusCode = 400;
      return callback(error);
    }

    return callback(null, true);
  },
});

const uploadSingleImage = upload.single('image');

module.exports = {
  uploadSingleImage,
};