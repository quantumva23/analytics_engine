const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'analytics-ingestion-api',
  brokers: [process.env.KAFKA_BROKER || '127.0.0.1:9092'],
  connectionTimeout: 10000,     // Give Redpanda up to 10 seconds to respond to initial TCP requests
  authenticationTimeout: 10000, // Give Redpanda up to 10 seconds for the metadata auth handshake
  retry: {
    initialRetryTime: 300,      // Wait slightly longer between initial retries
    retries: 8
  }
});

const producer = kafka.producer();

async function connectProducer() {
  try {
    await producer.connect();
    console.log('⚡ Redpanda (Kafka) Producer connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect Redpanda Producer:', error);
    process.exit(1);
  }
}

async function sendToQueue(topic, message) {
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
  } catch (error) {
    console.error(`❌ Failed to push event to topic ${topic}:`, error);
    throw error;
  }
}

module.exports = { connectProducer, sendToQueue, kafka };