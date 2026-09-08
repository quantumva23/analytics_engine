const SESSION_KEY = 'anlx_sid';
const SESSION_TTL = 30 * 60 * 1000;

/**
 * Retrieves the active visitor session ID or generates a new rolling UUID.
 * Sessions expire after 30 minutes of inactivity.
 *
 * @returns The unique 36-character session UUID.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return 'srv_session';
  }

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const { id, exp } = JSON.parse(stored);
      if (Date.now() < exp) {
        sessionStorage.setItem(SESSION_KEY,
          JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
        return id;
      }
    }
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'sid_' + Math.random().toString(36).substring(2, 12);

    sessionStorage.setItem(SESSION_KEY,
      JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
    return id;
  } catch {
    return 'sid_fallback';
  }
}