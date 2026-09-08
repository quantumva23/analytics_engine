const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'analytics-ingestion-api',
  brokers: [process.env.KAFKA_BROKER || '127.0.0.1:9092'],
  connectionTimeout: 2000,
  authenticationTimeout: 2000,
  retry: {
    initialRetryTime: 100,
    retries: 1
  }
});

const producer = kafka.producer();

let isKafkaConnected = false;

async function connectProducer() {
  try {
    await producer.connect();
    isKafkaConnected = true;
    console.log('⚡ Redpanda (Kafka) Producer connected successfully');
  } catch (error) {
    isKafkaConnected = false;
    console.warn('⚠️ Redpanda Producer offline (will use resilient fallback queue):', error.message);
  }
}

async function sendToQueue(topic, message) {
  if (!isKafkaConnected) {
    throw new Error('Kafka producer is disconnected');
  }
  return await producer.send({
    topic,
    messages: [
      { value: JSON.stringify(message) },
    ],
  });
}

function checkKafkaStatus() {
  return isKafkaConnected;
}

module.exports = { connectProducer, sendToQueue, kafka, checkKafkaStatus };