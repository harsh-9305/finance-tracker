const pool = require('../config/database');
const cache = require('../utils/cache');

// Get user analytics summary
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'all', startDate, endDate } = req.query;

    // Build cache key
    const cacheKey = cache.getUserAnalyticsKey(userId, period);
    
    // Check cache first
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Build date filter
    let dateFilter = '';
    const params = [userId];
    
    if (startDate && endDate) {
      dateFilter = 'AND date BETWEEN $2 AND $3';
      params.push(startDate, endDate);
    } else if (period !== 'all') {
      const periodMap = {
        'today': "AND date = CURRENT_DATE",
        'week': "AND date >= CURRENT_DATE - INTERVAL '7 days'",
        'month': "AND date >= CURRENT_DATE - INTERVAL '30 days'",
        'year': "AND date >= CURRENT_DATE - INTERVAL '1 year'"
      };
      dateFilter = periodMap[period] || '';
    }

    // Get total income and expenses
    const summaryQuery = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
      FROM transactions
      WHERE user_id = $1 ${dateFilter}
    `;
    
    const summaryResult = await pool.query(summaryQuery, params);
    const summary = summaryResult.rows[0];

    // Get category breakdown
    const categoryQuery = `
      SELECT 
        c.name as category,
        t.type,
        SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 ${dateFilter}
      GROUP BY c.name, t.type
      ORDER BY total DESC
    `;
    
    const categoryResult = await pool.query(categoryQuery, params);

    // Get monthly trends
    const trendsQuery = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = $1 ${dateFilter}
      GROUP BY TO_CHAR(date, 'YYYY-MM'), type
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const trendsResult = await pool.query(trendsQuery, params);

    const analytics = {
      summary: {
        totalIncome: parseFloat(summary.total_income) || 0,
        totalExpenses: parseFloat(summary.total_expenses) || 0,
        balance: (parseFloat(summary.total_income) || 0) - (parseFloat(summary.total_expenses) || 0),
        incomeCount: parseInt(summary.income_count) || 0,
        expenseCount: parseInt(summary.expense_count) || 0
      },
      categoryBreakdown: categoryResult.rows,
      monthlyTrends: trendsResult.rows
    };

    // Cache the result for 15 minutes
    await cache.set(cacheKey, analytics, 900);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get spending by category
const getSpendingByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type = 'expense' } = req.query;

    let dateFilter = '';
    const params = [userId, type];
    
    if (startDate && endDate) {
      dateFilter = 'AND t.date BETWEEN $3 AND $4';
      params.push(startDate, endDate);
    }

    const query = `
      SELECT 
        c.name as category,
        c.id as category_id,
        SUM(t.amount) as total,
        COUNT(*) as transaction_count,
        AVG(t.amount) as average_amount,
        MAX(t.amount) as max_amount,
        MIN(t.amount) as min_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1 AND t.type = $2 ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total: parseFloat(row.total),
        average_amount: parseFloat(row.average_amount),
        max_amount: parseFloat(row.max_amount),
        min_amount: parseFloat(row.min_amount)
      }))
    });
  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get income vs expenses over time
const getIncomeVsExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupBy = 'month', limit = 12 } = req.query;

    const groupByMap = {
      'day': "TO_CHAR(date, 'YYYY-MM-DD')",
      'week': "TO_CHAR(date, 'IYYY-IW')",
      'month': "TO_CHAR(date, 'YYYY-MM')",
      'year': "TO_CHAR(date, 'YYYY')"
    };

    const groupByClause = groupByMap[groupBy] || groupByMap['month'];

    const query = `
      SELECT 
        ${groupByClause} as period,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions
      WHERE user_id = $1
      GROUP BY ${groupByClause}
      ORDER BY period DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        period: row.period,
        income: parseFloat(row.income),
        expenses: parseFloat(row.expenses),
        net: parseFloat(row.income) - parseFloat(row.expenses)
      })).reverse()
    });
  } catch (error) {
    console.error('Get income vs expenses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  getAnalytics,
  getSpendingByCategory,
  getIncomeVsExpenses
};