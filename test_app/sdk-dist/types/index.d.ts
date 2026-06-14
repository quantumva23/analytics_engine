interface AnalyticsConfig {
    projectKey: string;
    endpoint?: string;
    flushInterval?: number;
    debug?: boolean;
}

declare const _default: {
    init(config: AnalyticsConfig): void;
    track(name: string, properties?: Record<string, unknown>): void;
};

export { _default as default };
export type { AnalyticsConfig };
