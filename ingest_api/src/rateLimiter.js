const IORedis = require('ioredis');
require('dotenv').config();

const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  connectTimeout: 5000,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error in rateLimiter:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Rate limiter connected to Redis');
});

const MAX_EVENTS_PER_SECOND = 100;

async function isRateLimited(projectKey) {
  const key = `ratelimit:${projectKey}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 1);
  }

  return count > MAX_EVENTS_PER_SECOND;
}

module.exports = { isRateLimited };