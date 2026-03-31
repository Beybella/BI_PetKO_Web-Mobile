import React, { useState, useEffect, useRef } from 'react';
import Analytics from './Analytics';
import LowStock from './LowStock';
import Inventory from './Inventory';
import POS from './POS';

const TABS = [
  { key: 'analytics', label: '📊 Analytics' },
  { key: 'pos',       label: '🧾 POS' },
  { key: 'lowstock',  label: '⚠️ Low Stock' },
  { key: 'inventory', label: '📦 Inventory' },
];

export default function Dashboard() {
  const [tab, setTab]       = useState('analytics');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectTab = (key) => {
    setTab(key);
    setMenuOpen(false);
  };

  const activeLabel = TABS.find(t => t.key === tab)?.label;

  return (
    <div className="layout">
      <header className="header">
        <h1>🐾 PetKO Dashboard</h1>

        <div className="hamburger-wrap" ref={menuRef}>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
            <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
          </button>

          {menuOpen && (
            <div className="dropdown-menu">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`dropdown-item ${tab === t.key ? 'active' : ''}`}
                  onClick={() => selectTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Current tab label shown below header */}
      <div className="tab-breadcrumb">{activeLabel}</div>

      <div className="container">
        {tab === 'analytics' && <Analytics />}
        {tab === 'pos'       && <POS />}
        {tab === 'lowstock'  && <LowStock />}
        {tab === 'inventory' && <Inventory />}
      </div>
    </div>
  );
}
