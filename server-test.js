require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const listingRoutes = require('./routes/listing.routes');

// Initialize app
const app = express();

// Database connection
connectDB()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch((err) => {
    logger.error('Database connection error:', err);
  });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Request timestamp
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Swagger documentation
setupSwagger(app);

// Basic route
app.get('/', (req, res) => {
  res.json({
    name: 'Cyprus Classified API',
    status: 'OK',
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`
🚀 Server is running in development mode
📡 Local: http://localhost:${PORT}
🔑 API Docs: http://localhost:${PORT}/api/docs
  `);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app; 