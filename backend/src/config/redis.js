/**
 * Redis Client — with in-memory fallback for local dev without Redis installed.
 * Production should always use a real Redis instance.
 */
const redis = require('redis');

// --- In-Memory Fallback ---
const memStore = new Map();
const fakeTTLs = new Map();

const inMemoryClient = {
    isConnected: true,
    get: async (key) => memStore.get(key) ?? null,
    set: async (key, val, opts) => {
        memStore.set(key, String(val));
        if (opts?.EX) {
            if (fakeTTLs.has(key)) clearTimeout(fakeTTLs.get(key));
            fakeTTLs.set(key, setTimeout(() => memStore.delete(key), opts.EX * 1000));
        }
        return 'OK';
    },
    del: async (key) => { memStore.delete(key); return 1; },
    sAdd: async (key, val) => {
        const s = memStore.get(key) || new Set();
        s.add(val);
        memStore.set(key, s);
        return 1;
    },
    sRem: async (key, val) => {
        const s = memStore.get(key);
        if (s && s instanceof Set) s.delete(val);
        return 1;
    },
    sMembers: async (key) => {
        const s = memStore.get(key);
        return (s instanceof Set) ? [...s] : [];
    },
    on: () => { },
    connect: async () => { },
};

let client = inMemoryClient;

// Try to connect to a real Redis instance
const realClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: { reconnectStrategy: (retries) => retries > 2 ? false : 500 }
});

realClient.on('error', () => {
    // Silently fall back to in-memory store
});

realClient.on('connect', () => {
    console.log('✅ Redis connected (real)');
    client = realClient;
});

realClient.connect().catch(() => {
    console.warn('⚠️  Redis unavailable — using in-memory store (ok for local dev)');
});

// Proxy that always routes to whichever client is active
const proxy = new Proxy({}, {
    get: (_, prop) => {
        if (prop === 'isConnected') return client === realClient;
        const method = realClient.isOpen ? realClient[prop] : inMemoryClient[prop];
        if (typeof method === 'function') return method.bind(realClient.isOpen ? realClient : inMemoryClient);
        return method;
    }
});

module.exports = proxy;
