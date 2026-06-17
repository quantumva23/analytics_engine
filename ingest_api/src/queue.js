// src/queue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

// BullMQ demands that "maxRetriesPerRequest" be set to null on its Redis instance
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

const clickhouseQueue = new Queue('clickhouse-writes', { connection });

console.log('🏎️  BullMQ Queue initialized (backed by Redis)');

module.exports = { clickhouseQueue, connection };