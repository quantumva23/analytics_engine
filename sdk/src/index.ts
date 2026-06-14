import { Analytics } from './analytics';
import type { AnalyticsConfig } from './types';

let instance: Analytics | null = null;

export default {
  init(config: AnalyticsConfig) {
    instance = new Analytics(config);
    instance.init();
  },
  track(name: string, properties?: Record<string, unknown>) {
    instance?.track(name, properties);
  },
};

export type { AnalyticsConfig };