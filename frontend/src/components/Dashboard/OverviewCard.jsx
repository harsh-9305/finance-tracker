import React from 'react';
import { formatCurrency } from '../../utils/helpers';

const OverviewCard = ({ title, value, icon, color = 'blue', isCount = false, trend }) => {
  return (
    <div className={`overview-card card-${color}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-value">
          {isCount ? value : formatCurrency(value)}
        </p>
        {trend && (
          <p className={`card-trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>
            {trend} from last period
          </p>
        )}
      </div>
    </div>
  );
};

export default OverviewCard;