const { PassThrough } = require('stream');
const { ensureCloudinaryConfigured } = require('../config/cloudinary');

function uploadBufferToCloudinary(buffer, options = {}) {
  const cloudinary = ensureCloudinaryConfigured();
  const uploadOptions = {
    folder: options.folder || process.env.CLOUDINARY_FOLDER || 'mkusssa/uploads',
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return reject(error);
      }

      return resolve(result);
    });

    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
}

module.exports = {
  uploadBufferToCloudinary,
};