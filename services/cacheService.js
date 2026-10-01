const DEFAULT_TTL_MS = 60 * 1000;

class CacheService {
    constructor(ttlMs = null) {
        this.cache = new Map();
        this.ttlMs = ttlMs !== null ? ttlMs : (
            process.env.CACHE_TTL_MS !== undefined ? parseInt(process.env.CACHE_TTL_MS, 10) : DEFAULT_TTL_MS
        );
    }

    getTTL() {
        return this.ttlMs;
    }

    setTTL(ttlMs) {
        this.ttlMs = ttlMs;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            createdAt: Date.now()
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        const age = Date.now() - entry.createdAt;
        if (age > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    has(key) {
        return this.get(key) !== null;
    }

    invalidate(key) {
        return this.cache.delete(key);
    }

    invalidateAll() {
        this.cache.clear();
    }

    invalidatePrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    size() {
        return this.cache.size;
    }

    getRaw(key) {
        return this.cache.get(key) || null;
    }
}

const cacheService = new CacheService();

module.exports = cacheService;
module.exports.CacheService = CacheService;
