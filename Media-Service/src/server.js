require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/dataBase');
const Redis = require('ioredis');
const logger = require('./utils/logger');
const mediaRoutes = require('./routes/media.routes');
const errorHandler = require('./middleware/error');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./events/mediaEvent');
const app = express();
connectDB();

const redisClient = new Redis(process.env.REDIS_URL);

//middleware

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url} `);
  logger.info(`Request body,  ${req.body} } `);
  next();
});

app.use('/api/media', mediaRoutes);

app.use(errorHandler);
async function startServer() {
  try {
    await connectRabbitMQ();
    //consume  all event
    await consumeEvent('post.deleted', handlePostDeleted);
  } catch (error) {
    logger.error('failed to  connect to rabbit mq', error);
    process.exit(1);
  }
}

startServer();

app.listen(process.env.PORT, () =>
  logger.info(`Media Service running on port: ${process.env.PORT}`)
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('unhandledRejection at ', promise, 'reason:', reason);
});
