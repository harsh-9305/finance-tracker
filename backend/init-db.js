const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'read-only')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, user_id, type)
      )
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        description TEXT,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`);

    // Hash passwords
    const adminPassword = await bcrypt.hash('password123', 10);
    const userPassword = await bcrypt.hash('password123', 10);
    const readonlyPassword = await bcrypt.hash('password123', 10);

    // Insert dummy users
    await pool.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@example.com', $1, 'Admin User', 'admin'),
      ('user@example.com', $2, 'Regular User', 'user'),
      ('readonly@example.com', $3, 'Read Only User', 'read-only')
      ON CONFLICT (email) DO NOTHING
    `, [adminPassword, userPassword, readonlyPassword]);

    // Insert default categories
    await pool.query(`
      INSERT INTO categories (name, type, user_id) VALUES
      ('Salary', 'income', NULL),
      ('Freelance', 'income', NULL),
      ('Investment', 'income', NULL),
      ('Food', 'expense', NULL),
      ('Transportation', 'expense', NULL),
      ('Entertainment', 'expense', NULL),
      ('Utilities', 'expense', NULL),
      ('Healthcare', 'expense', NULL),
      ('Shopping', 'expense', NULL)
      ON CONFLICT (name, user_id, type) DO NOTHING
    `);

    console.log('✅ Database initialized successfully!');
    console.log('📧 Demo users created:');
    console.log('   Admin: admin@example.com / password123');
    console.log('   User: user@example.com / password123');
    console.log('   Read-only: readonly@example.com / password123');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initializeDatabase();