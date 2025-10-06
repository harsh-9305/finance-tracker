// File: src/components/Admin/UserManagement.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const setSampleData = useCallback(() => {
    const sampleUsers = [
      {
        _id: '1',
        name: 'Admin User',
        email: 'admin@demo.com',
        role: 'admin',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        _id: '2',
        name: 'John Doe',
        email: 'user@demo.com',
        role: 'user',
        createdAt: '2024-02-20T14:30:00Z'
      },
      {
        _id: '3',
        name: 'Jane Smith',
        email: 'readonly@demo.com',
        role: 'read-only',
        createdAt: '2024-03-10T09:15:00Z'
      },
      {
        _id: '4',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'user',
        createdAt: '2024-04-05T16:45:00Z'
      },
      {
        _id: '5',
        name: 'Alice Williams',
        email: 'alice@example.com',
        role: 'read-only',
        createdAt: '2024-05-12T11:20:00Z'
      }
    ];
    setUsers(sampleUsers);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setSampleData();
    } finally {
      setLoading(false);
    }
  }, [setSampleData]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      user: users.filter(u => u.role === 'user').length,
      readOnly: users.filter(u => u.role === 'read-only').length
    };
  }, [users]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
    if (userId === currentUser.id) {
      alert('You cannot change your own role');
      return;
    }

    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      alert('Failed to update user role');
    }
  }, [currentUser]);

  const handleDeleteUser = useCallback(async (userId) => {
    if (userId === currentUser.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage user accounts and permissions</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error} - Showing sample data</span>
        </div>
      )}

      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div>
            <div className="stat-label">Admins</div>
            <div className="stat-value">{stats.admin}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div>
            <div className="stat-label">Users</div>
            <div className="stat-value">{stats.user}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div>
            <div className="stat-label">Read-Only</div>
            <div className="stat-value">{stats.readOnly}</div>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="user-filters">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="read-only">Read-Only</option>
          </select>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>User Details</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="empty-state">
                    <div className="empty-icon">👤</div>
                    <h3>No users found</h3>
                    <p>Try adjusting your search filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <span className="user-id">#{user._id.slice(-6)}</span>
                  </td>
                  <td className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </td>
                  <td className="user-role">
                    {user._id === currentUser.id ? (
                      <span className={`badge badge-${user.role}`}>
                        {user.role} (You)
                      </span>
                    ) : (
                      <select
                        className="role-select"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="read-only">Read-Only</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <div className="user-date">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      {user._id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="btn btn-danger btn-sm"
                          title="Delete User"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;