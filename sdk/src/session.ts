const SESSION_KEY = 'anlx_sid';
const SESSION_TTL = 30 * 60 * 1000;

export function getSessionId(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    const { id, exp } = JSON.parse(stored);
    if (Date.now() < exp) {
      sessionStorage.setItem(SESSION_KEY,
        JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
      return id;
    }
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY,
    JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
  return id;
}