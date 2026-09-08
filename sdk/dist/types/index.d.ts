/**
 * Configuration options required to initialize the Analytics SDK.
 */
interface AnalyticsConfig {
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
interface AnalyticsEvent {
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

/**
 * Core Analytics class responsible for event queuing, session tracking,
 * automatic pageview capturing, and debounced batch ingestion.
 */
declare class Analytics {
    private config;
    private queue;
    private timer;
    private currentUserId?;
    /**
     * Creates a new Analytics instance.
     *
     * @param config The initialization configuration settings.
     */
    constructor(config: AnalyticsConfig);
    /**
     * Initializes the analytics engine, captures an initial $pageview,
     * starts the periodic batch flush timer, and attaches the beforeunload listener.
     */
    init(): void;
    /**
     * Identifies an authenticated user and dispatches an $identify event with user traits.
     *
     * @param userId The unique identifier for the user.
     * @param traits Optional custom key-value traits (e.g., email, subscription tier).
     */
    identify(userId: string, traits?: Record<string, unknown>): void;
    /**
     * Enqueues a behavioral tracking event with session, timestamp, URL, and device enrichment.
     *
     * @param name The name of the event (e.g. 'button_clicked', 'add_to_cart').
     * @param properties Optional custom metadata properties.
     */
    track(name: string, properties?: Record<string, unknown>): void;
    /**
     * Automatically captures a $pageview event with the current document title and pathname.
     */
    private capturePageview;
    /**
     * Flushes all currently buffered events in the queue to the ingestion API.
     *
     * @returns A promise that resolves when the network request completes.
     */
    flush(): Promise<void>;
}

/**
 * # Analytics SDK
 *
 * Lightweight, privacy-first behavioral analytics SDK for web and mobile applications.
 * Automatically tracks page views, manages session lifetimes, and buffers events
 * for debounced batch ingestion.
 *
 * ## Example Usage
 *
 * ```ts
 * import Analytics from "@quantumva23/analytics-sdk";
 *
 * // 1. Initialize with your project key
 * Analytics.init({
 *   projectKey: "YOUR_PROJECT_KEY",
 *   endpoint: "http://localhost:4000/ingest",
 *   flushInterval: 5000,
 * });
 *
 * // 2. Track custom events
 * Analytics.track("button_clicked", { buttonId: "signup_cta", plan: "pro" });
 *
 * // 3. Identify user
 * Analytics.identify("usr_1029", { email: "user@example.com" });
 * ```
 *
 * @module
 */

/**
 * Public client contract for the Analytics singleton interface.
 */
interface IAnalyticsClient {
    /**
     * Initializes the global Analytics instance with the provided configuration.
     */
    init(config: AnalyticsConfig): Analytics;
    /**
     * Identifies an authenticated user and attaches user traits to future events.
     */
    identify(userId: string, traits?: Record<string, unknown>): void;
    /**
     * Tracks a custom user behavior event and queues it in the in-memory buffer.
     */
    track(name: string, properties?: Record<string, unknown>): void;
    /**
     * Flushes all currently queued events immediately to the ingestion API.
     */
    flush(): Promise<void> | undefined;
    /**
     * Retrieves the underlying initialized Analytics class instance.
     */
    getInstance(): Analytics | null;
}
/**
 * Singleton client interface for simplified analytics tracking across web applications.
 */
declare const AnalyticsClient: IAnalyticsClient;

export { Analytics, AnalyticsClient as default };
export type { AnalyticsConfig, AnalyticsEvent, IAnalyticsClient };
