// src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectProducer, sendToQueue, checkKafkaStatus } = require('./kafka');
const { startConsumer } = require('./consumer');
const { initClickHouse, clickhouse } = require('./clickhouse');
const { liveEmitter } = require('./emitter');

require('./worker');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Global CSP header allowing images, fonts, data URIs and inline styles
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:;");
  next();
});

const { isRateLimited } = require('./rateLimiter');
const { clickhouseQueue, canQueue } = require('./queue');

// Favicon & Root Health Check (prevents 404 CSP warnings in browsers)
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => {
  res.json({
    service: 'Analytics Ingestion API',
    status: 'online',
    port: PORT,
    endpoints: ['POST /ingest', 'GET /ingest', 'GET /api/overview', 'GET /api/funnel', 'GET /api/retention', 'GET /api/live']
  });
});

app.get('/ingest', (req, res) => {
  res.json({
    endpoint: 'POST /ingest',
    method: 'POST',
    description: 'Analytics Event Ingestion Endpoint. Accepts single event or batch payload.',
    payloadExample: {
      projectKey: 'proj_live_test_9876543210',
      event: '$pageview',
      properties: { path: '/home' }
    }
  });
});

// Ingestion Endpoint (Supports single event or batch)
app.post('/ingest', async (req, res) => {
  try {
    const { event, events, name, properties, projectKey, sessionId, userId, timestamp, url, referrer } = req.body;

    const targetKey = projectKey || (events && events[0]?.projectKey) || 'default_project';

    // 1. Rate limiter check (Redis atomic sliding window)
    try {
      const limited = await isRateLimited(targetKey);
      if (limited) {
        return res.status(429).json({ error: 'Rate limit exceeded (Max 100 events/sec)' });
      }
    } catch (rlErr) {
      // If Redis is offline, log warning and allow ingest
      console.warn('⚠️ Rate limiter bypassed (Redis offline):', rlErr.message);
    }

    const rawEventList = Array.isArray(events) ? events : (event || name ? [req.body] : []);

    if (rawEventList.length === 0) {
      return res.status(400).json({ error: 'Missing "event" / "events" payload' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1';
    const clientUa = req.headers['user-agent'] || 'unknown';

    // Normalize and enrich each event
    const enrichedEvents = rawEventList.map((e) => ({
      event: e.event || e.name || 'custom_event',
      properties: e.properties || {},
      projectKey: targetKey,
      workspaceId: `ws_${targetKey.slice(0, 8)}`,
      sessionId: e.sessionId || sessionId || `sid_${Math.random().toString(36).substring(2, 10)}`,
      userId: e.userId || userId || '',
      timestamp: e.timestamp || timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      ip: clientIp,
      userAgent: clientUa,
      url: e.url || url || '',
      referrer: e.referrer || referrer || '',
    }));

    // 2. Dispatch pipeline: Kafka -> BullMQ -> Live Event Emitter
    for (const singleEvent of enrichedEvents) {
      let routed = false;

      if (checkKafkaStatus()) {
        try {
          await sendToQueue('analytics-raw-events', singleEvent);
          routed = true;
        } catch (kafkaErr) {
          routed = false;
        }
      }

      if (!routed && canQueue()) {
        try {
          await clickhouseQueue.add('insert-event', singleEvent, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 1000 },
          });
          routed = true;
        } catch (queueErr) {
          routed = false;
        }
      }

      // Always broadcast event so connected real-time live clients receive it immediately
      liveEmitter.emit('live-event', singleEvent);
    }

    return res.status(202).json({
      success: true,
      accepted: enrichedEvents.length,
      message: `${enrichedEvents.length} event(s) queued for processing`,
    });
  } catch (error) {
    console.error('❌ Ingestion error:', error);
    return res.status(500).json({ error: 'Failed to process event' });
  }
});


// 1. Overview API Endpoint
app.get('/api/overview', async (req, res) => {
  try {
    // DAU Query (Unique IPs over the last 24h)
    const dauQuery = await clickhouse.query({
      query: `SELECT uniq(ip) as dau FROM events WHERE timestamp >= now() - INTERVAL 1 DAY`,
      format: 'JSONEachRow'
    });
    const dauData = await dauQuery.json();

    // MAU Query (Unique IPs over the last 30d)
    const mauQuery = await clickhouse.query({
      query: `SELECT uniq(ip) as mau FROM events WHERE timestamp >= now() - INTERVAL 30 DAY`,
      format: 'JSONEachRow'
    });
    const mauData = await mauQuery.json();

    // Total Events
    const countQuery = await clickhouse.query({
      query: `SELECT count() as total FROM events`,
      format: 'JSONEachRow'
    });
    const countData = await countQuery.json();

    // Top Event Types
    const topQuery = await clickhouse.query({
      query: `SELECT event, count() as count FROM events GROUP BY event ORDER BY count DESC LIMIT 3`,
      format: 'JSONEachRow'
    });
    const topData = await topQuery.json();

    // Trend Query (Last 7 days daily event counts)
    const trendQuery = await clickhouse.query({
      query: `
        SELECT toStartOfDay(timestamp) as day, count() as count 
        FROM events 
        WHERE timestamp >= now() - INTERVAL 7 DAY 
        GROUP BY day 
        ORDER BY day ASC
      `,
      format: 'JSONEachRow'
    });
    const trendData = await trendQuery.json();
    const trendArray = trendData.map(r => parseInt(r.count, 10));

    res.json({
      dau: parseInt(dauData[0]?.dau || 0, 10),
      mau: parseInt(mauData[0]?.mau || 0, 10),
      totalEvents: parseInt(countData[0]?.total || 0, 10),
      topEvents: topData.map(r => ({ event: r.event, count: parseInt(r.count, 10) })),
      trend: trendArray.length ? trendArray : [0, 0, 0, 0, 0, 0, 0]
    });
  } catch (err) {
    console.error('Overview API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Dynamic Funnel Aggregator API Endpoint
app.get('/api/funnel', async (req, res) => {
  try {
    const stepsParam = req.query.steps || 'pageview,signup_completed,purchase';
    const steps = stepsParam.split(',');

    // Build conditional aggregate counts to find unique conversion values
    const conditionalSelect = steps.map((step, idx) => {
      return `uniqIf(ip, event = '${step}') as step_${idx}`;
    }).join(', ');

    const funnelQuery = await clickhouse.query({
      query: `SELECT ${conditionalSelect} FROM events`,
      format: 'JSONEachRow'
    });
    const rawData = await funnelQuery.json();
    const counts = rawData[0] || {};

    // Map query results to the JSON structure our UI component expects
    const maxVal = parseInt(counts['step_0'] || 0, 10);
    const funnelPayload = steps.map((step, idx) => {
      const currentVal = parseInt(counts[`step_${idx}`] || 0, 10);
      return {
        step,
        count: currentVal,
        conversion: maxVal > 0 ? Math.round((currentVal / maxVal) * 100) : 0
      };
    });

    res.json(funnelPayload);
  } catch (err) {
    console.error('Funnel API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. User Cohort Retention Heatmap API Endpoint
app.get('/api/retention', async (req, res) => {
  try {
    const retentionQuery = await clickhouse.query({
      query: `
        WITH 
          cohorts AS (
            SELECT ip as user_id, toStartOfWeek(min(timestamp)) as cohort_week
            FROM events
            GROUP BY user_id
          ),
          activity AS (
            SELECT ip as user_id, toStartOfWeek(timestamp) as active_week
            FROM events
            GROUP BY user_id, active_week
          )
        SELECT 
          formatDateTime(c.cohort_week, '%b %d') as date,
          uniq(c.user_id) as size,
          dateDiff('week', c.cohort_week, a.active_week) as period,
          uniq(a.user_id) as retained
        FROM cohorts c
        JOIN activity a ON c.user_id = a.user_id
        WHERE a.active_week >= c.cohort_week
        GROUP BY cohort_week, period
        ORDER BY cohort_week ASC, period ASC
      `,
      format: 'JSONEachRow'
    });
    const rawRows = await retentionQuery.json();

    // Pivot flat DB relational rows into matrix formats for D3 Heatmap rendering
    const pivoted = {};
    rawRows.forEach(row => {
      const dateStr = row.date;
      if (!pivoted[dateStr]) {
        pivoted[dateStr] = {
          date: dateStr,
          size: parseInt(row.size, 10),
          retention: []
        };
      }
      const period = parseInt(row.period, 10);
      const size = parseInt(row.size, 10);
      const retained = parseInt(row.retained, 10);
      const percent = size > 0 ? Math.round((retained / size) * 100) : 0;
      
      pivoted[dateStr].retention[period] = percent;
    });

    res.json(Object.values(pivoted));
  } catch (err) {
    console.error('Retention API error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Real-time Live Stream SSE Endpoint (Built-in alternative to WebSockets)
app.get('/api/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send an initial keep-alive message
  res.write('comment: join\n\n');

  const onNewEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Listen to the shared emitter and push messages down to browser stream
  liveEmitter.on('live-event', onNewEvent);

  req.on('close', () => {
    liveEmitter.off('live-event', onNewEvent);
    res.end();
  });
});

// Custom 404 handler returning JSON (never emits Express's default-src 'none' HTML)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    message: 'Endpoint not found. Check GET / for active routes.'
  });
});

// Custom error handler returning JSON
app.use((err, req, res, next) => {
  console.error('Ingestion error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function bootstrap() {
  app.listen(PORT, () => {
    console.log(`🚀 Ingestion server active on http://localhost:${PORT}`);
  });

  initClickHouse().catch(err => {
    console.warn('⚠️ ClickHouse connection offline:', err.message);
  });

  connectProducer().then(() => {
    startConsumer().catch(err => {
      console.warn('⚠️ Failed to start Redpanda consumer:', err.message);
    });
  }).catch(err => {
    console.warn('⚠️ Kafka producer offline:', err.message);
  });
}

bootstrap();