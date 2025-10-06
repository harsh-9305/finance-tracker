import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { analyticsAPI } from '../../services/api';
import OverviewCard from './OverviewCard';

// Lazy load chart components for code splitting
const PieChartCard = lazy(() => import('./PieChartCard'));
const LineChartCard = lazy(() => import('./LineChartCard'));
const BarChartCard = lazy(() => import('./BarChartCard'));

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load dashboard data with useCallback to prevent unnecessary re-renders
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all data in parallel for better performance
      const [overviewRes, categoryRes, trendsRes] = await Promise.all([
        analyticsAPI.getOverview({ period }),
        analyticsAPI.getCategoryBreakdown({ period, type: 'expense' }),
        analyticsAPI.getTrends({ months: 6 }),
      ]);

      setOverview(overviewRes.data);
      setCategoryBreakdown(categoryRes.data.breakdown);
      setTrends(trendsRes.data.trends);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Memoize chart data to optimize performance - useMemo hook
  const pieChartData = useMemo(() => {
    if (!categoryBreakdown.length) return [];
    return categoryBreakdown.map(item => ({
      name: item.category || 'Uncategorized',
      value: parseFloat(item.total),
      count: parseInt(item.count),
    }));
  }, [categoryBreakdown]);

  // Memoize trend data for line and bar charts - useMemo hook
  const trendData = useMemo(() => {
    const groupedByMonth = {};
    
    trends.forEach(item => {
      if (!groupedByMonth[item.month]) {
        groupedByMonth[item.month] = { 
          month: item.month, 
          income: 0, 
          expense: 0 
        };
      }
      
      if (item.type === 'income') {
        groupedByMonth[item.month].income = parseFloat(item.total);
      } else {
        groupedByMonth[item.month].expense = parseFloat(item.total);
      }
    });
    
    return Object.values(groupedByMonth).sort((a, b) => 
      a.month.localeCompare(b.month)
    );
  }, [trends]);

  // Handle period change with useCallback
  const handlePeriodChange = useCallback((newPeriod) => {
    setPeriod(newPeriod);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={loadDashboardData} className="btn btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back! Here's your financial overview
          </p>
        </div>
        <div className="period-selector">
          <button
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handlePeriodChange('month')}
          >
            This Month
          </button>
          <button
            className={`btn ${period === 'year' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handlePeriodChange('year')}
          >
            This Year
          </button>
          <button
            className={`btn ${period === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handlePeriodChange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {overview && (
        <div className="overview-grid">
          <OverviewCard
            title="Total Income"
            value={overview.income}
            icon="📈"
            color="green"
            trend="+12.5%"
          />
          <OverviewCard
            title="Total Expenses"
            value={overview.expenses}
            icon="📉"
            color="red"
            trend="-5.2%"
          />
          <OverviewCard
            title="Balance"
            value={overview.balance}
            icon="💰"
            color={overview.balance >= 0 ? 'green' : 'red'}
          />
          <OverviewCard
            title="Transactions"
            value={overview.transactionCount}
            icon="📊"
            isCount
          />
        </div>
      )}

      <Suspense fallback={
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Loading charts...</p>
        </div>
      }>
        <div className="charts-grid">
          <BarChartCard data={trendData} title="Income vs Expenses" />
          <PieChartCard data={pieChartData} title="Expense by Category" />
        </div>
        
        <div className="charts-grid-single">
          <LineChartCard data={trendData} title="Financial Trend (Last 6 Months)" />
        </div>
      </Suspense>
    </div>
  );
};

export default Dashboard;
