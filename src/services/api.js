// File: src/components/Transactions/TransactionList.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '../../context/AuthContext';
import TransactionForm from './TransactionForm';

const TransactionList = () => {
  const { canModify } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const fetchTransactions = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const response = await axios.get('/transactions', {
        params: { page: pageNum, limit: 20 }
      });
      
      // Handle backend response: { success: true, data: [...] }
      const transactionData = response.data.data || response.data || [];
      const txArray = Array.isArray(transactionData) ? transactionData : [];
      
      if (pageNum === 1) {
        setTransactions(txArray);
      } else {
        setTransactions(prev => [...prev, ...txArray]);
      }
      setHasMore(txArray.length === 20);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
      if (pageNum === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    const txns = Array.isArray(transactions) ? transactions : [];
    
    let filtered = txns;

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(t => 
        (t.description || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.category_name || '').toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category_name === filters.category);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return { income, expenses, balance: income - expenses };
  }, [filteredTransactions]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      dateFrom: '',
      dateTo: ''
    });
  }, []);

  const handleAddTransaction = useCallback(() => {
    if (!canModify()) {
      alert('Read-only users cannot add transactions');
      return;
    }
    setEditingTransaction(null);
    setShowModal(true);
  }, [canModify]);

  const handleEditTransaction = useCallback((transaction) => {
    if (!canModify()) {
      alert('Read-only users cannot edit transactions');
      return;
    }
    setEditingTransaction(transaction);
    setShowModal(true);
  }, [canModify]);

  const handleDeleteTransaction = useCallback(async (id) => {
    if (!canModify()) {
      alert('Read-only users cannot delete transactions');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await axios.delete(`/transactions/${id}`);
      setError(null);
      fetchTransactions(1);
      setPage(1);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  }, [canModify, fetchTransactions]);

  const handleSaveTransaction = useCallback(async (transactionData) => {
    try {
      console.log('Saving transaction:', transactionData);
      
      if (editingTransaction) {
        // FIX: Use 'id' not '_id'
        await axios.put(`/transactions/${editingTransaction.id}`, transactionData);
      } else {
        await axios.post('/transactions', transactionData);
      }
      
      setShowModal(false);
      setEditingTransaction(null);
      setError(null);
      setPage(1);
      await fetchTransactions(1);
    } catch (err) {
      console.error('Error saving transaction:', err);
      throw err; // Re-throw to let TransactionForm handle it
    }
  }, [editingTransaction, fetchTransactions]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  }, [page, fetchTransactions]);

  // Get unique categories from transactions
  const availableCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach(t => {
      if (t.category_name) {
        categories.add(t.category_name);
      }
    });
    return Array.from(categories).sort();
  }, [transactions]);

  if (loading && page === 1) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p className="page-subtitle">Manage your income and expenses</p>
        </div>
        {canModify() && (
          <button onClick={handleAddTransaction} className="btn btn-primary">
            ➕ Add Transaction
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="transaction-summary">
        <div className="summary-card income">
          <div className="summary-icon">💰</div>
          <div>
            <div className="summary-label">Total Income</div>
            <div className="summary-value">₹{stats.income.toLocaleString()}</div>
          </div>
        </div>
        <div className="summary-card expense">
          <div className="summary-icon">💸</div>
          <div>
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value">₹{stats.expenses.toLocaleString()}</div>
          </div>
        </div>
        <div className={`summary-card ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="summary-icon">💵</div>
          <div>
            <div className="summary-label">Net Balance</div>
            <div className="summary-value">₹{stats.balance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filters-header">
          <h3>🔍 Filters</h3>
          <button onClick={handleClearFilters} className="btn btn-outline btn-sm">
            Clear All
          </button>
        </div>
        <div className="filters-grid">
          <div className="form-group">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="form-group">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="form-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div className="form-group">
            <input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No transactions found</h3>
          <p>{transactions.length === 0 ? 'Add your first transaction to get started' : 'Try adjusting your filters'}</p>
          {canModify() && transactions.length === 0 && (
            <button onClick={handleAddTransaction} className="btn btn-primary">
              Add Your First Transaction
            </button>
          )}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={filteredTransactions.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="loading-more">
              <div className="spinner-small"></div>
              <span>Loading more...</span>
            </div>
          }
          endMessage={
            <p className="end-message">
              You've reached the end of your transactions
            </p>
          }
        >
          <div className="transactions-list">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-info">
                  <div className="transaction-category">
                    <div className="type-badge">
                      {transaction.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div className="transaction-details-text">
                      <h4>{transaction.category_name || 'Uncategorized'}</h4>
                      <p className="transaction-description">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="transaction-meta">
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
                    </div>
                    <div className="transaction-date">
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                {canModify() && (
                  <div className="transaction-actions">
                    <button
                      onClick={() => handleEditTransaction(transaction)}
                      className="btn-icon"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="btn-icon"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </InfiniteScroll>
      )}

      {showModal && (
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => {
            setShowModal(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default TransactionList;