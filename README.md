Below is the comprehensive, professional, and architecture-focused `README.md` for your **μ-SaaS Analytics Engine** project [1]. 

This markdown focuses on **explaining the technical choices and system design decisions** (the "Why") to recruiters and hiring managers, integrates your custom JSR package context, details the project structure, and provides clear local execution instructions with live demo placeholders.

***

```markdown
# μ-SaaS Analytics Engine

A high-performance, distributed, and multi-tenant web analytics platform that lets any web application track user behavior with just two lines of code—similar to a lightweight, self-hosted Mixpanel. 

Built with a modern distributed systems architecture, this project features an actual published browser SDK, a decoupled message ingestion pipeline, and a column-oriented analytical database to process and query millions of rows in milliseconds.

[![JSR Version](https://jsr.io/badges/@quantumva23/analytics-sdk)](https://jsr.io/@quantumva23/analytics-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 🔗 Live Deployments

*   **Official Browser SDK (JSR Registry):** [jsr.io/@quantumva23/analytics-sdk](https://jsr.io/@quantumva23/analytics-sdk)
*   **Live Analytics Dashboard:** [https://demo.your-analytics-engine.com](https://your-analytics-engine.com) *(Replace with your live hosting URL)*
*   **Live API Gateway Gateway:** [https://api.your-analytics-engine.com](https://api.your-analytics-engine.com) *(Replace with your live API hosting URL)*

---

## 🏗️ System Architecture & Data Lifecycle

The system prioritizes ultra-low ingestion latency on the client side, write-resilience under traffic spikes, and immediate query execution.

```
+-------------+      HTTP POST (202 Accepted)     +---------------------+
| Browser SDK | ────────────────────────────────> | Express Ingest API  |
+-------------+                                   +---------------------+
                                                             │
                                                     (Publish Event)
                                                             ▼
                                                  +---------------------+
                                                  |  Redpanda (Kafka)   |
                                                  +---------------------+
                                                             │
                                                     (Consumer Read)
                                                             ▼
                                                  +---------------------+
                                                  |   BullMQ (Redis)    |
                                                  +---------------------+
                                                             │
                                                    (Async Batch Write)
                                                             ▼
                                                  +---------------------+
                                                  |    ClickHouse DB    |
                                                  +---------------------+
                                                             ▲
                                                    (Analytical Query)
                                                             │
                                                  +---------------------+
                                                  |   React Dashboard   |
                                                  +---------------------+
```

---

## ⚡ Technical Design Decisions (The "Why")

### 1. Storage: ClickHouse vs. Relational Databases (PostgreSQL)
*   **The Problem:** Analytical queries (OLAP) require scanning columns across millions of records (e.g., finding distinct users over 30 days). In row-oriented databases like PostgreSQL, the engine must load every column of every row from disk into memory, resulting in I/O bottlenecks.
*   **The Solution:** ClickHouse is a column-oriented analytical database. It stores values column-by-column, allowing it to read only the bytes associated with the requested columns. Combined with efficient data compression and vectorized execution, it performs aggregates over millions of entries in milliseconds.
*   **Engine & Schema:** We use the `MergeTree` engine, which physically orders and indexes records by `(workspaceId, projectKey, event, timestamp)`. This structure guarantees strict multi-tenant workspace isolation and rapid range queries.

### 2. Ingest Buffer: Redpanda/Kafka vs. Synchronous DB Writes
*   **The Problem:** Direct database writes block the HTTP ingestion thread. During traffic spikes, slow database operations can cause the HTTP gateway to fail, leading to dropped tracking events.
*   **The Solution:** The Express ingestion gateway validates payloads and immediately publishes them to a **Redpanda** topic, returning an HTTP `202 Accepted` status within milliseconds. Client tracking scripts are never blocked, and events are safely buffered.

### 3. Worker Ingestion: BullMQ (Redis) & Server-Side Batching
*   **The Problem:** Columnar databases are not designed for high-frequency, single-row writes; doing so degrades disk performance. ClickHouse requires larger, infrequent batch writes.
*   **The Solution:** Rather than writing complex local memory-buffers in Node.js, we feed the stream from Redpanda into **BullMQ (backed by Redis)**. The BullMQ worker leverages ClickHouse's native **Async Inserts** (`async_insert: 1` and `wait_for_async_insert: 0`). This offloads the batch buffering logic to ClickHouse's database server, ensuring high-throughput writes.

### 4. Real-time Delivery: Server-Sent Events (SSE) vs. WebSockets
*   **The Problem:** Real-time dashboard updates usually require full-duplex WebSockets, which introduce connection handshake overhead and require complex scaling solutions.
*   **The Solution:** Because data flows in one direction (server to dashboard client), we implement **Server-Sent Events (SSE)**. It uses a standard HTTP connection and native browser APIs with zero extra dependencies, simplifying horizontal scaling.

---

## 📂 Project Structure

The project is structured modularly to separate SDK execution, ingestion routing, database workers, and visualization dashboards:

```text
analytics-engine/
├── sdk/                      # Published Browser Tracking SDK
│   ├── src/
│   │   ├── types.ts          # Core SDK interface definitions
│   │   ├── session.ts        # Visitor session management & persistence
│   │   ├── analytics.ts      # Event batching and dispatch logic
│   │   └── index.ts          # Main entry points
│   └── rollup.config.js      # Bundler for production distribution
├── ingest_api/               # High-Throughput Node Ingest Gateway & Workers
│   ├── src/
│   │   ├── clickhouse.js     # ClickHouse OLAP schema & initialization
│   │   ├── kafka.js          # Redpanda producer connection rules
│   │   ├── consumer.js       # Redpanda stream event listener
│   │   ├── worker.js         # BullMQ queue processor writing to ClickHouse
│   │   ├── emitter.js        # Internal SSE pub/sub channel
│   │   └── server.js         # REST endpoints & SSE gateway
│   ├── docker-compose.yml    # Redpanda, Redis, and ClickHouse configurations
│   └── test-load.js          # Ingestion load generator (10,000 synthetic events)
└── dashboard/                 # React UI Client (Visual Dashboard)
    ├── src/
    │   ├── components/       # Overview metrics, Funnels, Retention, Live view
    │   ├── App.jsx           # Frame layout & core state management
    │   └── main.jsx          # Vite initialization
