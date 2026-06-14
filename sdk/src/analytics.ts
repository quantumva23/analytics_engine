import { AnalyticsConfig, AnalyticsEvent } from './types';
import { getSessionId } from './session';

export class Analytics {
  private config: Required<AnalyticsConfig>;
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(config: AnalyticsConfig) {
    this.config = {
      endpoint: 'http://localhost:4000/ingest',
      flushInterval: 5000,
      debug: false,
      ...config,
    };
  }

  init() {
    this.capturePageview();
    this.timer = setInterval(() => this.flush(), this.config.flushInterval);
    window.addEventListener('beforeunload', () => this.flush());
    if (this.config.debug) console.log('[Analytics] initialized');
  }

  track(name: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      sessionId: getSessionId(),
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    };
    this.queue.push(event);
    if (this.config.debug) console.log('[Analytics] tracked:', event);
  }

  private capturePageview() {
    this.track('$pageview', {
      title: document.title,
      path: window.location.pathname,
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];
    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectKey: this.config.projectKey,
          events: batch,
        }),
        keepalive: true,
      });
      if (this.config.debug) console.log('[Analytics] flushed', batch.length, 'events');
    } catch (err) {
      this.queue.unshift(...batch);
      if (this.config.debug) console.error('[Analytics] flush failed:', err);
    }
  }
}