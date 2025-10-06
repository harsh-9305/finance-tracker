const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateProfile,
  changePassword,
  deleteUser,
  getCategories,
  createCategory
} = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
const { requireRole, preventReadOnly } = require('../middleware/roleCheck');
const { generalLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(generalLimiter);

// Profile management - accessible to all authenticated users
router.put('/profile', preventReadOnly, updateProfile);
router.put('/change-password', preventReadOnly, changePassword);

// Categories - accessible to all authenticated users
router.get('/categories', getCategories);
router.post('/categories', preventReadOnly, createCategory);

// Admin-only routes - user management
router.get('/', requireRole('admin'), getAllUsers);
router.get('/:id', requireRole('admin'), getUserById);
router.put('/:id/role', requireRole('admin'), updateUserRole);
router.delete('/:id', deleteUser); // Can be accessed by admin or user themselves

module.exports = router;