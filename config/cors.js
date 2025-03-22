// config/cors.js
const corsOptions = {
    origin: (origin, callback) => {
        const whitelist = (process.env.CORS_ORIGIN || '*').split(',');
        if (whitelist.includes('*') || whitelist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // 10 minutes
};

module.exports = corsOptions;