require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/dataBase');
const Redis = require('ioredis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/error');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const searchRoutes = require('./routes/search.routes');
const {
  handlePostCreation,
  handlePostDeletion,
} = require('./events/searchEvent');
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

app.use('/api/search', searchRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();

    //consume   events
    await consumeEvent('post.created', handlePostCreation);
    await consumeEvent('post.deleted', handlePostDeletion);
  } catch (error) {
    logger.error('failed to  connect to rabbit mq', error);
    process.exit(1);
  }
}

startServer();

app.listen(process.env.PORT, () =>
  logger.info(`Search Service running on port: ${process.env.PORT}`)
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('unhandledRejection at ', promise, 'reason:', reason);
});
