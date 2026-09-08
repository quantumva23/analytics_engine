/**
 * Retrieves the active visitor session ID or generates a new rolling UUID.
 * Sessions expire after 30 minutes of inactivity.
 *
 * @returns The unique 36-character session UUID.
 */
export declare function getSessionId(): string;
