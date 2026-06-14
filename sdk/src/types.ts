export interface AnalyticsConfig {
  projectKey: string;
  endpoint?: string;
  flushInterval?: number;
  debug?: boolean;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  sessionId: string;
  timestamp: number;
  url: string;
  referrer: string;
  userAgent: string;
}