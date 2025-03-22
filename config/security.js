const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const securityConfig = {
    rateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100 // максимум 100 запросов с одного IP
    }),
    helmetConfig: helmet(),
    corsOptions: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://yourwebsite.com'] 
            : ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
};

module.exports = securityConfig;