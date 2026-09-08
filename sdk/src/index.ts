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

import { Analytics } from './analytics';
import type { AnalyticsConfig, AnalyticsEvent } from './types';

let instance: Analytics | null = null;

/**
 * Public client contract for the Analytics singleton interface.
 */
export interface IAnalyticsClient {
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
const AnalyticsClient: IAnalyticsClient = {
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
  init(config: AnalyticsConfig): Analytics {
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
  identify(userId: string, traits?: Record<string, unknown>): void {
    instance?.identify(userId, traits);
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
  track(name: string, properties?: Record<string, unknown>): void {
    instance?.track(name, properties);
  },

  /**
   * Flushes all currently queued events immediately to the ingestion API.
   *
   * @returns A promise that resolves when the batch has been transmitted.
   */
  flush(): Promise<void> | undefined {
    return instance?.flush();
  },

  /**
   * Retrieves the underlying initialized Analytics class instance.
   *
   * @returns The active Analytics instance, or null if not yet initialized.
   */
  getInstance(): Analytics | null {
    return instance;
  },
};

export default AnalyticsClient;
export { Analytics };
export type { AnalyticsConfig, AnalyticsEvent };