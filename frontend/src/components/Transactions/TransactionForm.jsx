// File: src/components/Transactions/TransactionForm.js

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const TransactionForm = ({ transaction, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category_id: transaction?.category_id || '',
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    description: transaction?.description || ''
  });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/users/categories');
        const categoryData = response.data.data || response.data || [];
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        
        // Set default category if none selected
        if (!formData.category_id && categoryData.length > 0) {
          const defaultCategory = categoryData.find(c => c.type === formData.type);
          if (defaultCategory) {
            setFormData(prev => ({ ...prev, category_id: defaultCategory.id }));
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  // Filter categories based on transaction type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // When type changes, reset category to first matching one
      if (name === 'type') {
        const newTypeCategories = categories.filter(c => c.type === value);
        if (newTypeCategories.length > 0) {
          updated.category_id = newTypeCategories[0].id;
        }
      }
      
      return updated;
    });
    setError('');
  }, [categories]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      setIsLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      setIsLoading(false);
      return;
    }

    if (!formData.category_id) {
      setError('Please select a category');
      setIsLoading(false);
      return;
    }

    try {
      await onSave({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: parseInt(formData.category_id),
        date: formData.date,
        description: formData.description.trim()
      });
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save transaction. Please try again.');
      setIsLoading(false);
    }
  }, [formData, onSave]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="transaction-form">
          <h2>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
          <p className="form-subtitle">
            {transaction ? 'Update transaction details' : 'Enter transaction details'}
          </p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="type">
              Transaction Type <span className="required">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
              required
            >
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">
                Amount (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category_id">
              Category <span className="required">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={isLoading || filteredCategories.length === 0}
              required
            >
              {filteredCategories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                <>
                  <option value="">Select a category</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter transaction details..."
              rows="3"
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  Saving...
                </>
              ) : (
                transaction ? 'Update Transaction' : 'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;