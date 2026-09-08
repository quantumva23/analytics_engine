import { AnalyticsConfig } from './types';
export declare class Analytics {
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
