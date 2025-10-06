const rateLimit = require('express-rate-limit');

// Auth endpoints: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Transaction endpoints: 100 requests per hour
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    message: 'Too many transaction requests. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics endpoints: 50 requests per hour
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: 'Too many analytics requests. Please try again after an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter: 200 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  transactionLimiter,
  analyticsLimiter,
  generalLimiter
};