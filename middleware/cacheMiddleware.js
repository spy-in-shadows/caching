const cacheService = require('../services/cacheService');

function getCacheKey(req) {
    const rawUrl = req.originalUrl || req.url || '';
    const [pathPart, queryPart] = rawUrl.split('?');
    const normalizedPath = pathPart.length > 1 ? pathPart.replace(/\/+$/, '') : pathPart;
    return queryPart !== undefined ? `${normalizedPath}?${queryPart}` : normalizedPath;
}

function cacheMiddleware(req, res, next) {
    if (req.method !== 'GET') {
        return next();
    }

    const key = getCacheKey(req);
    const cachedData = cacheService.get(key);

    if (cachedData !== null) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    const originalSend = res.send.bind(res);

    res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            let dataToCache = body;
            if (typeof body === 'string') {
                try {
                    dataToCache = JSON.parse(body);
                } catch {
                    dataToCache = body;
                }
            }
            cacheService.set(key, dataToCache);
        }
        return originalSend(body);
    };

    next();
}

function invalidateCacheMiddleware(req, res, next) {
    const originalSend = res.send.bind(res);

    res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheService.invalidateAll();
        }
        return originalSend(body);
    };

    next();
}

module.exports = {
    cacheMiddleware,
    invalidateCacheMiddleware,
    getCacheKey,
    cacheService
};
