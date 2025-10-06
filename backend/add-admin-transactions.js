const pool = require('./config/database');

async function addAdminTransactions() {
  try {
    console.log('🔧 Adding transactions for admin user...');

    // Get admin user ID
    const adminResult = await pool.query("SELECT id FROM users WHERE email = 'admin@example.com'");
    if (adminResult.rows.length === 0) {
      console.error('❌ Admin user not found');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    console.log(`📧 Admin user ID: ${adminId}`);

    // Get categories
    const categoriesResult = await pool.query('SELECT id, name, type FROM categories');
    const categories = categoriesResult.rows;
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    // Add 50 transactions for admin
    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() > 0.7; // 30% income, 70% expense
      const categoryList = isIncome ? incomeCategories : expenseCategories;
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];
      
      // Random date within last 6 months
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 180));
      
      // Random amounts
      const amount = isIncome 
        ? (Math.random() * 5000 + 2000).toFixed(2) // Income: $2000-$7000
        : (Math.random() * 800 + 50).toFixed(2);   // Expense: $50-$850
      
      const descriptions = isIncome 
        ? ['Admin salary', 'Consulting fee', 'Bonus payment', 'Investment return', 'Side project']
        : ['Office supplies', 'Team lunch', 'Software license', 'Travel expense', 'Equipment purchase', 'Meeting coffee'];
      
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      await pool.query(`
        INSERT INTO transactions (user_id, category_id, amount, type, description, date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminId, category.id, amount, isIncome ? 'income' : 'expense', description, date]);
    }

    // Add some recent transactions for admin (last 7 days)
    for (let i = 0; i < 10; i++) {
      const isIncome = i < 3; // First 3 are income
      const categoryList = isIncome ? incomeCategories : expenseCategories;
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const amount = isIncome 
        ? (Math.random() * 3000 + 1000).toFixed(2)
        : (Math.random() * 300 + 25).toFixed(2);
      
      const recentDescriptions = isIncome 
        ? ['Admin bonus', 'Consulting payment', 'Project completion']
        : ['Office lunch', 'Parking fee', 'Stationery', 'Coffee meeting'];
      
      const description = recentDescriptions[Math.floor(Math.random() * recentDescriptions.length)];
      
      await pool.query(`
        INSERT INTO transactions (user_id, category_id, amount, type, description, date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [adminId, category.id, amount, isIncome ? 'income' : 'expense', description, date]);
    }

    // Get admin transaction summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as transaction_count,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions 
      WHERE user_id = $1
    `, [adminId]);
    
    const summary = summaryResult.rows[0];
    console.log(`✅ Added ${summary.transaction_count} transactions for admin`);
    console.log(`💰 Total Income: $${summary.total_income}`);
    console.log(`💸 Total Expense: $${summary.total_expense}`);
    console.log(`💵 Net Balance: $${summary.total_income - summary.total_expense}`);

  } catch (error) {
    console.error('❌ Failed to add admin transactions:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addAdminTransactions();