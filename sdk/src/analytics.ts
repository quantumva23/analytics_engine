import { AnalyticsConfig, AnalyticsEvent } from './types';
import { getSessionId } from './session';

/**
 * Core Analytics class responsible for event queuing, session tracking,
 * automatic pageview capturing, and debounced batch ingestion.
 */
export class Analytics {
  private config: Required<AnalyticsConfig>;
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentUserId?: string;

  /**
   * Creates a new Analytics instance.
   *
   * @param config The initialization configuration settings.
   */
  constructor(config: AnalyticsConfig) {
    this.config = {
      endpoint: 'http://localhost:4000/ingest',
      flushInterval: 5000,
      debug: false,
      ...config,
    };
  }

  /**
   * Initializes the analytics engine, captures an initial $pageview,
   * starts the periodic batch flush timer, and attaches the beforeunload listener.
   */
  init(): void {
    this.capturePageview();
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => this.flush(), this.config.flushInterval);
      window.addEventListener('beforeunload', () => this.flush());
    }
    if (this.config.debug) console.log('[Analytics] initialized with projectKey:', this.config.projectKey);
  }

  /**
   * Identifies an authenticated user and dispatches an $identify event with user traits.
   *
   * @param userId The unique identifier for the user.
   * @param traits Optional custom key-value traits (e.g., email, subscription tier).
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.currentUserId = userId;
    this.track('$identify', { userId, ...traits });
    if (this.config.debug) console.log('[Analytics] identified user:', userId);
  }

  /**
   * Enqueues a behavioral tracking event with session, timestamp, URL, and device enrichment.
   *
   * @param name The name of the event (e.g. 'button_clicked', 'add_to_cart').
   * @param properties Optional custom metadata properties.
   */
  track(name: string, properties?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      name,
      properties: properties || {},
      sessionId: getSessionId(),
      userId: this.currentUserId,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
    this.queue.push(event);
    if (this.config.debug) console.log('[Analytics] tracked:', event);
  }

  /**
   * Automatically captures a $pageview event with the current document title and pathname.
   */
  private capturePageview(): void {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.track('$pageview', {
        title: document.title,
        path: window.location.pathname,
      });
    }
  }

  /**
   * Flushes all currently buffered events in the queue to the ingestion API.
   *
   * @returns A promise that resolves when the network request completes.
   */
  async flush(): Promise<void> {
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