'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const SESSION_KEY = 'anlx_sid';
const SESSION_TTL = 30 * 60 * 1000;
/**
 * Retrieves the active visitor session ID or generates a new rolling UUID.
 * Sessions expire after 30 minutes of inactivity.
 *
 * @returns The unique 36-character session UUID.
 */
function getSessionId() {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return 'srv_session';
    }
    try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
            const { id, exp } = JSON.parse(stored);
            if (Date.now() < exp) {
                sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
                return id;
            }
        }
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'sid_' + Math.random().toString(36).substring(2, 12);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
        return id;
    }
    catch (_a) {
        return 'sid_fallback';
    }
}

/**
 * Core Analytics class responsible for event queuing, session tracking,
 * automatic pageview capturing, and debounced batch ingestion.
 */
class Analytics {
    /**
     * Creates a new Analytics instance.
     *
     * @param config The initialization configuration settings.
     */
    constructor(config) {
        this.queue = [];
        this.timer = null;
        this.config = Object.assign({ endpoint: 'http://localhost:4000/ingest', flushInterval: 5000, debug: false }, config);
    }
    /**
     * Initializes the analytics engine, captures an initial $pageview,
     * starts the periodic batch flush timer, and attaches the beforeunload listener.
     */
    init() {
        this.capturePageview();
        if (typeof window !== 'undefined') {
            this.timer = setInterval(() => this.flush(), this.config.flushInterval);
            window.addEventListener('beforeunload', () => this.flush());
        }
        if (this.config.debug)
            console.log('[Analytics] initialized with projectKey:', this.config.projectKey);
    }
    /**
     * Identifies an authenticated user and dispatches an $identify event with user traits.
     *
     * @param userId The unique identifier for the user.
     * @param traits Optional custom key-value traits (e.g., email, subscription tier).
     */
    identify(userId, traits) {
        this.currentUserId = userId;
        this.track('$identify', Object.assign({ userId }, traits));
        if (this.config.debug)
            console.log('[Analytics] identified user:', userId);
    }
    /**
     * Enqueues a behavioral tracking event with session, timestamp, URL, and device enrichment.
     *
     * @param name The name of the event (e.g. 'button_clicked', 'add_to_cart').
     * @param properties Optional custom metadata properties.
     */
    track(name, properties) {
        const event = {
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
        if (this.config.debug)
            console.log('[Analytics] tracked:', event);
    }
    /**
     * Automatically captures a $pageview event with the current document title and pathname.
     */
    capturePageview() {
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
    async flush() {
        if (this.queue.length === 0)
            return;
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
            if (this.config.debug)
                console.log('[Analytics] flushed', batch.length, 'events');
        }
        catch (err) {
            this.queue.unshift(...batch);
            if (this.config.debug)
                console.error('[Analytics] flush failed:', err);
        }
    }
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
let instance = null;
/**
 * Singleton client interface for simplified analytics tracking across web applications.
 */
const AnalyticsClient = {
    /**
     * Initializes the global Analytics instance with the provided configuration.
     *
     * @param config The analytics configuration settings.
     * @returns The initialized Analytics instance.
     *
     * @example
     * ```ts
     * Analytics.init({ projectKey: 'my_project_key' });
     * ```
     */
    init(config) {
        instance = new Analytics(config);
        instance.init();
        return instance;
    },
    /**
     * Identifies an authenticated user and attaches user traits to future events.
     *
     * @param userId Unique identifier for the user.
     * @param traits Optional dictionary of user metadata attributes.
     *
     * @example
     * ```ts
     * Analytics.identify('usr_4920', { role: 'admin' });
     * ```
     */
    identify(userId, traits) {
        instance === null || instance === void 0 ? void 0 : instance.identify(userId, traits);
    },
    /**
     * Tracks a custom user behavior event and queues it in the in-memory buffer.
     *
     * @param name The name of the event (e.g. 'button_clicked', 'purchase_completed').
     * @param properties Optional metadata properties associated with the event.
     *
     * @example
     * ```ts
     * Analytics.track('item_purchased', { itemId: 'item_99', price: 29.99 });
     * ```
     */
    track(name, properties) {
        instance === null || instance === void 0 ? void 0 : instance.track(name, properties);
    },
    /**
     * Flushes all currently queued events immediately to the ingestion API.
     *
     * @returns A promise that resolves when the batch has been transmitted.
     */
    flush() {
        return instance === null || instance === void 0 ? void 0 : instance.flush();
    },
    /**
     * Retrieves the underlying initialized Analytics class instance.
     *
     * @returns The active Analytics instance, or null if not yet initialized.
     */
    getInstance() {
        return instance;
    },
};

exports.Analytics = Analytics;
exports.default = AnalyticsClient;
