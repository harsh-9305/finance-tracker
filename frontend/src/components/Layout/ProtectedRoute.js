import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="alert alert-error">
            <span style={{ fontSize: '2rem' }}>🚫</span>
            <div>
              <h3>Access Denied</h3>
              <p>You don't have permission to access this page.</p>
            </div>
          </div>
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-primary btn-block"
            style={{ marginTop: '1rem' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;