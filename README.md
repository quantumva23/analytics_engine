# Analytics Engine

A Micro-SaaS analytics platform that lets any website track user behavior with 2 lines of code — like a lightweight Mixpanel you own completely.

## Live Package
Published at: https://jsr.io/@quantumva23/analytics-sdk

## Tech Stack
- **SDK** — TypeScript, Rollup, JSR
- **Ingest API** — Node.js, Express (Week 2)
- **Queue** — Redpanda / Kafka (Week 3)
- **Database** — ClickHouse (Week 4)
- **Dashboard** — React, D3.js (Week 5)

## How it works
Browser SDK → batches events → sends to API → Kafka queue → ClickHouse → React Dashboard


## SDK Usage
Install: npx jsr add @quantumva23/analytics-sdk 

Use in any website:
```js
import Analytics from '@quantumva23/analytics-sdk'

Analytics.init({ projectKey: 'YOUR_KEY' })
Analytics.track('button_clicked', { page: 'home' })
```

## What gets tracked automatically
- Page views on every page load
- Session ID per visitor
- Timestamp, URL, referrer, device info

## Project Structure

analytics-engine/

├── sdk/              ← Published npm/JSR package

│   ├── src/

│   │   ├── types.ts

│   │   ├── session.ts

│   │   ├── analytics.ts

│   │   └── index.ts

│   └── dist/         ← Built output

└── test_app/         ← Local test server

├── server.js

└── index.html

## Week by Week Progress
- [x] Week 1-2 — SDK built and published
- [ ] Week 2-3 — Ingest API + Kafka queue
- [ ] Week 3-4 — ClickHouse storage
- [ ] Week 4-5 — React dashboard
- [ ] Week 5-6 — Multi-tenant + deploy

## Why this project stands out
- Real published package anyone can install
- Uses ClickHouse — columnar DB used by Uber, Cloudflare
- Kafka event streaming — same tech used at LinkedIn, Netflix
- Multi-tenant architecture with workspace isolation
- End-to-end system from browser to dashboard

## Author
Vishal Agrahari — NIT Raipur
GitHub: github.com/quantumva23
