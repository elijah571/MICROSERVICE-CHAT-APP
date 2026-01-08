require('dotenv').config();
const amqp = require('amqplib');
const axios = require('axios');
const logger = console; // replace with your logger if needed

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

const EXCHANGE_NAME = 'facebook_events';

async function startBridge() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
  const q = await channel.assertQueue('', { exclusive: true });

  // Subscribe to all events
  await channel.bindQueue(q.queue, EXCHANGE_NAME, '#');

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const content = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      logger.info(`Forwarding ${routingKey} to n8n:`, content);

      await axios.post(`${N8N_WEBHOOK_URL}/${routingKey}`, content);
      channel.ack(msg);
    } catch (err) {
      logger.error('Failed to forward message to n8n', err);
      channel.nack(msg, false, false);
    }
  });

  logger.info('n8n Bridge listening for RabbitMQ events...');
}

startBridge().catch(console.error);
