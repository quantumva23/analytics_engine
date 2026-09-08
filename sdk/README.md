# @quantumva23/analytics-sdk

[![JSR](https://jsr.io/badges/@quantumva23/analytics-sdk)](https://jsr.io/@quantumva23/analytics-sdk)
[![JSR Score](https://jsr.io/badges/@quantumva23/analytics-sdk/score)](https://jsr.io/@quantumva23/analytics-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A lightweight, high-performance behavioral analytics SDK for modern web applications and micro-SaaS platforms. Designed as a self-hosted alternative to Mixpanel and Amplitude with automated sessionization, debounced batch ingestion, and zero third-party tracking overhead.

---

## Features

- 🚀 **Zero Overhead & Lightweight**: Minimal footprint with no heavy dependencies.
- ⏱️ **Debounced Batch Ingestion**: Automatically buffers events in-memory and flushes every 5 seconds (or on `beforeunload`), preventing network flood.
- 🆔 **Smart Sessionization**: Generates and manages rolling 30-minute visitor session UUIDs in browser storage.
- 📄 **Auto Pageview Capture**: Automatically captures `$pageview` events on initialization with page titles, paths, referrers, and user agents.
- 👤 **User Identification**: Seamlessly associate user actions with custom user IDs using `Analytics.identify()`.
- 🛡️ **Reliable Delivery**: Uses `fetch` with `keepalive: true` and automatically requeues events on network failure.

---

## Installation

Install using JSR across any modern JavaScript/TypeScript package manager:

```bash
# Deno
deno add jsr:@quantumva23/analytics-sdk

# npm
npx jsr add @quantumva23/analytics-sdk

# pnpm
pnpm dlx jsr add @quantumva23/analytics-sdk

# Bun
bunx jsr add @quantumva23/analytics-sdk

# Yarn
yarn dlx jsr add @quantumva23/analytics-sdk
```

---

## Quick Start Example

Initialize the SDK once at the root entrypoint of your website or application (e.g., `main.tsx`, `index.js`, or `_app.tsx`):

```typescript
import Analytics from "@quantumva23/analytics-sdk";

// 1. Initialize with your project key and ingestion endpoint
Analytics.init({
  projectKey: "proj_live_test_9876543210",
  endpoint: "http://localhost:4000/ingest", // Your Ingestion API URL
  flushInterval: 5000,                      // Flush every 5 seconds
  debug: false,
});

// 2. Track custom events anywhere in your app
Analytics.track("button_clicked", {
  buttonName: "pricing-cta",
  tier: "pro",
});

// 3. Identify authenticated users
Analytics.identify("usr_9842", {
  email: "developer@example.com",
  plan: "enterprise",
});
```

---

## API Reference

### `Analytics.init(config: AnalyticsConfig)`
Initializes the SDK instance, triggers an initial `$pageview` event, and starts the background flush timer.

#### Configuration Options:
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `projectKey` | `string` | *(Required)* | Your workspace/project identifier token. |
| `endpoint` | `string` | `'http://localhost:4000/ingest'` | Target URL of your event ingestion API. |
| `flushInterval` | `number` | `5000` | In-memory buffer flush frequency in milliseconds. |
| `debug` | `boolean` | `false` | Enables verbose console logging for debugging events. |

---

### `Analytics.track(name: string, properties?: Record<string, unknown>)`
Queues a custom event to be transmitted to the ingestion pipeline.

```typescript
Analytics.track("checkout_completed", {
  orderId: "ord_1082",
  amount: 49.99,
  currency: "USD",
  itemsCount: 2,
});
```

---

### `Analytics.identify(userId: string, traits?: Record<string, unknown>)`
Associates future tracked events in the current session with a specific user ID and custom user traits.

```typescript
Analytics.identify("usr_1029", {
  name: "Jane Doe",
  role: "admin",
});
```

---

### `Analytics.flush(): Promise<void>`
Immediately dispatches all buffered events in the queue via HTTP POST without waiting for the timer.

```typescript
await Analytics.flush();
```

---

## Event Payload Structure

Each event sent to the ingestion endpoint conforms to the following schema:

```typescript
interface AnalyticsEvent {
  name: string;                         // Event name, e.g. "button_clicked"
  properties: Record<string, unknown>;  // Custom metadata key-values
  sessionId: string;                    // 30-min rolling session UUID
  userId?: string;                      // Optional identified user ID
  timestamp: number;                    // Epoch timestamp in milliseconds
  url: string;                          // Window location URL
  referrer: string;                     // Document referrer
  userAgent: string;                    // Client browser User Agent
}
```

---

## License

[MIT](LICENSE) © Vishal Agrahari
