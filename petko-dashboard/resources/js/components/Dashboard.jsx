import React, { useState } from 'react';
import Analytics from './Analytics';
import LowStock from './LowStock';
import Inventory from './Inventory';

export default function Dashboard() {
  const [tab, setTab] = useState('analytics');

  return (
    <div className="layout">
      <header className="header">
        <h1>🐾 PetKO Dashboard</h1>
        <span>Business Intelligence</span>
      </header>

      <nav className="nav">
        {[
          { key: 'analytics', label: '📊 Analytics' },
          { key: 'lowstock',  label: '⚠️ Low Stock' },
          { key: 'inventory', label: '📦 Inventory' },
        ].map(t => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="container">
        {tab === 'analytics' && <Analytics />}
        {tab === 'lowstock'  && <LowStock />}
        {tab === 'inventory' && <Inventory />}
      </div>
    </div>
  );
}
