const amqp = require("amqplib");

async function connectRabbitMQ() {
  while (true) {
    try {
      console.log("Connecting to RabbitMQ...");
      const conn = await amqp.connect("amqp://rabbitmq");
      console.log("Connected to RabbitMQ");
      return conn;
    } catch (err) {
      console.error("RabbitMQ connection failed, retrying...");
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

async function publish(queue, message) {
  try {
    const conn = await connectRabbitMQ();
    const channel = await conn.createChannel();

    await channel.assertQueue(queue, {
        durable: false
    });

    console.log("Publishing message:", message);

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

    await channel.close();
    await conn.close();

  } catch (err) {
    console.error("Publish error:", err);
  }
}

module.exports = { publish };
