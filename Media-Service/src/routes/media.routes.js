const express = require('express');
const multer = require('multer');
const logger = require('../utils/logger');
const verifyRequest = require('../middleware/authMiddleware');
const { uploadMedia, getAllMedia } = require('../controllers/media.controller');

const router = express.Router();

// Multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('file');

router.post(
  '/upload',
  verifyRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error while uploading:', err);
        return res.status(400).json({
          message: 'Multer error while uploading',
          error: err.message,
        });
      }

      if (err) {
        logger.error('Unknown error occurred while uploading:', err);
        return res.status(500).json({
          message: 'Unknown error while uploading',
          error: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: 'No file found',
        });
      }

      next();
    });
  },
  uploadMedia
);

router.get('/all', verifyRequest, getAllMedia);

module.exports = router;
