const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const cache = require('../utils/cache');

// Validation rules
const transactionValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').optional().trim(),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('category_id').optional().isInt().withMessage('Invalid category ID')
];

// Get all transactions for user
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate, categoryId } = req.query;

    // Build cache key
    const cacheKey = cache.getTransactionsKey(userId, { type, startDate, endDate, categoryId });
    
    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build query
    let query = `
      SELECT t.*, c.name as category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND t.type = $${paramCount}`;
      params.push(type);
    }

    if (startDate) {
      paramCount++;
      query += ` AND t.date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND t.date <= $${paramCount}`;
      params.push(endDate);
    }

    if (categoryId) {
      paramCount++;
      query += ` AND t.category_id = $${paramCount}`;
      params.push(categoryId);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const result = await pool.query(query, params);

    // Cache the result
    await cache.set(cacheKey, result.rows, 600); // 10 minutes

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get single transaction
const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT t.*, c.name as category_name 
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1
    `;
    const params = [id];

    // Non-admin users can only see their own transactions
    if (userRole !== 'admin') {
      query += ' AND t.user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Create new transaction
const createTransaction = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const userId = req.user.id;
    const { amount, type, description, date, category_id } = req.body;

    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, type, description, date, category_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, amount, type, description || null, date || new Date(), category_id || null]
    );

    // Invalidate cache
    await cache.invalidateUserCache(userId);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { amount, type, description, date, category_id } = req.body;

    // Check if transaction exists and user has permission
    let checkQuery = 'SELECT user_id FROM transactions WHERE id = $1';
    const checkParams = [id];

    if (userRole !== 'admin') {
      checkQuery += ' AND user_id = $2';
      checkParams.push(userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found or access denied' 
      });
    }

    // Update transaction
    const result = await pool.query(
      `UPDATE transactions 
       SET amount = $1, type = $2, description = $3, date = $4, category_id = $5
       WHERE id = $6
       RETURNING *`,
      [amount, type, description, date, category_id, id]
    );

    // Invalidate cache
    const transactionUserId = checkResult.rows[0].user_id;
    await cache.invalidateUserCache(transactionUserId);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if transaction exists and user has permission
    let checkQuery = 'SELECT user_id FROM transactions WHERE id = $1';
    const checkParams = [id];

    if (userRole !== 'admin') {
      checkQuery += ' AND user_id = $2';
      checkParams.push(userId);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found or access denied' 
      });
    }

    // Delete transaction
    await pool.query('DELETE FROM transactions WHERE id = $1', [id]);

    // Invalidate cache
    const transactionUserId = checkResult.rows[0].user_id;
    await cache.invalidateUserCache(transactionUserId);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  transactionValidation
};