interface AnalyticsConfig {
    projectKey: string;
    endpoint?: string;
    flushInterval?: number;
    debug?: boolean;
}
interface AnalyticsEvent {
    name: string;
    properties?: Record<string, unknown>;
    sessionId: string;
    userId?: string;
    timestamp: number;
    url: string;
    referrer: string;
    userAgent: string;
}

declare class Analytics {
    private config;
    private queue;
    private timer;
    private currentUserId?;
    constructor(config: AnalyticsConfig);
    init(): void;
    identify(userId: string, traits?: Record<string, unknown>): void;
    track(name: string, properties?: Record<string, unknown>): void;
    private capturePageview;
    flush(): Promise<void>;
}

declare const AnalyticsClient: {
    init(config: AnalyticsConfig): Analytics;
    identify(userId: string, traits?: Record<string, unknown>): void;
    track(name: string, properties?: Record<string, unknown>): void;
    flush(): Promise<void> | undefined;
    getInstance(): Analytics | null;
};

export { Analytics, AnalyticsClient as default };
export type { AnalyticsConfig, AnalyticsEvent };
