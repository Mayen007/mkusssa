const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth.middleware');
const { uploadSingleImage } = require('../middleware/upload.middleware');
const { uploadImageHandler } = require('../controllers/upload.controller');

const router = express.Router();

console.log('📦 Registering upload routes...');

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Upload endpoint is available' });
});

// Image upload endpoint
router.post('/image', authenticateToken, authorizeRoles('admin', 'editor'), uploadSingleImage, uploadImageHandler);

module.exports = router;