const { hasCloudinaryConfig } = require('../config/cloudinary');
const { uploadBufferToCloudinary } = require('../services/image-upload.service');

async function uploadImageHandler(req, res, next) {
  try {
    console.log('🔼 Upload handler called');
    console.log('📎 File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');
    console.log('👤 Auth:', req.auth ? `${req.auth.role}` : 'NOT AUTHENTICATED');

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'An image file is required',
      });
    }

    if (!hasCloudinaryConfig()) {
      console.log('❌ Cloudinary not configured');
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured',
      });
    }

    console.log('☁️ Uploading to Cloudinary...');
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer);

    res.status(201).json({
      success: true,
      data: {
        imageUrl: uploadResult.secure_url,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
        originalFilename: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImageHandler,
};