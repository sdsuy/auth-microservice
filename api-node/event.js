const amqp = require("amqplib");
const CircuitBreaker = require("./circuitBreaker");

const breaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTime: 5000,
});

async function connectRabbitMQ() {
  const conn = await amqp.connect("amqp://rabbitmq");
  return conn;
}

async function publish(queue, message) {
  try {
    await breaker.execute(async () => {
      console.log("Connecting to RabbitMQ...");

      const conn = await connectRabbitMQ();
      const channel = await conn.createChannel();

      await channel.assertQueue(queue, {
          durable: false
      });

      console.log("Publishing message:", message);

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

      await channel.close();
      await conn.close();
    });

  } catch (err) {
    console.error("⚠️ Publish blocked or failed:", err.message);
    throw err;
  }
}

module.exports = { publish };
