const amqp = require("amqplib");

async function publish(queue, message) {
  const conn = await amqp.connect("amqp://rabbitmq");
  const channel = await conn.createChannel();

  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

  setTimeout(() => conn.close(), 500);
}

module.exports = { publish };
