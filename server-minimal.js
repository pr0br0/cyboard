require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Initialize app
const app = express();

// Basic middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime()
  });
});

// Database health check
app.get('/db-health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'OK',
      message: 'Database connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Minimal server running on port ${PORT}`);
});

module.exports = app; 