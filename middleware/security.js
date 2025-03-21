const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const securityMiddleware = {
    rateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100, // Лимит запросов
        message: 'Too many requests from this IP, please try again later'
    }),

    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                fontSrc: ["'self'", 'https:', 'data:'],
                connectSrc: ["'self'", 'https:']
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }),

    xss: xss(),
    hpp: hpp({
        whitelist: [
            'price',
            'category',
            'sort',
            'limit',
            'page'
        ]
    })
};

module.exports = securityMiddleware;