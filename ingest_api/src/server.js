const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
const { connectProducer, sendToQueue } = require('./kafka');
const { startConsumer } = require('./consumer');
const { isRateLimited } = require('./rateLimiter');
// Ensure the worker is loaded and listening
require('./worker');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Ingestion Endpoint
app.post('/ingest', async (req, res) => {
  try {
    const { event, properties, projectKey, timestamp } = req.body;

    // 1. Basic Schema Validation
    if (!event || !projectKey) {
      return res.status(400).json({ error: 'Missing "event" or "projectKey" properties' });
    }

    // 2. Rate limit check
    const limited = await isRateLimited(projectKey);
    if (limited) {
      return res.status(429).json({ error: 'Rate limit exceeded. Max 100 events/sec per project.' });
    }

    // 3. Data Enrichment & Workspace Isolation
    const enrichedEvent = {
      event,
      properties: properties || {},
      projectKey,
      workspaceId: crypto.randomUUID(),
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // 4. Fast-path write to Redpanda (decoupled queue)
    await sendToQueue('analytics-raw-events', enrichedEvent);

    return res.status(202).json({ success: true, message: 'Event accepted' });
  } catch (error) {
    console.error('❌ Error handling ingestion:', error);
    return res.status(500).json({ error: 'Failed to process event' });
  }
});

async function bootstrap() {
  await connectProducer();
  await startConsumer().catch(err => {
    console.error('❌ Failed to start Redpanda consumer:', err);
  });
  app.listen(PORT, () => {
    console.log(`🚀 Ingestion server active on http://localhost:${PORT}`);
  });
}

bootstrap();