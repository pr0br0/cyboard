require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');

// Validate required environment variables
const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

// Validate environment-specific variables
if (process.env.NODE_ENV === 'production') {
    const prodEnvVars = [
        'CORS_ORIGIN',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET'
    ];
    
    const missingProdEnvVars = prodEnvVars.filter(envVar => !process.env[envVar]);
    if (missingProdEnvVars.length > 0) {
        console.error('❌ Missing required production environment variables:', missingProdEnvVars.join(', '));
        process.exit(1);
    }
}

const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const healthCheck = require('./middleware/healthCheck');
const setupSwagger = require('./swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listing.routes');

// Disable warnings about indexes
mongoose.set('strictQuery', false);
mongoose.set('debug', process.env.NODE_ENV === 'development');

// Initialize app
const app = express();

// Connect to database
connectDB()
    .then(() => {
        logger.info('✅ Database connected successfully');
        logger.info(`MongoDB Atlas Connection Status:
--------------------------------
Host: ${mongoose.connection.host}
Database: ${mongoose.connection.name}
State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
--------------------------------`);
    })
    .catch((err) => {
        logger.error('❌ Database connection error:', err);
        process.exit(1);
    });

// Security configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // Request limit from env
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

app.use('/api', limiter);
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600
}));
app.use(mongoSanitize());
app.use(xss());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static file middleware with verbose logging
console.log('Setting up static file middleware - serving from:', path.join(__dirname, 'public'));
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        console.log(`Serving static file: ${filePath}`);
        // Set cache control headers
        res.setHeader('Cache-Control', 'no-cache');
    }
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Request timestamp middleware
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// Swagger documentation
setupSwagger(app);

// Health check routes
app.get('/health', healthCheck);
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// Base route
app.get('/', (req, res) => {
    console.log('Serving index.html with headers:', req.headers);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HTML routes
app.get('/listings', (req, res) => {
    console.log('Serving listings.html');
    res.sendFile(path.join(__dirname, 'public', 'listings.html'));
});

app.get('/listing/:id', (req, res) => {
    console.log(`Serving listing-detail.html for ID: ${req.params.id}`);
    res.sendFile(path.join(__dirname, 'public', 'listing-detail.html'));
});

app.get('/post-ad', (req, res) => {
    console.log('Serving post-ad.html');
    res.sendFile(path.join(__dirname, 'public', 'post-ad.html'));
});

// Test route for CSS
app.get('/test-css', (req, res) => {
    console.log('Serving test CSS page');
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CSS Test Page</title>
            <link rel="stylesheet" href="/styles/main.css">
            <style>
                .test-section { padding: 20px; margin: 20px; border: 1px solid #ccc; }
            </style>
        </head>
        <body>
            <div class="test-section">
                <h1>CSS Test Page</h1>
                <p>This page tests if the CSS is being served correctly.</p>
                <button class="btn btn-primary">Primary Button</button>
                <div class="hero-section" style="padding: 20px; margin-top: 20px;">
                    <h2>Hero Section Test</h2>
                    <p>This should have styling from main.css</p>
                </div>
                <div class="card" style="max-width: 300px; margin-top: 20px;">
                    <div class="card-body">
                        <h5 class="card-title">Test Card</h5>
                        <p>This is a test card component</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// API information
app.get('/api', (req, res) => {
    res.json({
        name: 'Cyprus Classified API',
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV,
        documentation: '/api/docs'
    });
});

// Test routes
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working correctly',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        database: {
            connected: mongoose.connection.readyState === 1,
            host: mongoose.connection.host,
            name: mongoose.connection.name
        }
    });
});

app.get('/api/test/error', (req, res, next) => {
    try {
        throw new Error('Test error handling');
    } catch (error) {
        next(error);
    }
});

// 404 handler
app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info(`
🚀 Server is running in ${process.env.NODE_ENV} mode
📡 Local:            http://localhost:${PORT}
🔑 API Docs:         http://localhost:${PORT}/api
⚡ Database:         ${process.env.NODE_ENV === 'production' ? 'Connected' : process.env.MONGODB_URI}
    `);
});

// Graceful shutdown
const shutdown = () => {
    logger.info('🔄 Received shutdown signal. Closing server...');
    server.close(() => {
        logger.info('✋ Server closed. Process terminated.');
        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        logger.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Shutdown signal handlers
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Unhandled error handlers
process.on('unhandledRejection', (err) => {
    logger.error('❌ Unhandled Rejection:', err);
    shutdown();
});

process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    shutdown();
});

module.exports = app;