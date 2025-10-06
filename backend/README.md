# Finance Tracker Backend API

A comprehensive finance tracking backend built with Node.js, Express, PostgreSQL, and Redis. Features include role-based access control, caching, rate limiting, and security measures against common attacks.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Project Structure](#project-structure)

## ✨ Features

### Core Features
- ✅ User authentication with JWT
- ✅ Transaction management (CRUD operations)
- ✅ Analytics and reporting
- ✅ Category management
- ✅ User profile management

### Advanced Features
- ✅ **Redis Caching**
  - User analytics cached for 15 minutes
  - Category lists cached for 1 hour
  - Automatic cache invalidation on data updates
  
- ✅ **Rate Limiting**
  - Auth endpoints: 5 requests/15 minutes
  - Transaction endpoints: 100 requests/hour
  - Analytics endpoints: 50 requests/hour
  
- ✅ **Role-Based Access Control (RBAC)**
  - Admin: Full privileges
  - User: CRUD on own data
  - Read-only: View-only access
  
- ✅ **Security**
  - XSS protection via Helmet
  - SQL injection prevention with parameterized queries
  - Token-based authentication
  - Input validation and sanitization

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, express-validator
- **Rate Limiting**: express-rate-limit

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd finance-tracker-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Update the `.env` file with your configuration**

## 🗄 Database Setup

1. **Create PostgreSQL database**
```bash
psql -U postgres
CREATE DATABASE finance_tracker;
\q
```

2. **Run the schema**
```bash
psql -U postgres -d finance_tracker -f schema.sql
```

3. **Verify tables created**
```bash
psql -U postgres -d finance_tracker
\dt
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

## ▶️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "user"  // optional: admin, user, read-only
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Transaction Endpoints

#### Get All Transactions
```http
GET /api/transactions
Authorization: Bearer <token>
Query Parameters:
  - type: income|expense
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
  - categoryId: number
```

#### Get Single Transaction
```http
GET /api/transactions/:id
Authorization: Bearer <token>
```

#### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.50,
  "type": "expense",
  "description": "Grocery shopping",
  "date": "2025-10-05",
  "category_id": 1
}
```

#### Update Transaction
```http
PUT /api/transactions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 150.00,
  "type": "expense",
  "description": "Updated description",
  "date": "2025-10-05",
  "category_id": 2
}
```

#### Delete Transaction
```http
DELETE /api/transactions/:id
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Get User Analytics
```http
GET /api/analytics
Authorization: Bearer <token>
Query Parameters:
  - period: today|week|month|year|all
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
```

#### Get Spending by Category
```http
GET /api/analytics/spending-by-category
Authorization: Bearer <token>
Query Parameters:
  - type: income|expense
  - startDate: YYYY-MM-DD
  - endDate: YYYY-MM-DD
```

#### Get Income vs Expenses
```http
GET /api/analytics/income-vs-expenses
Authorization: Bearer <token>
Query Parameters:
  - groupBy: day|week|month|year
  - limit: number (default: 12)
```

### User Management Endpoints

#### Get All Users (Admin Only)
```http
GET /api/users
Authorization: Bearer <token>
Query Parameters:
  - role: admin|user|read-only
  - search: string
```

#### Get User by ID (Admin Only)
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User Role (Admin Only)
```http
PUT /api/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"  // admin|user|read-only
}
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

#### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

#### Get Categories
```http
GET /api/users/categories
Authorization: Bearer <token>
Query Parameters:
  - type: income|expense
```

#### Create Category
```http
POST /api/users/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Custom Category",
  "type": "expense"
}
```

## 🔒 Security Features

### 1. XSS Protection
- Helmet middleware with Content Security Policy
- XSS filter enabled
- Input validation and sanitization

### 2. SQL Injection Prevention
- Parameterized queries for all database operations
- Input validation using express-validator
- Request monitoring for malicious patterns

### 3. Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Token expiration
- Role-based access control

### 4. Rate Limiting
- Different limits for different endpoints
- Prevents brute force attacks
- Configurable windows and limits

### 5. CORS Configuration
- Restricted origins
- Credential support
- Method whitelisting

## 📁 Project Structure

```
finance-tracker-backend/
├── config/
│   ├── database.js          # PostgreSQL connection
│   └── redis.js             # Redis client setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── transactionController.js
│   ├── analyticsController.js
│   └── userController.js    # Admin user management
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── roleCheck.js         # RBAC middleware
│   └── rateLimiter.js       # Rate limiting configs
├── routes/
│   ├── authRoutes.js
│   ├── transactionRoutes.js
│   ├── analyticsRoutes.js
│   └── userRoutes.js
├── utils/
│   └── cache.js             # Redis caching utility
├── .env.example             # Environment variables template
├── .env                     # Your actual environment variables
├── .gitignore
├── package.json
├── server.js                # Main entry point
├── schema.sql               # Database schema
└── README.md
```

## 🧪 Testing the API

You can test the API using tools like:
- Postman
- Insomnia
- curl
- Thunder Client (VS Code extension)

### Example curl requests:

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Get Transactions:**
```bash
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Role Permissions

| Action | Admin | User | Read-Only |
|--------|-------|------|-----------|
| View own transactions | ✅ | ✅ | ✅ |
| Create transactions | ✅ | ✅ | ❌ |
| Update own transactions | ✅ | ✅ | ❌ |
| Delete own transactions | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Update user roles | ✅ | ❌ | ❌ |

## 🔄 Cache Strategy

### Cached Data:
- **User Analytics**: 15 minutes TTL
- **Categories**: 1 hour TTL
- **Transactions**: 10 minutes TTL

### Cache Invalidation:
Caches are automatically invalidated when:
- Transactions are created/updated/deleted
- Categories are created
- User data is modified

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Check connection
psql -U postgres -d finance_tracker
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Should return PONG
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Coding! 🚀**