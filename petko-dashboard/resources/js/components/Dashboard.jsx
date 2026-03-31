import React, { useState, useEffect, useRef } from 'react';
import Analytics from './Analytics';
import LowStock from './LowStock';
import Inventory from './Inventory';
import POS from './POS';
import Settings from './Settings';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'pos',       label: 'POS',        icon: '🧾' },
  { key: 'inventory', label: 'Inventory',  icon: '📦' },
  { key: 'lowstock',  label: 'Low Stock',  icon: '⚠️' },
];

export default function Dashboard() {
  const [tab, setTab]         = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const sideRef = useRef();

  // Apply dark mode class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const h = e => { if (sideRef.current && !sideRef.current.contains(e.target)) setSideOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sideOpen ? 'open' : ''}`} ref={sideRef}>
        <div className="sidebar-logo">
          <span className="logo-icon">🐾</span>
          <span className="logo-text">Pet Ko</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`sidebar-item ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); setSideOpen(false); }}
            >
              <span className="sidebar-icon">{t.icon}</span>
              <span className="sidebar-label">{t.label}</span>
            </button>
          ))}
        </nav>
        <button
          className={`sidebar-item ${tab === 'settings' ? 'active' : ''}`}
          style={{ borderTop: '1px solid var(--border)', marginTop: 'auto' }}
          onClick={() => { setTab('settings'); setSideOpen(false); }}
        >
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">Settings</span>
        </button>
      </aside>

      {sideOpen && <div className="sidebar-overlay" onClick={() => setSideOpen(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="hamburger-btn" onClick={() => setSideOpen(o => !o)} aria-label="Menu">
            <span className="ham-line" />
            <span className="ham-line" />
            <span className="ham-line" />
          </button>
          <div className="topbar-title">
            <h1>Sales Dashboard</h1>
            <p className="topbar-sub">PetKO Business Intelligence</p>
          </div>
        </header>

        <div className="page-content">
          {tab === 'dashboard' && <Analytics />}
          {tab === 'pos'       && <POS />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'lowstock'  && <LowStock />}
          {tab === 'settings'  && <Settings darkMode={darkMode} setDarkMode={setDarkMode} />}
        </div>
      </div>
    </div>
  );
}
