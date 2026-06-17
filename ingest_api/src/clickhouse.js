// src/clickhouse.js
const { createClient } = require('@clickhouse/client');

const client = createClient({
  url: 'http://localhost:8123',
  username: 'default',
  password: 'clickhouse123',
  database: 'analytics',
});

module.exports = { client };