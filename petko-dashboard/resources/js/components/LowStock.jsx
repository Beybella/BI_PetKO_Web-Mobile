
import React, { useState } from 'react';
import useApi from '../hooks/useApi';
import {
  IconAlert,
  IconWarning,
  IconCheck,
  IconBox
} from './IconsAll';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const SORT_OPTIONS = [
  { value: 'critical', label: 'Most Critical' },
  { value: 'cost',     label: 'Restock Cost'  },
  { value: 'name',     label: 'Name A–Z'      },
  { value: 'cat',      label: 'Category'      },
];

export default function LowStock() {
  const { data, loading, error } = useApi('/api/inventory');
  const [sortBy, setSortBy]     = useState('critical');
  const [filterCat, setFilterCat] = useState('');

  if (loading) return <div className="loading">Loading stock data...</div>;
  if (error || !data) return <div className="loading">Could not load inventory.</div>;

  const critical = data.filter(i => i.stock < i.reorder);
  const warning  = data.filter(i => i.stock === i.reorder);
  const ok       = data.filter(i => i.stock > i.reorder);

  const totalRestockCost = critical.reduce((s, i) => {
    const needed = Math.max(0, i.reorder * 2 - i.stock);
    return s + needed * (i.unit_cost || 0);
  }, 0);

  const categories = [...new Set(data.map(i => i.category))].sort();

  // Category breakdown
  const catMap = {};
  critical.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const sortAndFilter = (items) => {
    let result = filterCat ? items.filter(i => i.category === filterCat) : [...items];
    if (sortBy === 'critical') result.sort((a, b) => {
      const ra = a.reorder > 0 ? a.stock / a.reorder : 1;
      const rb = b.reorder > 0 ? b.stock / b.reorder : 1;
      return ra - rb;
    });
    if (sortBy === 'cost') result.sort((a, b) => {
      const ca = Math.max(0, a.reorder * 2 - a.stock) * (a.unit_cost || 0);
      const cb = Math.max(0, b.reorder * 2 - b.stock) * (b.unit_cost || 0);
      return cb - ca;
    });
    if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'cat')  result.sort((a, b) => a.category.localeCompare(b.category));
    return result;
  };

  const criticalList = sortAndFilter(critical);
  const warningList  = sortAndFilter(warning);

  return (
    <>
      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card red">
          <div className="kpi-icon"><IconAlert size={24} /></div>
          <div className="stat-label">Critical</div>
          <div className="stat-value">{critical.length}</div>
          <div className="stat-sub">Below reorder level</div>
        </div>
        <div className="stat-card yellow">
          <div className="kpi-icon"><IconWarning size={24} /></div>
          <div className="stat-label">Warning</div>
          <div className="stat-value">{warning.length}</div>
          <div className="stat-sub">At reorder level</div>
        </div>
        <div className="stat-card green">
          <div className="kpi-icon"><IconCheck size={24} /></div>
          <div className="stat-label">Well Stocked</div>
          <div className="stat-value">{ok.length}</div>
          <div className="stat-sub">Above reorder level</div>
        </div>
        <div className="stat-card blue">
          <div className="kpi-icon"><IconBox size={24} /></div>
          <div className="stat-label">Est. Restock Cost</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{fmt(totalRestockCost)}</div>
          <div className="stat-sub">Critical items to 2× reorder</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {catBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="chart-card-header">
            <div className="chart-card-title"><IconBox size={18} style={{marginRight:6}} /> Critical by Category</div>
          </div>
          <div className="ls-cat-grid">
            {catBreakdown.map(([cat, count]) => (
              <div key={cat} className="ls-cat-row">
                <span className="ls-cat-name">{cat}</span>
                <div className="ls-cat-bar-wrap">
                  <div className="ls-cat-bar" style={{ width: `${Math.round(count / critical.length * 100)}%` }} />
                </div>
                <span className="ls-cat-count">{count} item{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sort & Filter */}
      <div className="ls-controls">
        <div className="ls-filter-group">
          <span className="ls-control-label">Sort by</span>
          <div className="ls-sort-btns">
            {SORT_OPTIONS.map(o => (
              <button key={o.value} className={`ls-sort-btn ${sortBy === o.value ? 'active' : ''}`}
                onClick={() => setSortBy(o.value)}>{o.label}</button>
            ))}
          </div>
        </div>
        <div className="ls-filter-group">
          <span className="ls-control-label">Filter</span>
          <select className="ls-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Critical */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="chart-card-header">
          <div className="chart-card-title"><IconAlert size={18} style={{marginRight:6}} /> Critical — Below Reorder Level</div>
          <span className="ls-count-badge ls-badge-red">{criticalList.length}</span>
        </div>
        {criticalList.length === 0
          ? <p className="alert-empty">No critical items</p>
          : criticalList.map(i => <AlertItem key={i.id} item={i} type="critical" />)
        }
      </div>

      {/* Warning */}
      <div className="card">
        <div className="chart-card-header">
          <div className="chart-card-title"><IconWarning size={18} style={{marginRight:6}} /> Warning — At Reorder Level</div>
          <span className="ls-count-badge ls-badge-yellow">{warningList.length}</span>
        </div>
        {warningList.length === 0
          ? <p className="alert-empty">No items at reorder level.</p>
          : warningList.map(i => <AlertItem key={i.id} item={i} type="warn" />)
        }
      </div>
    </>
  );
}

function AlertItem({ item, type }) {
  const needed      = Math.max(0, item.reorder * 2 - item.stock);
  const restockCost = needed * (item.unit_cost || 0);
  const pct         = item.reorder > 0 ? Math.min(100, Math.round(item.stock / item.reorder * 100)) : 100;

  return (
    <div className={`alert-item ${type === 'warn' ? 'warn' : ''}`}>
      <div className="alert-item-left">
        <div className="alert-name">{item.name}</div>
        <div className="alert-meta">{item.category} · {item.brand}</div>
        <div className="ls-progress-wrap">
          <div className="ls-progress-bar" style={{
            width: `${pct}%`,
            background: type === 'warn' ? '#F6E04B' : '#F24C4C'
          }} />
        </div>
        <div className="alert-meta">{item.stock} / {item.reorder} units ({pct}% of reorder)</div>
      </div>
      <div className="alert-item-right">
        <div className="alert-num">{item.stock} left</div>
        <div className="ls-needed">Need <strong>{needed}</strong> units</div>
        <div className="ls-cost">{fmt(restockCost)} to restock</div>
      </div>
    </div>
  );
}
