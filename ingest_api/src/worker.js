// src/worker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { clickhouse } = require('./clickhouse');
const { liveEmitter } = require('./emitter'); // Import emitter
require('dotenv').config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

connection.on('error', () => {});

const worker = new Worker(
  'clickhouse-writes',
  async (job) => {
    const event = job.data;
    
    const propertiesMap = {};
    if (event.properties && typeof event.properties === 'object') {
      for (const [key, val] of Object.entries(event.properties)) {
        propertiesMap[key] = String(val);
      }
    }

    const eventDate = event.timestamp ? new Date(event.timestamp) : new Date();
    const receivedDate = event.receivedAt ? new Date(event.receivedAt) : new Date();

    const formattedEvent = {
      event: event.event || event.name || 'custom_event',
      projectKey: event.projectKey || 'default_project',
      workspaceId: event.workspaceId || `ws_${(event.projectKey || 'default').slice(0, 8)}`,
      sessionId: event.sessionId || `sid_${Math.random().toString(36).substring(2, 10)}`,
      userId: event.userId || '',
      timestamp: isNaN(eventDate.getTime()) ? new Date().toISOString().replace('T', ' ').replace('Z', '') : eventDate.toISOString().replace('T', ' ').replace('Z', ''),
      receivedAt: isNaN(receivedDate.getTime()) ? new Date().toISOString().replace('T', ' ').replace('Z', '') : receivedDate.toISOString().replace('T', ' ').replace('Z', ''),
      ip: event.ip || '127.0.0.1',
      userAgent: event.userAgent || 'unknown',
      url: event.url || '',
      referrer: event.referrer || '',
      properties: propertiesMap
    };

    try {
      await clickhouse.insert({
        table: 'events',
        values: [formattedEvent],
        format: 'JSONEachRow',
        clickhouse_settings: {
          async_insert: 1,
          wait_for_async_insert: 0
        }
      });
    } catch (insertErr) {
      console.warn('⚠️ ClickHouse insert warning:', insertErr.message);
    }

    // Broadcast the event to any active SSE clients for the real-time view
    liveEmitter.emit('live-event', {
      event: formattedEvent.event,
      projectKey: formattedEvent.projectKey,
      workspaceId: formattedEvent.workspaceId,
      sessionId: formattedEvent.sessionId,
      userId: formattedEvent.userId,
      timestamp: new Date().toLocaleTimeString(),
      ip: formattedEvent.ip,
      url: formattedEvent.url,
      properties: formattedEvent.properties
    });
  },
  { 
    connection,
    concurrency: 15
  }
);

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed writing to ClickHouse: ${err.message}`);
});

console.log('👷 BullMQ Database Worker initialized');

module.exports = { worker };