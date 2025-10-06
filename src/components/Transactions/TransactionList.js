// File: src/components/Transactions/TransactionList.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '../../context/AuthContext';
import TransactionForm from './TransactionForm';

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'];

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

  const setSampleData = useCallback(() => {
    const sampleTransactions = [
      { _id: '1', type: 'income', amount: 50000, category: 'Salary', date: '2025-10-01', description: 'Monthly salary' },
      { _id: '2', type: 'expense', amount: 5000, category: 'Food', date: '2025-10-02', description: 'Groceries shopping' },
      { _id: '3', type: 'expense', amount: 2000, category: 'Transport', date: '2025-10-03', description: 'Uber rides' },
      { _id: '4', type: 'expense', amount: 3000, category: 'Entertainment', date: '2025-10-04', description: 'Movie tickets' },
      { _id: '5', type: 'income', amount: 10000, category: 'Freelance', date: '2025-10-05', description: 'Website project' },
      { _id: '6', type: 'expense', amount: 15000, category: 'Shopping', date: '2025-10-06', description: 'New clothes' },
      { _id: '7', type: 'expense', amount: 8000, category: 'Food', date: '2025-09-28', description: 'Restaurant dinner' },
      { _id: '8', type: 'expense', amount: 12000, category: 'Bills', date: '2025-09-25', description: 'Electricity bill' },
    ];
    setTransactions(sampleTransactions);
    setHasMore(false);
  }, []);

  const fetchTransactions = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const response = await axios.get('/transactions', {
        params: { page: pageNum, limit: 20 }
      });
      
      // Ensure transactions is always an array
      const txns = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      if (pageNum === 1) {
        setTransactions(txns);
      } else {
        setTransactions(prev => [...prev, ...txns]);
      }
      
      setHasMore(response.data.length === 20);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
      if (pageNum === 1) {
        setSampleData();
      }
    } finally {
      setLoading(false);
    }

  }, [setSampleData]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      const matchesSearch = (transaction.description && transaction.description.toLowerCase().includes(filters.search.toLowerCase())) ||
        (transaction.category && transaction.category.toLowerCase().includes(filters.search.toLowerCase()));
      const matchesType = filters.type === 'all' || transaction.type === filters.type;
      const matchesCategory = filters.category === 'all' || transaction.category === filters.category;
      
      let matchesDate = true;
      if (filters.dateFrom && filters.dateTo) {
        const transDate = new Date(transaction.date);
        matchesDate = transDate >= new Date(filters.dateFrom) && transDate <= new Date(filters.dateTo);
      }
      
      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
    
    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  const stats = useMemo(() => {
    const safeAmount = t => {
      const amt = typeof t.amount === 'number' ? t.amount : parseFloat(t.amount);
      return isNaN(amt) ? 0 : amt;
    };
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + safeAmount(t), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + safeAmount(t), 0);

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
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Failed to delete transaction');
    }
  }, [canModify]);

  const handleSaveTransaction = useCallback(async (transactionData) => {
    try {
      if (editingTransaction) {
        await axios.put(`/transactions/${editingTransaction._id}`, transactionData);
      } else {
        await axios.post('/transactions', transactionData);
      }
      setShowModal(false);
      setEditingTransaction(null);
      // Refetch transactions from backend to ensure latest data and correct stats
      fetchTransactions(1);
    } catch (err) {
      console.error('Error saving transaction:', err);
      throw err;
    }
  }, [editingTransaction, fetchTransactions]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage);
  }, [page, fetchTransactions]);

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
          <span>{error} - Showing sample data</span>
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
              {CATEGORIES.map(cat => (
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
          <p>Try adjusting your filters or add a new transaction</p>
          {canModify() && (
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
              <div key={transaction._id} className="transaction-card">
                <div className="transaction-info">
                  <div className="transaction-category">
                    <div className="type-badge">
                      {transaction.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div className="transaction-details-text">
                      <h4>{transaction.category}</h4>
                      <p className="transaction-description">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="transaction-meta">
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
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
                      onClick={() => handleDeleteTransaction(transaction._id)}
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