import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Configure axios
axios.defaults.baseURL = API_BASE_URL;

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/transactions', {
        params: { period }
      });
      
      // FIX: Handle the response structure correctly
      // Backend returns: { success: true, data: [...] }
      const transactionData = response.data.data || response.data || [];
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);



  // Calculate statistics using useMemo
  const stats = useMemo(() => {
    // FIX: Add safety check for transactions array
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return { income: 0, expenses: 0, balance: 0, transactionCount: 0 };
    }

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const balance = income - expenses;
    const transactionCount = transactions.length;

    return { income, expenses, balance, transactionCount };
  }, [transactions]);

  // Category-wise expense breakdown
  const categoryData = useMemo(() => {
    // FIX: Add safety check
    if (!Array.isArray(transactions)) return [];

    const categoryMap = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = t.category_name || 'Uncategorized';
        categoryMap[category] = (categoryMap[category] || 0) + Number(t.amount || 0);
      });
    
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));
  }, [transactions]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    // FIX: Add safety check
    if (!Array.isArray(transactions)) return [];

    const monthMap = {};
    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('default', { month: 'short' });
      if (!monthMap[month]) {
        monthMap[month] = { month, income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        monthMap[month].income += Number(t.amount || 0);
      } else {
        monthMap[month].expenses += Number(t.amount || 0);
      }
    });
    
    return Object.values(monthMap);
  }, [transactions]);

  // Income vs Expense comparison
  const comparisonData = useMemo(() => [
    { name: 'Income', amount: stats.income },
    { name: 'Expenses', amount: stats.expenses }
  ], [stats]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name || 'User'}! Here's your financial overview
          </p>
        </div>
        <div className="period-selector">
          <button
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setPeriod('month')}
          >
            This Month
          </button>
          <button
            className={`btn ${period === 'year' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setPeriod('year')}
          >
            This Year
          </button>
          <button
            className={`btn ${period === 'all' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setPeriod('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error} - Showing sample data</span>
        </div>
      )}

      <div className="overview-grid">
        <div className="overview-card card-green">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-title">Total Income</div>
            <div className="card-value">₹{stats.income.toLocaleString()}</div>
          </div>
        </div>

        <div className="overview-card card-red">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <div className="card-title">Total Expenses</div>
            <div className="card-value">₹{stats.expenses.toLocaleString()}</div>
          </div>
        </div>

        <div className={`overview-card ${stats.balance >= 0 ? 'card-green' : 'card-red'}`}>
          <div className="card-icon">💵</div>
          <div className="card-content">
            <div className="card-title">Net Balance</div>
            <div className="card-value">₹{stats.balance.toLocaleString()}</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <div className="card-title">Transactions</div>
            <div className="card-value">{stats.transactionCount}</div>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="no-data">
          <p>📭</p>
          <h3>No transactions yet</h3>
          <p>Start adding transactions to see your analytics</p>
        </div>
      ) : (
        <div className="charts-grid">
          {/* Category-wise Expense Pie Chart */}
          {categoryData.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Income vs Expenses Bar Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#3b82f6">
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="charts-grid-single">
          {/* Monthly Trend Line Chart */}
          <div className="chart-card">
            <h3 className="chart-title">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;