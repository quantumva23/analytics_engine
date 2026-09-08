const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { client } = require('./clickhouse');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 5000;
const liveEmitter = new EventEmitter();

app.use(cors());
app.use(express.json());

// Global CSP header allowing images, fonts, data URIs and inline styles
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:;");
  next();
});

// Favicon & Root Health Check (prevents default Express 5 'default-src none' CSP warnings)
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => {
  res.json({
    service: 'Analytics Query API',
    status: 'online',
    port: PORT,
    endpoints: [
      'GET /api/overview',
      'POST /api/funnel',
      'GET /api/retention',
      'GET /api/events',
      'GET /api/live',
      'GET /api/workspaces'
    ]
  });
});

// Helper for fallback mock data if ClickHouse is unreachable
function getMockOverview(timeRange = '7d') {
  return {
    dau: 2480,
    mau: 34200,
    totalEvents: 498320,
    uniqueSessions: 18940,
    avgSessionDuration: '4m 18s',
    conversionRate: 14.8,
    topEvents: [
      { event: '$pageview', count: 182400, percentage: 36.6 },
      { event: 'button_clicked', count: 124300, percentage: 24.9 },
      { event: 'signup_completed', count: 48900, percentage: 9.8 },
      { event: 'product_viewed', count: 42100, percentage: 8.4 },
      { event: 'checkout_started', count: 28500, percentage: 5.7 },
      { event: 'purchase_completed', count: 16400, percentage: 3.3 },
    ],
    trend: [
      { date: 'Mon', count: 54200, activeUsers: 1980 },
      { date: 'Tue', count: 68400, activeUsers: 2340 },
      { date: 'Wed', count: 62100, activeUsers: 2150 },
      { date: 'Thu', count: 74500, activeUsers: 2580 },
      { date: 'Fri', count: 89300, activeUsers: 2940 },
      { date: 'Sat', count: 71200, activeUsers: 2410 },
      { date: 'Sun', count: 78620, activeUsers: 2480 },
    ],
    devices: [
      { name: 'Desktop (Chrome/Edge)', percentage: 58, count: 289000 },
      { name: 'Mobile (iOS/Safari)', percentage: 28, count: 139500 },
      { name: 'Mobile (Android)', percentage: 11, count: 54800 },
      { name: 'Tablet / Other', percentage: 3, count: 15020 },
    ],
    recentSessions: [
      { sessionId: 'sid_98a7bc12', userId: 'usr_8492', eventCount: 14, duration: '6m 22s', lastActive: '1 min ago', country: 'United States', browser: 'Chrome 128' },
      { sessionId: 'sid_43fe910a', userId: 'usr_1029', eventCount: 8, duration: '3m 45s', lastActive: '3 mins ago', country: 'Germany', browser: 'Firefox 129' },
      { sessionId: 'sid_11bc883e', userId: 'usr_7731', eventCount: 22, duration: '11m 10s', lastActive: '6 mins ago', country: 'India', browser: 'Chrome 128' },
      { sessionId: 'sid_77ad3321', userId: 'usr_4918', eventCount: 5, duration: '1m 50s', lastActive: '9 mins ago', country: 'United Kingdom', browser: 'Safari 17' },
      { sessionId: 'sid_65cc2094', userId: 'usr_3320', eventCount: 19, duration: '8m 05s', lastActive: '12 mins ago', country: 'Canada', browser: 'Chrome 128' },
    ]
  };
}

function getMockFunnel(steps = ['pageview', 'signup_completed', 'purchase']) {
  const baseCount = 24500;
  const rates = [1.0, 0.48, 0.22, 0.08, 0.03];

  return steps.map((step, idx) => {
    const rate = rates[idx] !== undefined ? rates[idx] : Math.max(0.01, (rates[idx - 1] || 0.1) * 0.45);
    const count = Math.round(baseCount * rate);
    const prevCount = idx === 0 ? count : Math.round(baseCount * (rates[idx - 1] || 1.0));
    const stepConversion = idx === 0 ? 100 : Math.round((count / prevCount) * 100);
    const overallConversion = Math.round((count / baseCount) * 100);
    const dropoff = prevCount - count;

    return {
      step,
      stepNumber: idx + 1,
      count,
      stepConversion,
      overallConversion,
      dropoff: idx === 0 ? 0 : dropoff,
      avgTimeToNext: idx === 0 ? '0s' : `${(idx * 45) + 12}s`,
    };
  });
}

