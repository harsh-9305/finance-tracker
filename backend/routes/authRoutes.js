const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);

module.exports = router;