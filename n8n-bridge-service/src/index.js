require('dotenv').config();
const startRabbitConsumer = require('./rabbitmq');

startRabbitConsumer().catch((err) => {
  console.error('Bridge failed to start', err);
  process.exit(1);
});
