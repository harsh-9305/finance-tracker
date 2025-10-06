const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getSpendingByCategory,
  getIncomeVsExpenses
} = require('../controllers/analyticsController');
const authenticateToken = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(analyticsLimiter);

// All analytics routes are read-only, accessible to all authenticated users
router.get('/', getAnalytics);
router.get('/spending-by-category', getSpendingByCategory);
router.get('/income-vs-expenses', getIncomeVsExpenses);

module.exports = router;