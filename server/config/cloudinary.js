const cloudinary = require('cloudinary').v2;

let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) {
    return cloudinary;
  }

  const cloudinaryUrl = String(process.env.CLOUDINARY_URL || '').trim();

  if (cloudinaryUrl) {
    cloudinary.config(cloudinaryUrl);
    isConfigured = true;
    return cloudinary;
  }

  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL or the CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET variables.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
  return cloudinary;
}

function hasCloudinaryConfig() {
  const hasUrl = Boolean(String(process.env.CLOUDINARY_URL || '').trim());
  const hasEnvVars = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  console.log('🌩️ Cloudinary Config Check:');
  console.log('   CLOUDINARY_URL:', hasUrl ? '✅ SET' : '❌ NOT SET');
  console.log('   CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ NOT SET');
  console.log('   API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET');
  console.log('   API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET');
  console.log('   Result:', (hasUrl || hasEnvVars) ? '✅ READY' : '❌ MISSING CONFIG');

  return hasUrl || hasEnvVars;
}

module.exports = {
  cloudinary,
  ensureCloudinaryConfigured,
  hasCloudinaryConfig,
};