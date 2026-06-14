const SESSION_KEY = 'anlx_sid';
const SESSION_TTL = 30 * 60 * 1000;
function getSessionId() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
        const { id, exp } = JSON.parse(stored);
        if (Date.now() < exp) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
            return id;
        }
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, exp: Date.now() + SESSION_TTL }));
    return id;
}

class Analytics {
    constructor(config) {
        this.queue = [];
        this.timer = null;
        this.config = Object.assign({ endpoint: 'http://localhost:4000/ingest', flushInterval: 5000, debug: false }, config);
    }
    init() {
        this.capturePageview();
        this.timer = setInterval(() => this.flush(), this.config.flushInterval);
        window.addEventListener('beforeunload', () => this.flush());
        if (this.config.debug)
            console.log('[Analytics] initialized');
    }
    track(name, properties) {
        const event = {
            name,
            properties,
            sessionId: getSessionId(),
            timestamp: Date.now(),
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
        };
        this.queue.push(event);
        if (this.config.debug)
            console.log('[Analytics] tracked:', event);
    }
    capturePageview() {
        this.track('$pageview', {
            title: document.title,
            path: window.location.pathname,
        });
    }
    async flush() {
        if (this.queue.length === 0)
            return;
        const batch = [...this.queue];
        this.queue = [];
        try {
            await fetch(this.config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectKey: this.config.projectKey,
                    events: batch,
                }),
                keepalive: true,
            });
            if (this.config.debug)
                console.log('[Analytics] flushed', batch.length, 'events');
        }
        catch (err) {
            this.queue.unshift(...batch);
            if (this.config.debug)
                console.error('[Analytics] flush failed:', err);
        }
    }
}

let instance = null;
var index = {
    init(config) {
        instance = new Analytics(config);
        instance.init();
    },
    track(name, properties) {
        instance === null || instance === void 0 ? void 0 : instance.track(name, properties);
    },
};

export { index as default };
