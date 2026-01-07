const logger = require('../utils/logger');

const verifyRequest = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    logger.warn(`Access attempted without user ID`);
    return res.status(401).json({
      success: false,
      message: 'Authentification required please login to continue',
    });
  }
  req.user = { userId };
  next();
};

module.exports = verifyRequest;
