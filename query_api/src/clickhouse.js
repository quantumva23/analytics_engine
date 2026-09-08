const { createClient } = require('@clickhouse/client');

const client = createClient({
  url: 'http://127.0.0.1:8123',
  username: 'default',
  password: 'clickhouse123',
  database: 'analytics',
  request_timeout: 10000,
});

module.exports = { client };