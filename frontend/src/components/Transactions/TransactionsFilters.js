import React, { useState, useCallback } from 'react';
import { debounce } from '../../utils/helpers';

const TransactionFilters = ({ filters, categories, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounced search handler - useMemo would also work here
  const debouncedSearch = useCallback(
    debounce((value) => {
      onFilterChange({ ...localFilters, search: value });
    }, 500),
    [localFilters, onFilterChange]
  );

  // Handle input change with useCallback
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Immediately apply search filter with debounce
    if (name === 'search') {
      debouncedSearch(value);
    }
  }, [debouncedSearch]);

  // Apply all filters
  const handleApply = useCallback(() => {
    onFilterChange(localFilters);
  }, [localFilters, onFilterChange]);

  // Reset all filters
  const handleReset = useCallback(() => {
    const resetFilters = {
      search: '',
      type: '',
      category_id: '',
      startDate: '',
      endDate: '',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3>🔍 Filters</h3>
        <button onClick={handleReset} className="btn btn-sm btn-outline">
          Clear All
        </button>
      </div>

      <div className="filters-grid">
        <div className="form-group">
          <label htmlFor="search">Search</label>
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Search description..."
            value={localFilters.search}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select 
            id="type"
            name="type" 
            value={localFilters.type} 
            onChange={handleChange}
          >
            <option value="">All Types</option>
            <option value="income">📈 Income</option>
            <option value="expense">📉 Expense</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Category</label>
          <select
            id="category_id"
            name="category_id"
            value={localFilters.category_id}
            onChange={handleChange}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">From Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={localFilters.startDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">To Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={localFilters.endDate}
            onChange={handleChange}
            min={localFilters.startDate}
          />
        </div>

        <div className="form-group filter-actions-inline">
          <button onClick={handleApply} className="btn btn-primary btn-block">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;