const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isOperational = statusCode < 500;

  // Normalize error
  if (!(err instanceof Error)) {
    err = new Error(String(err));
  }

  // Log only server errors
  if (!isOperational) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const response = {
    message: isOperational ? err.message : 'Internal server error',
  };

  // Only expose stack in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
