import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  }, [email, password, login, navigate, setError]);

  const handleDemoLogin = useCallback(async (role) => {
    setIsLoading(true);
    setError(null);

    const demoCredentials = {
      admin: { email: 'admin@example.com', password: 'password123' },
      user: { email: 'user@example.com', password: 'password123' },
      'read-only': { email: 'readonly@example.com', password: 'password123' }
    };

    const { email: demoEmail, password: demoPassword } = demoCredentials[role];
    const result = await login(demoEmail, demoPassword);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  }, [login, navigate, setError]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back! 👋</h1>
          <p className="subtitle">Sign in to continue to Finance Tracker</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <p className="demo-title">🎯 Try Demo Accounts</p>
          <div className="demo-buttons">
            <button 
              onClick={() => handleDemoLogin('admin')} 
              className="btn btn-demo btn-sm"
              disabled={isLoading}
            >
              👑 Admin
            </button>
            <button 
              onClick={() => handleDemoLogin('user')} 
              className="btn btn-demo btn-sm"
              disabled={isLoading}
            >
              👤 User
            </button>
            <button 
              onClick={() => handleDemoLogin('read-only')} 
              className="btn btn-demo btn-sm"
              disabled={isLoading}
            >
              👁️ Read-Only
            </button>
          </div>
          <p className="demo-note">
            Click any button to instantly log in with a demo account
          </p>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;