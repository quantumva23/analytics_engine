import { AnalyticsConfig } from './types';
export declare class Analytics {
    private config;
    private queue;
    private timer;
    constructor(config: AnalyticsConfig);
    init(): void;
    track(name: string, properties?: Record<string, unknown>): void;
    private capturePageview;
    private flush;
}
