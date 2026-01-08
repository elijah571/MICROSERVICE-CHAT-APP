const amqp = require('amqplib');
const forwardToN8n = require('./forwardToN8n');

const EXCHANGE = 'facebook_events';

async function startRabbitConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE, 'topic', { durable: false });
  const q = await channel.assertQueue('', { exclusive: true });

  const events = ['post.created', 'post.deleted'];

  for (const event of events) {
    await channel.bindQueue(q.queue, EXCHANGE, event);
  }

  channel.consume(q.queue, async (msg) => {
    if (!msg) return;

    try {
      const payload = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;

      await forwardToN8n(routingKey, payload);
      channel.ack(msg);
    } catch (err) {
      console.error('Failed to forward event to n8n', err.message);
      channel.nack(msg, false, true); // retry
    }
  });

  console.log('n8n bridge listening for RabbitMQ events...');
}

module.exports = startRabbitConsumer;
