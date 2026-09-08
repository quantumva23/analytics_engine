// src/queue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

let isRedisConnected = false;

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
});

connection.on('connect', () => {
  isRedisConnected = true;
  console.log('✅ BullMQ Redis connected');
});

connection.on('error', () => {
  isRedisConnected = false;
});

connection.on('close', () => {
  isRedisConnected = false;
});

// Attempt non-blocking connection
connection.connect().catch(() => {});

const clickhouseQueue = new Queue('clickhouse-writes', { connection });

function canQueue() {
  return isRedisConnected;
}

console.log('🏎️  BullMQ Queue initialized (backed by Redis)');

module.exports = { clickhouseQueue, connection, canQueue };