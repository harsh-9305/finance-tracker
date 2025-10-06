import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          💰 Finance Tracker
        </Link>

        <div className="navbar-menu">
          <Link 
            to="/dashboard" 
            className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link 
            to="/transactions" 
            className={`navbar-link ${isActive('/transactions') ? 'active' : ''}`}
          >
            💳 Transactions
          </Link>
          {isAdmin() && (
            <Link 
              to="/admin/users" 
              className={`navbar-link ${isActive('/admin/users') ? 'active' : ''}`}
            >
              👥 Users
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          <button 
            onClick={toggleTheme} 
            className="btn-icon"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
          </div>
          
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;