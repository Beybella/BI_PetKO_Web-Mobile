import React from 'react';
import useApi from '../hooks/useApi';

export default function LowStock() {
  const { data, loading } = useApi('/api/inventory');

  if (loading) return <div className="loading">Loading stock data...</div>;

  const critical = data.filter(i => i.stock < i.reorder);
  const warning  = data.filter(i => i.stock === i.reorder);
  const ok       = data.filter(i => i.stock > i.reorder);

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card danger">
          <div className="stat-label">Critical</div>
          <div className="stat-value">{critical.length}</div>
          <div className="stat-sub">Below reorder level</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Warning</div>
          <div className="stat-value">{warning.length}</div>
          <div className="stat-sub">At reorder level</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Well Stocked</div>
          <div className="stat-value">{ok.length}</div>
          <div className="stat-sub">Above reorder level</div>
        </div>
      </div>

      <div className="card">
        <h3>🚨 Critical — Below Reorder Level</h3>
        {critical.length === 0
          ? <p className="alert-empty">No critical items.</p>
          : critical.map(i => <AlertItem key={i.id} item={i} type="critical" />)
        }
      </div>

      <div className="card">
        <h3>⚠️ Warning — At Reorder Level</h3>
        {warning.length === 0
          ? <p className="alert-empty">No items at reorder level.</p>
          : warning.map(i => <AlertItem key={i.id} item={i} type="warn" />)
        }
      </div>
    </>
  );
}

function AlertItem({ item, type }) {
  return (
    <div className={`alert-item ${type === 'warn' ? 'warn' : ''}`}>
      <div>
        <div className="alert-name">{item.name}</div>
        <div className="alert-meta">{item.category} · {item.brand} · Reorder at {item.reorder}</div>
      </div>
      <div className="alert-stock">
        <div className="alert-num">{item.stock} left</div>
        <div className="alert-meta">Need {item.reorder - item.stock > 0 ? item.reorder - item.stock : 0} more</div>
      </div>
    </div>
  );
}
