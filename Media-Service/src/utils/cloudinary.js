const logger = require('./logger');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  timeout: 60000, // ✅ 60 seconds
});

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'media-service',
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload failed', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info('media deleted from cloud storage', publicId);
    return result;
  } catch (error) {
    logger.error('Error deleting media from cloudinary', error);
  }
};
module.exports = { uploadToCloudinary, deleteMediaFromCloudinary };
