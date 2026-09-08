/**
 * Configuration options required to initialize the Analytics SDK.
 */
export interface AnalyticsConfig {
    /**
     * The unique workspace or project key used to identify incoming events.
     */
    projectKey: string;
    /**
     * The ingestion endpoint URL. Defaults to 'http://localhost:4000/ingest'.
     */
    endpoint?: string;
    /**
     * The frequency (in milliseconds) at which queued events are flushed to the server.
     * Defaults to 5000ms.
     */
    flushInterval?: number;
    /**
     * Whether to output verbose debug logging to the browser developer console.
     * Defaults to false.
     */
    debug?: boolean;
}
/**
 * Represents a single behavioral analytics event payload dispatched to the ingestion pipeline.
 */
export interface AnalyticsEvent {
    /**
     * The custom event name (e.g., '$pageview', 'button_clicked', 'purchase').
     */
    name: string;
    /**
     * Arbitrary key-value metadata properties associated with the event.
     */
    properties?: Record<string, unknown>;
    /**
     * Unique rolling session UUID identifier for the visitor.
     */
    sessionId: string;
    /**
     * Optional custom user identifier set via `Analytics.identify()`.
     */
    userId?: string;
    /**
     * Unix timestamp in milliseconds when the event was recorded.
     */
    timestamp: number;
    /**
     * The full URL of the browser window when the event occurred.
     */
    url: string;
    /**
     * The referrer URL from `document.referrer`.
     */
    referrer: string;
    /**
     * The User Agent string from `navigator.userAgent`.
     */
    userAgent: string;
}
