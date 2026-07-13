
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBIT_URL;

let connection, channel;

async function connect() {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        console.log('Connected to RabbitMQ');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
            setTimeout(connect, 5000); // Attempt to reconnect
        });
        
        // Handle connection closures
        connection.on('close', () => {
            console.error('RabbitMQ connection closed. Reconnecting...');
            setTimeout(connect, 5000);
        });
    } catch (err) {
        console.error('Failed to connect to RabbitMQ:', err);
        setTimeout(connect, 5000);
    }
}

// ----------------------------------------------------
// Production-ready Pub/Sub pattern using Exchanges
// ----------------------------------------------------

async function publishToExchange(exchangeName, routingKey, data) {
    if (!channel) await connect();
    
    // Assert a 'direct' exchange. durable: true survives broker restarts.
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    
    const messageBuffer = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    
    // Publish message to the exchange
    channel.publish(exchangeName, routingKey, messageBuffer, {
        persistent: true // Ensure message is saved to disk
    });
}

async function subscribeToExchange(exchangeName, routingKey, queueName, callback) {
    if (!channel) await connect();
    
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    
    // Create a durable queue
    const q = await channel.assertQueue(queueName, { durable: true });
    
    // Bind the queue to the exchange with the specific routing key
    await channel.bindQueue(q.queue, exchangeName, routingKey);
    
    channel.consume(q.queue, (message) => {
        if (message !== null) {
            try {
                callback(message.content.toString());
                channel.ack(message); // Acknowledge message only on success
            } catch (err) {
                console.error('Error processing message:', err);
                channel.nack(message, false, false); // Reject/requeue message on failure
            }
        }
    });
}

// ----------------------------------------------------
// Original Point-to-Point (Kept for compatibility)
// ----------------------------------------------------

async function subscribeToQueue(queueName, callback) {
    if (!channel) await connect();
    await channel.assertQueue(queueName, { durable: true });
    channel.consume(queueName, (message) => {
        if (message !== null) {
            try {
                callback(message.content.toString());
                channel.ack(message);
            } catch (err) {
                console.error('Error processing message:', err);
                channel.nack(message, false, false);
            }
        }
    });
}

async function publishToQueue(queueName, data) {
    if (!channel) await connect();
    await channel.assertQueue(queueName, { durable: true });
    const messageBuffer = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    channel.sendToQueue(queueName, messageBuffer, { persistent: true });
}

module.exports = {
    subscribeToQueue,
    publishToQueue,
    publishToExchange,
    subscribeToExchange,
    connect,
};
