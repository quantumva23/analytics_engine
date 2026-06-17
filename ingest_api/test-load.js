// test-load.js
const TOTAL_EVENTS = 10000;
const CONCURRENCY = 50; // Max concurrent requests
const TARGET_URL = 'http://localhost:4000/ingest';

async function sendSingleEvent(id) {
  const payload = {
    event: 'button_clicked',
    projectKey: 'proj_live_test_9876543210',
    properties: {
      buttonId: `btn_${id}`,
      screen: 'onboarding_flow',
      performanceMs: Math.floor(Math.random() * 200)
    }
  };

  try {
    const res = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
  } catch (err) {
    console.error(`❌ Failed to send event #${id}:`, err.message);
    throw err;
  }
}

async function startStressTest() {
  console.log(`🚀 Dispatching ${TOTAL_EVENTS} events with concurrency of ${CONCURRENCY}...`);
  const startTime = Date.now();

  let completed = 0;
  let failures = 0;
  let active = 0;

  async function queueWorker() {
    while (completed + failures < TOTAL_EVENTS) {
      const nextId = completed + failures + active + 1;
      if (nextId > TOTAL_EVENTS) break;

      active++;
      try {
        await sendSingleEvent(nextId);
        completed++;
      } catch (e) {
        failures++;
      } finally {
        active--;
      }
    }
  }

  // Spawn concurrent workers to perform ingestion actions
  const workerPool = Array.from({ length: CONCURRENCY }, () => queueWorker());
  await Promise.all(workerPool);

  const durationSec = (Date.now() - startTime) / 1000;
  console.log(`\n🏁 Stress Test Completed!`);
  console.log(`⏱️  Duration: ${durationSec.toFixed(2)} seconds`);
  console.log(`✅ Event success count: ${completed}`);
  console.log(`❌ Event failure count: ${failures}`);
  console.log(`📊 Ingestion Speed: ${(completed / durationSec).toFixed(2)} events/sec`);
}

startStressTest();