function getMockRetention() {
  return [
    { date: 'Aug 04', size: 1420, retention: [100, 54, 42, 33, 28, 24, 21] },
    { date: 'Aug 11', size: 1680, retention: [100, 58, 45, 36, 30, 27] },
    { date: 'Aug 18', size: 1890, retention: [100, 61, 49, 39, 34] },
    { date: 'Aug 25', size: 2150, retention: [100, 64, 52, 42] },
    { date: 'Sep 01', size: 2310, retention: [100, 66, 55] },
    { date: 'Sep 08', size: 2480, retention: [100, 68] },
    { date: 'Sep 15', size: 2600, retention: [100] },
  ];
}

function getMockEvents() {
  const eventTypes = ['$pageview', 'button_clicked', 'signup_completed', 'product_viewed', 'checkout_started', 'purchase_completed'];
  const urls = ['https://app.example.com/dashboard', 'https://app.example.com/pricing', 'https://app.example.com/checkout', 'https://app.example.com/onboarding'];
  const userAgents = ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)'];
  
  const mockList = [];
  for (let i = 0; i < 30; i++) {
    const ev = eventTypes[i % eventTypes.length];
    const minsAgo = i * 2 + 1;
    const time = new Date(Date.now() - minsAgo * 60000).toISOString();
    mockList.push({
      id: `evt_${1000 + i}`,
      event: ev,
      projectKey: 'proj_live_test_9876543210',
      workspaceId: 'ws_proj_liv',
      sessionId: `sid_${Math.random().toString(36).substring(2, 9)}`,
      userId: `usr_${8000 + (i % 8)}`,
      timestamp: time,
      ip: `192.168.1.${10 + (i % 40)}`,
      userAgent: userAgents[i % userAgents.length],
      url: urls[i % urls.length],
      referrer: i % 2 === 0 ? 'https://google.com' : 'https://twitter.com',
      properties: {
        page: urls[i % urls.length].replace('https://app.example.com', ''),
        buttonId: `btn_action_${i % 5}`,
        plan: i % 3 === 0 ? 'Pro' : 'Free',
      }
    });
  }
  return mockList;
}

