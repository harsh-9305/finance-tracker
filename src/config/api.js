/**
 * API Base URL Configuration
 * Using port 5001 to match backend configuration
 */
export const API_BASE_URL = 'https://finance-tracker-2-jkrn.onrender.com/api';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GET_ME: '/auth/me',
  
  // Transactions
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  CATEGORIES: '/transactions/categories',
  
  // Analytics
  ANALYTICS_OVERVIEW: '/analytics/overview',
  ANALYTICS_CATEGORY: '/analytics/category-breakdown',
  ANALYTICS_TRENDS: '/analytics/trends',
  
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: (id) => `/admin/users/${id}`,
  ADMIN_USER_ROLE: (id) => `/admin/users/${id}/role`,
};

/**
 * Build complete URL
 */
export const buildUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default API_BASE_URL;