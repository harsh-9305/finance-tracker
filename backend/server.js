const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Import database connections
const pool = require('./config/database');
const redisClient = require('./config/redis');

// Import routes
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize express app
const app = express();

// Security middleware - Helmet helps protect against XSS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check Redis connection if available
    let redisStatus = 'not configured';
    if (redisClient) {
      try {
        await redisClient.ping();
        redisStatus = 'connected';
      } catch (redisError) {
        redisStatus = 'disconnected';
      }
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      analytics: '/api/analytics',
      users: '/api/users'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // SQL Injection attempt detection
  const sqlKeywords = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'UNION', '--', ';'];
  const requestData = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  if (sqlKeywords.some(keyword => requestData.toUpperCase().includes(keyword))) {
    return res.status(400).json({
      success: false,
      message: 'Potentially malicious request detected'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🚀 Finance Tracker API Server          ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV}    ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    await redisClient.quit();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    await redisClient.quit();
    process.exit(0);
  });
});

module.exports = app;