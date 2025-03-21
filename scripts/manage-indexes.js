require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const morgan = require('morgan');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Отключаем предупреждения об индексах
mongoose.set('strictQuery', false);
mongoose.set('debug', process.env.NODE_ENV === 'development');

// Импорт маршрутов
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const listingRoutes = require('./routes/listing.routes');

// Инициализация приложения
const app = express();

// Подключение к базе данных
connectDB()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((err) => {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    });

// Настройка безопасности
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet()); // Безопасность заголовков
app.use('/api', limiter); // Rate limiting для API
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(mongoSanitize()); // Защита от MongoDB инъекций
app.use(xss()); // Защита от XSS атак
app.use(compression()); // Сжатие ответов
app.use(express.json({ limit: '10kb' })); // Ограничение размера JSON
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Логирование в режиме разработки
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Middleware для добавления временной метки
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API информация
app.get('/api', (req, res) => {
    res.json({
        success: true,
        timestamp: req.requestTime,
        name: 'Cyprus Classified API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV,
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/profile'
            },
            categories: {
                getAll: 'GET /api/categories',
                getOne: 'GET /api/categories/:id',
                create: 'POST /api/categories',
                update: 'PUT /api/categories/:id',
                delete: 'DELETE /api/categories/:id'
            },
            listings: {
                getAll: 'GET /api/listings',
                getOne: 'GET /api/listings/:id',
                create: 'POST /api/listings',
                update: 'PUT /api/listings/:id',
                delete: 'DELETE /api/listings/:id'
            }
        },
        documentation: {
            auth: {
                register: {
                    method: 'POST',
                    url: '/api/auth/register',
                    body: {
                        email: 'string',
                        password: 'string',
                        name: 'string',
                        phone: 'string (optional)'
                    }
                },
                login: {
                    method: 'POST',
                    url: '/api/auth/login',
                    body: {
                        email: 'string',
                        password: 'string'
                    }
                }
            },
            listings: {
                create: {
                    method: 'POST',
                    url: '/api/listings',
                    auth: 'Required',
                    body: {
                        title: {
                            en: 'string',
                            ru: 'string',
                            el: 'string'
                        },
                        description: {
                            en: 'string',
                            ru: 'string',
                            el: 'string'
                        },
                        category: 'categoryId',
                        price: {
                            amount: 'number',
                            currency: 'string',
                            negotiable: 'boolean'
                        },
                        location: {
                            city: 'string',
                            district: 'string',
                            address: 'string'
                        }
                    }
                }
            }
        }
    });
});

// Тестовый маршрут
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working correctly',
        timestamp: new Date(),
        environment: process.env.NODE_ENV
    });
});

// Обработка 404
app.all('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Глобальный обработчик ошибок
app.use(errorHandler);

// Запуск сервера
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`
🚀 Server is running in ${process.env.NODE_ENV} mode
📡 Local:            http://localhost:${PORT}
🔑 API Docs:         http://localhost:${PORT}/api
⚡ Database:         ${process.env.NODE_ENV === 'production' ? 'Connected' : process.env.MONGODB_URI}
    `);
});

// Graceful shutdown
const shutdown = () => {
    console.log('🔄 Received shutdown signal. Closing server...');
    server.close(() => {
        console.log('✋ Server closed. Process terminated.');
        process.exit(0);
    });

    // Принудительное закрытие через 10 секунд
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Обработка необработанных ошибок
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    shutdown();
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    shutdown();
});