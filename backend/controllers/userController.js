const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const cache = require('../utils/cache');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = 'SELECT id, email, name, role, created_at FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user', 'read-only'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be admin, user, or read-only' 
      });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, name, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    // Check if email already exists for another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email)
       WHERE id = $3 
       RETURNING id, email, name, role`,
      [name, email, userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Get current user
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Delete user (admin can delete any user, users can delete themselves)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Only admin or the user themselves can delete
    if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own account' 
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Invalidate cache
    await cache.invalidateUserCache(id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    // Check cache
    const cacheKey = cache.getCategoriesKey(userId);
    const cachedData = await cache.get(cacheKey);
    
    if (cachedData) {
      let data = cachedData;
      if (type) {
        data = data.filter(cat => cat.type === type);
      }
      return res.json({
        success: true,
        data,
        cached: true
      });
    }

    // Query database
    let query = 'SELECT * FROM categories WHERE user_id IS NULL OR user_id = $1';
    const params = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY name';

    const result = await pool.query(query, params);

    // Cache for 1 hour
    await cache.set(cacheKey, result.rows, 3600);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// Create custom category
const createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and type are required' 
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be income or expense' 
      });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, type, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, type, userId]
    );

    // Invalidate categories cache
    await cache.delete(cache.getCategoriesKey(userId));

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        success: false, 
        message: 'Category already exists' 
      });
    }
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateProfile,
  changePassword,
  deleteUser,
  getCategories,
  createCategory
};