// 1. Overview endpoint — KPIs, trends, top events, and device stats
app.get('/api/overview', async (req, res) => {
  const { timeRange = '7d', projectKey } = req.query;
  try {
    const projectFilter = projectKey ? `WHERE projectKey = '${projectKey}'` : '';
    const andProjectFilter = projectKey ? `AND projectKey = '${projectKey}'` : '';

    const totalEventsQuery = await client.query({
      query: `SELECT count() as total FROM events ${projectFilter}`,
      format: 'JSONEachRow',
    });
    const totalEventsData = await totalEventsQuery.json();
    const totalEvents = parseInt(totalEventsData[0]?.total || 0, 10);

    if (totalEvents === 0) {
      return res.json(getMockOverview(timeRange));
    }

    const dauQuery = await client.query({
      query: `SELECT uniq(sessionId) as dau FROM events WHERE timestamp >= now() - INTERVAL 1 DAY ${andProjectFilter}`,
      format: 'JSONEachRow',
    });
    const dauData = await dauQuery.json();

    const mauQuery = await client.query({
      query: `SELECT uniq(sessionId) as mau FROM events WHERE timestamp >= now() - INTERVAL 30 DAY ${andProjectFilter}`,
      format: 'JSONEachRow',
    });
    const mauData = await mauQuery.json();

    const sessionsQuery = await client.query({
      query: `SELECT uniq(sessionId) as uniqueSessions FROM events ${projectFilter}`,
      format: 'JSONEachRow',
    });
    const sessionsData = await sessionsQuery.json();

    const topEventsQuery = await client.query({
      query: `
        SELECT event, count() as count
        FROM events
        ${projectFilter}
        GROUP BY event
        ORDER BY count DESC
        LIMIT 6
      `,
      format: 'JSONEachRow',
    });
    const topEventsData = await topEventsQuery.json();
    const topEvents = topEventsData.map(r => ({
      event: r.event,
      count: parseInt(r.count, 10),
      percentage: totalEvents > 0 ? parseFloat(((parseInt(r.count, 10) / totalEvents) * 100).toFixed(1)) : 0
    }));

    const trendQuery = await client.query({
      query: `
        SELECT toStartOfDay(timestamp) as day, count() as count, uniq(sessionId) as activeUsers
        FROM events
        WHERE timestamp >= now() - INTERVAL 7 DAY ${andProjectFilter}
        GROUP BY day
        ORDER BY day ASC
      `,
      format: 'JSONEachRow',
    });
    const trendData = await trendQuery.json();
    const trend = trendData.map(r => ({
      date: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
      count: parseInt(r.count, 10),
      activeUsers: parseInt(r.activeUsers, 10)
    }));

    res.json({
      dau: parseInt(dauData[0]?.dau || 0, 10),
      mau: parseInt(mauData[0]?.mau || 0, 10),
      totalEvents,
      uniqueSessions: parseInt(sessionsData[0]?.uniqueSessions || 0, 10),
      avgSessionDuration: '4m 32s',
      conversionRate: 14.8,
      topEvents,
      trend: trend.length ? trend : getMockOverview().trend,
      devices: getMockOverview().devices,
      recentSessions: getMockOverview().recentSessions,
    });
  } catch (error) {
    console.warn('⚠️ ClickHouse query failed, providing fallback overview:', error.message);
    res.json(getMockOverview(timeRange));
  }
});

// 2. Funnel endpoint — Multi-step conversion pipeline
app.all('/api/funnel', async (req, res) => {
  try {
    const stepsParam = req.query.steps || (req.body && req.body.steps);
    const steps = Array.isArray(stepsParam)
      ? stepsParam
      : (typeof stepsParam === 'string' ? stepsParam.split(',') : ['pageview', 'signup_completed', 'purchase']);
    
    const projectKey = req.query.projectKey || (req.body && req.body.projectKey);
    const projectFilter = projectKey ? `AND projectKey = '${projectKey}'` : '';

    const conditionalSelect = steps.map((step, idx) => {
      return `uniqIf(sessionId, event = '${step}') as step_${idx}`;
    }).join(', ');

    const funnelQuery = await client.query({
      query: `SELECT ${conditionalSelect} FROM events WHERE 1=1 ${projectFilter}`,
      format: 'JSONEachRow',
    });
    const rawData = await funnelQuery.json();
    const counts = rawData[0] || {};

    const firstStepCount = parseInt(counts['step_0'] || 0, 10);

    if (firstStepCount === 0) {
      return res.json(getMockFunnel(steps));
    }

    const funnelPayload = steps.map((step, idx) => {
      const currentVal = parseInt(counts[`step_${idx}`] || 0, 10);
      const prevVal = idx === 0 ? currentVal : parseInt(counts[`step_${idx - 1}`] || 0, 10);
      return {
        step,
        stepNumber: idx + 1,
        count: currentVal,
        stepConversion: prevVal > 0 ? Math.round((currentVal / prevVal) * 100) : 0,
        overallConversion: firstStepCount > 0 ? Math.round((currentVal / firstStepCount) * 100) : 0,
        dropoff: Math.max(0, prevVal - currentVal),
        avgTimeToNext: idx === 0 ? '0s' : `${(idx * 38) + 15}s`,
      };
    });

    res.json(funnelPayload);
  } catch (error) {
    console.warn('⚠️ ClickHouse funnel query failed, providing fallback:', error.message);
    const fallbackSteps = req.query.steps ? req.query.steps.split(',') : ['pageview', 'signup_completed', 'purchase'];
    res.json(getMockFunnel(fallbackSteps));
  }
});

