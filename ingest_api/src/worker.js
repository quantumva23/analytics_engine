// src/worker.js
const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { client } = require('./clickhouse');
require('dotenv').config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'clickhouse-writes',
  async (job) => {
    const event = job.data;

    await client.insert({
      table: 'events',
      values: [
        {
          workspace_id: event.workspaceId,
          event_name: event.event,
          properties: JSON.stringify(event.properties || {}),
          session_id: event.sessionId || 'unknown',
          timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
      ],
      format: 'JSONEachRow',
    });

    console.log(`📥 [DB Worker] Inserted event: "${event.event}" for Workspace: ${event.workspaceId}`);
  },
  {
    connection,
    concurrency: 10,
  }
);

worker.on('completed', (job) => {
  // Silent success to prevent log flooding during high load
});

worker.on('failed', (job, err) => {
  console.error(`❌ DB Insert Job ${job.id} failed: ${err.message}`);
});

console.log('👷 BullMQ Database Worker listening for jobs...');

module.exports = { worker };