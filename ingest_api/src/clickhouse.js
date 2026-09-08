// C:\Users\analytics_engine\ingest_api\src\clickhouse.js
const { createClient } = require('@clickhouse/client');
require('dotenv').config();

const clickhouse = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://127.0.0.1:8123',
  username: process.env.CLICKHOUSE_USER || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || 'clickhouse123',
  database: process.env.CLICKHOUSE_DB || 'analytics',
});

async function initClickHouse() {
  try {
    // 1. Establish an admin client targeting default to build our analytics DB
    const adminClient = createClient({
      host: process.env.CLICKHOUSE_HOST || 'http://127.0.0.1:8123',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || 'clickhouse123',
    });

    // Use .command instead of .exec so ClickHouse automatically drains the stream
    await adminClient.command({
      query: `CREATE DATABASE IF NOT EXISTS ${process.env.CLICKHOUSE_DB || 'analytics'}`,
      clickhouse_settings: { wait_end_of_query: 1 },
    });
    await adminClient.close();

    // 2. Build the columnar table using the primary client
    // Use .command instead of .exec so ClickHouse automatically drains the stream
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS events (
          event String,
          projectKey String,
          workspaceId String,
          sessionId String,
          userId String,
          timestamp DateTime64(3),
          receivedAt DateTime64(3),
          ip String,
          userAgent String,
          url String,
          referrer String,
          properties Map(String, String)
        ) ENGINE = MergeTree()
        ORDER BY (workspaceId, projectKey, event, timestamp)
      `,
      clickhouse_settings: { wait_end_of_query: 1 },
    });

    console.log('📊 ClickHouse: Database and "events" table verified/created');
  } catch (err) {
    console.error('❌ ClickHouse initialization error:', err.message);
    // Do not crash server if ClickHouse is not yet running in dev
  }
}

// Make sure BOTH clickhouse and initClickHouse are exported here
module.exports = { clickhouse, initClickHouse };