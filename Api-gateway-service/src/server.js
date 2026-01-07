require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const proxy = require('express-http-proxy');
const logger = require('./util/logger');
const errorHandler = require('./middleware/errorhandler');
const validateToken = require('./middleware/authMiddleware');
const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiting
const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpointnrate limit exceeded forIP: ${req.ip}`);
    res.status(429).json({ success: false, message: 'Too many requests' });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(ratelimitOptions);

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url} `);
  logger.info(`Request body,  ${req.body} } `);
  next();
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api');
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  },
};

//setting  proxy for identity service
app.use(
  '/v1/auth',
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Identity service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

//setting  proxy for Post service
app.use(
  '/v1/posts',
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Post service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

//setting  proxy for Media service
app.use(
  '/v1/media',
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
      const contentType = srcReq.headers['content-type'];
      if (!contentType || !contentType.startsWith('multipart/form-data')) {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
      }

      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Media service: ${proxyRes.statusCode}`
      );
      return proxyResData;
      parseReqBody: false;
    },
  })
);

//setting  proxy for Search service
app.use(
  '/v1/search',
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response received from Search service: ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Api Gateway running on port: ${PORT}`);
  logger.info(
    `Identity servicerunning on port: ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(`Post servicerunning on port: ${process.env.POST_SERVICE_URL}`);
  logger.info(`Media servicerunning on port: ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(
    `Search servicerunning on port: ${process.env.SEARCH_SERVICE_URL}`
  );
  logger.info(`service is  running on port: ${process.env.REDIS_URL}`);
});