```

---

## 🛠️ Step-by-Step Installation & Local Execution

To run the entire distributed telemetry system locally, follow these steps:

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) and [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and active.

### Step 1: Start the Docker Infrastructure
Spin up Redpanda, Redis, and ClickHouse with a single command:
```bash
cd ingest_api
docker compose up -d
```
*Verify that all three services are active by running `docker ps`.*

### Step 2: Run the Ingestion Server
Install dependencies and launch the API gateway:
```bash
cd ingest_api
npm install
npm start
```
*Wait until you see database, queue, and worker confirmations in your console:*
```text
📊 ClickHouse: Database and "events" table verified/created
⚡ Redpanda (Kafka) Producer connected successfully
📡 Redpanda Consumer running and subscribing to [analytics-raw-events]
🚀 Ingestion and Query server active on http://localhost:4000
```

### Step 3: Start the React Dashboard
In a separate terminal window, launch the Vite UI application:
```bash
cd ../dashboard
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 4: Run the Ingestion Load Test
To test the pipeline's performance under load, run the load-testing script to send 10,000 requests asynchronously to the ingestion gateway:
```bash
cd ../ingest_api
node test-load.js
```
The metrics, funnels, retention matrices, and live logging consoles on the dashboard will dynamically update in real-time.

---

## 🔌 SDK Integration & Automated Tracking

### Installation
Add the published SDK to your web app via JSR:
```bash
npx jsr add @quantumva23/analytics-sdk
```

### Usage
Initialize the tracking agent with your project key:
```javascript
import Analytics from '@quantumva23/analytics-sdk';

// Initialize the tracking engine
Analytics.init({ projectKey: 'YOUR_PROJECT_KEY' });

// Track custom interactions
Analytics.track('button_clicked', { 
  page: 'pricing', 
  plan: 'pro' 
});
```

### Auto-Captured Attributes
To minimize setup friction, the SDK automatically captures standard interaction telemetry on initialization:
*   **Pageviews:** Automatically captures URL updates (via custom History API listeners for Single Page Apps).
*   **Sessions:** Generates and maintains a unique session ID per visitor (persisted in local storage).
*   **Device Attributes:** Automatically parses user-agent, device dimension values, referrers, and timestamps.
*   **Network IP:** Captured securely on the server gateway at the point of ingestion.

---

## 🌟 Why This Project Stands Out

*   **Real-World Telemetry Pipeline:** Most full-stack portfolios stop at basic database writes. This project models production-grade event-streaming concepts by decoupling ingestion from storage using message brokers.
*   **Natively Published SDK:** Built with TypeScript and Rollup, the tracking library is a real NPM package published on the public JSR registry, meaning anyone can install and run it.
*   **OLAP Columnar Database:** Utilizes ClickHouse, the database engine powering high-performance analytics teams at companies like Cloudflare, Uber, and Netflix.
*   **Robust Worker Resilience:** Implements secondary job queuing via BullMQ. If the database crashes, events accumulate safely in memory and are processed with exponential retry backoff rules once connections recover.
*   **Interactive Visualizations:** Built custom D3.js SVG render maps to visualize conversions and retention cohorts directly in React without relying on heavy chart libraries.

---

## 👤 Author

*   **Developer:** Vishal Agrahari
*   **Institution:** National Institute of Technology (NIT), Raipur
*   **GitHub:** [@quantumva23](https://github.com/quantumva23)
```
