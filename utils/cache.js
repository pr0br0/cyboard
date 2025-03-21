const NodeCache = require('node-cache');
const logger = require('./logger');

// Простой in-memory кэш
const cache = new NodeCache({
    stdTTL: 3600, // 1 час по умолчанию
    checkperiod: 120 // проверка устаревших каждые 2 минуты
});

const cacheMiddleware = (duration = 3600) => {
    return (req, res, next) => {
        // Пропускаем кэширование для не-GET запросов
        if (req.method !== 'GET') {
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        }

        // Заменяем оригинальный res.json()
        const originalJson = res.json;
        res.json = function(body) {
            cache.set(key, body, duration);
            originalJson.call(this, body);
        };

        next();
    };
};

// Простой rate limiter в памяти
const rateLimiter = {
    requests: new Map(),
    
    check(ip, limit = 100, window = 900000) { // 15 минут по умолчанию
        const now = Date.now();
        const userRequests = this.requests.get(ip) || [];
        
        // Очищаем старые запросы
        const validRequests = userRequests.filter(time => now - time < window);
        
        if (validRequests.length >= limit) {
            return false;
        }
        
        validRequests.push(now);
        this.requests.set(ip, validRequests);
        return true;
    },

    middleware(limit = 100, window = 900000) {
        return (req, res, next) => {
            const ip = req.ip;
            
            if (!this.check(ip, limit, window)) {
                return res.status(429).json({
                    success: false,
                    message: 'Too many requests, please try again later'
                });
            }
            
            next();
        };
    }
};

module.exports = {
    cache,
    cacheMiddleware,
    rateLimiter
};