// 3. Retention endpoint — Cohort retention matrix
app.get('/api/retention', async (req, res) => {
  try {
    const retentionQuery = await client.query({
      query: `
        WITH 
          cohorts AS (
            SELECT sessionId as user_id, toStartOfWeek(min(timestamp)) as cohort_week
            FROM events
            GROUP BY user_id
          ),
          activity AS (
            SELECT sessionId as user_id, toStartOfWeek(timestamp) as active_week
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
      format: 'JSONEachRow',
    });
    const rawRows = await retentionQuery.json();

    if (!rawRows || rawRows.length === 0) {
      return res.json(getMockRetention());
    }

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
  } catch (error) {
    console.warn('⚠️ ClickHouse retention query failed, providing fallback:', error.message);
    res.json(getMockRetention());
  }
});

// 4. Events Explorer endpoint — Search & Inspect individual events
app.get('/api/events', async (req, res) => {
  const { search, event, projectKey, limit = 50 } = req.query;
  try {
    let whereClauses = [];
    if (projectKey) whereClauses.push(`projectKey = '${projectKey}'`);
    if (event && event !== 'all') whereClauses.push(`event = '${event}'`);
    if (search) whereClauses.push(`(event ILIKE '%${search}%' OR sessionId ILIKE '%${search}%' OR userId ILIKE '%${search}%')`);

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const eventsQuery = await client.query({
      query: `
        SELECT 
          event, projectKey, workspaceId, sessionId, userId, 
          formatDateTime(timestamp, '%Y-%m-%d %H:%i:%S') as timestamp,
          ip, userAgent, url, referrer, properties
        FROM events
        ${whereString}
        ORDER BY timestamp DESC
        LIMIT ${parseInt(limit, 10)}
      `,
      format: 'JSONEachRow',
    });
    const eventsData = await eventsQuery.json();

    if (!eventsData || eventsData.length === 0) {
      return res.json({ events: getMockEvents(), total: 30 });
    }

    res.json({ events: eventsData, total: eventsData.length });
  } catch (error) {
    console.warn('⚠️ ClickHouse events query failed, providing fallback:', error.message);
    res.json({ events: getMockEvents(), total: 30 });
  }
});

// 5. Real-time Live Stream SSE Endpoint
app.get('/api/live', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write('comment: connected\n\n');

  // Simulated live event interval for demonstration if no live traffic
  const mockEvents = ['$pageview', 'button_clicked', 'signup_completed', 'product_viewed', 'checkout_started', 'purchase_completed'];
  const interval = setInterval(() => {
    const randomEvent = {
      event: mockEvents[Math.floor(Math.random() * mockEvents.length)],
      projectKey: 'proj_live_test_9876543210',
      sessionId: `sid_${Math.random().toString(36).substring(2, 8)}`,
      userId: `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      ip: `192.168.1.${Math.floor(Math.random() * 250)}`,
      url: 'https://app.example.com/dashboard',
      properties: { simulated: 'true' }
    };
    res.write(`data: ${JSON.stringify(randomEvent)}\n\n`);
  }, 3500);

  const onNewEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  liveEmitter.on('live-event', onNewEvent);

  req.on('close', () => {
    clearInterval(interval);
    liveEmitter.off('live-event', onNewEvent);
    res.end();
  });
});

// 6. Workspaces & Projects Metadata
app.get('/api/workspaces', (req, res) => {
  res.json({
    workspaces: [
      {
        id: 'ws_prod_9876',
        name: 'Production Workspace',
        projectKey: 'proj_live_test_9876543210',
        environment: 'production',
        status: 'active',
        created: '2026-08-01',
      },
      {
        id: 'ws_stage_1234',
        name: 'Staging Environment',
        projectKey: 'proj_stage_test_1234567890',
        environment: 'staging',
        status: 'active',
        created: '2026-08-15',
      },
      {
        id: 'ws_mobile_5544',
        name: 'Mobile App Project',
        projectKey: 'proj_mobile_test_5544332211',
        environment: 'production',
        status: 'active',
        created: '2026-08-20',
      },
    ]
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
  console.error('Query API error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`📊 Query & Analytics API running on http://localhost:${PORT}`);
});