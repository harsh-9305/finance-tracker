const pool = require('./config/database');

async function seedTransactionData() {
  try {
    console.log('🌱 Seeding transaction data...');

    // Get users and categories
    const usersResult = await pool.query('SELECT id, email FROM users');
    const categoriesResult = await pool.query('SELECT id, name, type FROM categories');
    
    const users = usersResult.rows;
    const categories = categoriesResult.rows;
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    // Generate transactions for each user
    for (const user of users) {
      console.log(`Adding transactions for ${user.email}...`);
      
      // Generate 50 transactions per user over last 6 months
      for (let i = 0; i < 50; i++) {
        const isIncome = Math.random() > 0.7; // 30% income, 70% expense
        const categoryList = isIncome ? incomeCategories : expenseCategories;
        const category = categoryList[Math.floor(Math.random() * categoryList.length)];
        
        // Random date within last 6 months
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 180));
        
        // Random amounts
        const amount = isIncome 
          ? (Math.random() * 4000 + 1000).toFixed(2) // Income: $1000-$5000
          : (Math.random() * 500 + 10).toFixed(2);   // Expense: $10-$510
        
        const descriptions = isIncome 
          ? ['Monthly salary', 'Freelance project', 'Investment return', 'Bonus payment', 'Side hustle']
          : ['Grocery shopping', 'Gas station', 'Restaurant', 'Online purchase', 'Utility bill', 'Coffee shop', 'Movie tickets'];
        
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        
        await pool.query(`
          INSERT INTO transactions (user_id, category_id, amount, type, description, date)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [user.id, category.id, amount, isIncome ? 'income' : 'expense', description, date]);
      }
    }

    // Add some recent transactions for better demo
    for (const user of users) {
      // Add 5 recent transactions (last 7 days)
      for (let i = 0; i < 5; i++) {
        const isIncome = i < 2; // First 2 are income
        const categoryList = isIncome ? incomeCategories : expenseCategories;
        const category = categoryList[Math.floor(Math.random() * categoryList.length)];
        
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const amount = isIncome 
          ? (Math.random() * 2000 + 500).toFixed(2)
          : (Math.random() * 200 + 20).toFixed(2);
        
        const recentDescriptions = isIncome 
          ? ['Client payment', 'Salary deposit']
          : ['Lunch', 'Uber ride', 'Groceries', 'Coffee'];
        
        const description = recentDescriptions[Math.floor(Math.random() * recentDescriptions.length)];
        
        await pool.query(`
          INSERT INTO transactions (user_id, category_id, amount, type, description, date)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [user.id, category.id, amount, isIncome ? 'income' : 'expense', description, date]);
      }
    }

    // Get transaction counts
    const countResult = await pool.query('SELECT COUNT(*) as total FROM transactions');
    console.log(`✅ Added ${countResult.rows[0].total} transactions successfully!`);
    
    // Show summary per user
    const summaryResult = await pool.query(`
      SELECT u.email, 
             COUNT(t.id) as transaction_count,
             SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
             SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
      FROM users u
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    console.log('\n📊 Transaction Summary:');
    summaryResult.rows.forEach(row => {
      console.log(`${row.email}: ${row.transaction_count} transactions, Income: $${row.total_income}, Expense: $${row.total_expense}`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedTransactionData();