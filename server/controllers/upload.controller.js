const { hasCloudinaryConfig } = require('../config/cloudinary');
const { uploadBufferToCloudinary } = require('../services/image-upload.service');

async function uploadImageHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'An image file is required',
      });
    }

    if (!hasCloudinaryConfig()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured',
      });
    }

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