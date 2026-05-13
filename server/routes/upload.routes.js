const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');
const { uploadImageHandler } = require('../controllers/upload.controller');

const router = express.Router();

router.post('/image', authenticateToken, authorizeRoles('admin', 'editor'), uploadSingleImage, uploadImageHandler);

module.exports = router;