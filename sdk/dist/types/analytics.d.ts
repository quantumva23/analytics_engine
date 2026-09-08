import { AnalyticsConfig } from './types';
/**
 * Core Analytics class responsible for event queuing, session tracking,
 * automatic pageview capturing, and debounced batch ingestion.
 */
export declare class Analytics {
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
