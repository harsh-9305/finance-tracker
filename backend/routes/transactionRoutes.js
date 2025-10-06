const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  transactionValidation
} = require('../controllers/transactionController');
const authenticateToken = require('../middleware/auth');
const { preventReadOnly } = require('../middleware/roleCheck');
const { transactionLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(transactionLimiter);

// GET routes - accessible to all authenticated users
router.get('/', getTransactions);
router.get('/:id', getTransaction);

// POST, PUT, DELETE routes - blocked for read-only users
router.post('/', preventReadOnly, transactionValidation, createTransaction);
router.put('/:id', preventReadOnly, transactionValidation, updateTransaction);
router.delete('/:id', preventReadOnly, deleteTransaction);

module.exports = router;