// File: src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Set up axios interceptor for adding token to requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for handling 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Token expired');
            logout();
          } else {
            setUser(decoded);
          }
        } catch (err) {
          console.error('Invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await axios.post('/auth/login', { email, password });
      
      const { token, user: userData } = response.data.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      
      // Merge decoded token data with user data from response
      const userInfo = {
        ...decoded,
        name: userData?.name || decoded.name,
        email: userData?.email || decoded.email,
      };
      
      setUser(userInfo);
      
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message ||
                          'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (name, email, password, role = 'user') => {
    try {
      setError(null);
      const response = await axios.post('/auth/register', { 
        name, 
        email, 
        password,
        role 
      });
      
      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format from server');
      }

      const { token, user: userData } = response.data.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      const decoded = jwtDecode(token);
      
      // Merge decoded token data with user data from response
      const userInfo = {
        ...decoded,
        name: name || decoded.name, // Use the name from registration
        email: email || decoded.email, // Use the email from registration
      };
      
      setUser(userInfo);
      
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message ||
                          err.message ||
                          'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const hasRole = useCallback((allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  }, [user]);

  const canModify = useCallback(() => {
    return user && user.role !== 'read-only';
  }, [user]);

  const isAdmin = useCallback(() => {
    return user && user.role === 'admin';
  }, [user]);

  const isReadOnly = useCallback(() => {
    return user && user.role === 'read-only';
  }, [user]);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    hasRole,
    canModify,
    isAdmin,
    isReadOnly,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};