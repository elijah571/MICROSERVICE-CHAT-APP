const Media = require('../model/media.model');
const { uploadToCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const uploadMedia = async (req, res) => {
  logger.info('Media endpoint hit.');

  try {
    if (!req.file) {
      logger.error('No file found. Please add a file and try again.');

      return res.status(400).json({
        success: false,
        message: 'No file found, please add a file and try again',
      });
    }

    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);

    const uploadResult = await uploadToCloudinary(req.file);
    logger.info('Cloudinary upload successful');

    const newMedia = new Media({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      userId,
    });

    await newMedia.save();

    return res.status(201).json({
      success: true,
      mediaId: newMedia._id,
      url: newMedia.url,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    logger.error('Error uploading media', error);

    return res.status(500).json({
      success: false,
      message: 'Error uploading media',
    });
  }
};

const getAllMedia = async (req, res) => {
  try {
    const result = await Media.find({});
    res.json({ result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error uploading media',
    });
  }
};

module.exports = { uploadMedia, getAllMedia };
