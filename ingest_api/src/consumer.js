// src/consumer.js
const { kafka } = require('./kafka');
const { clickhouseQueue } = require('./queue');

const consumer = kafka.consumer({ groupId: 'analytics-ingestion-group' });

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'analytics-raw-events', fromBeginning: true });
  console.log('📡 Redpanda Consumer running and subscribing to [analytics-raw-events]');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const rawValue = message.value.toString();
        const eventData = JSON.parse(rawValue);

        await clickhouseQueue.add('insert-event', eventData, {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        });
      } catch (err) {
        console.error('❌ Error processing message in Redpanda consumer:', err);
      }
    },
  });
}

module.exports = { startConsumer };