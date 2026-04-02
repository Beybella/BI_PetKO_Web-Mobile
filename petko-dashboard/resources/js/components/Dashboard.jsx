import React, { useState, useEffect, useRef } from 'react';
import Analytics from './Analytics';
import LowStock from './LowStock';
import Inventory from './Inventory';
import POS from './POS';
import DailySummary from './DailySummary';

const TABS = [
  { key: 'dashboard', label: 'Analytics',  icon: '📊' },
  { key: 'pos',       label: 'POS',         icon: '🧾' },
  { key: 'inventory', label: 'Inventory',   icon: '📦' },
  { key: 'lowstock',  label: 'Low Stock',   icon: '⚠️' },
  { key: 'daily',     label: 'Daily',       icon: '📅' },
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Dashboard() {
  const [tab, setTab]               = useState('dashboard');
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('darkMode') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const h = e => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const now     = useClock();
  const dateStr = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const navigate = (key) => { setTab(key); setMobileOpen(false); };

  const NavItems = ({ onClose }) => (
    <>
      {TABS.map(t => (
        <button
          key={t.key}
          className={`sidebar-item ${tab === t.key ? 'active' : ''}`}
          onClick={() => { navigate(t.key); onClose?.(); }}
        >
          <span className="sidebar-icon">{t.icon}</span>
          <span className="sidebar-label">{t.label}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="app-shell">

      {/* ── Permanent sidebar (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '2.2rem' }}>🐾</span>
          <span className="sidebar-logo-text">Pet<span style={{ color: 'var(--yellow)' }}>KO</span></span>
        </div>
        <nav className="sidebar-nav">
          <NavItems />
        </nav>
        <div className="sidebar-footer">PetKO Business Intelligence</div>
      </aside>

      {/* ── Mobile overlay + drawer ── */}
      {mobileOpen && <div className="drawer-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar sidebar-mobile ${mobileOpen ? 'open' : ''}`} ref={drawerRef}>
        <div className="sidebar-logo">
          <span style={{ fontSize: '2.2rem' }}>🐾</span>
          <span className="sidebar-logo-text">Pet<span style={{ color: 'var(--yellow)' }}>KO</span></span>
          <button className="drawer-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <NavItems onClose={() => setMobileOpen(false)} />
        </nav>
        <div className="sidebar-footer">PetKO Business Intelligence</div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
              <span className="ham-line" />
              <span className="ham-line" />
              <span className="ham-line" />
            </button>
            <div>
              <h1 className="topbar-title">Pet<span className="topbar-title-accent">KO</span> Dashboard</h1>
              <p className="topbar-sub">Everything Your Pets Need, All in One Place.</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">🕐 {dateStr} · {timeStr}</span>
            {/* Dark mode toggle */}
            <button
              className={`darkmode-toggle ${darkMode ? 'on' : ''}`}
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        <div className="page-content">
          {tab === 'dashboard' && <Analytics />}
          {tab === 'pos'       && <POS />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'lowstock'  && <LowStock />}
          {tab === 'daily'     && <DailySummary />}
        </div>
      </div>

    </div>
  );
}
