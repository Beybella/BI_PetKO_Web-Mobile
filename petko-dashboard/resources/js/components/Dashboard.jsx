import React, { useState, useEffect, useRef } from 'react';
import { IconAnalytics, IconCart, IconBox, IconAlert, IconCalendar, IconUser, IconClose, IconSun, IconMoon, IconCash, TrendUp } from './IconsAll';
import { useAuth } from '../context/AuthContext';
import Analytics from './Analytics';
import LowStock from './LowStock';
import Inventory from './Inventory';
import POS from './POS';
import DailySummary from './DailySummary';
import UserManagement from './UserManagement';

const ALL_TABS = [
  { key: 'dashboard',   label: 'Analytics',   icon: <TrendUp style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin'] },
  { key: 'pos',         label: 'POS',          icon: <IconCart style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin','staff'] },
  { key: 'inventory',   label: 'Inventory',    icon: <IconBox style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin','staff'] },
  { key: 'lowstock',    label: 'Low Stock',    icon: <IconAlert style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin','staff'] },
  { key: 'daily',       label: 'Daily',        icon: <IconCalendar style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin'] },
  { key: 'users',       label: 'Users',        icon: <IconUser style={{verticalAlign:'middle',marginRight:4}} />, roles: ['admin'] },
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
  const { user, logout, token }     = useAuth();
  const [darkMode, setDarkMode]     = useState(() => localStorage.getItem('darkMode') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef();

  const TABS = ALL_TABS.filter(t => t.roles.includes(user?.role));
  const [tab, setTab] = useState(TABS[0]?.key || 'pos');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const h = e => { if (drawerRef.current && !drawerRef.current.contains(e.target)) setMobileOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const now     = useClock();
  const dateStr = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const navigate = (key) => { setTab(key); setMobileOpen(false); };

  // Low stock browser notification
  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch('/api/inventory')
      .then(r => r.json())
      .then(inv => {
        const critical = inv.filter(i => i.stock < i.reorder);
        if (critical.length === 0) return;
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('PetKO — Low Stock Alert 🚨', {
            body: `${critical.length} item${critical.length > 1 ? 's' : ''} below reorder level.`,
            icon: '/favicon.ico',
          });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification('PetKO — Low Stock Alert 🚨', {
              body: `${critical.length} item${critical.length > 1 ? 's' : ''} below reorder level.`,
            });
          });
        }
      }).catch(() => {});
  }, [user]);

  const NavItems = ({ onClose }) => (
    <>
      {TABS.map(t => (
        <button key={t.key} className={`sidebar-item ${tab === t.key ? 'active' : ''}`}
          onClick={() => { navigate(t.key); onClose?.(); }}>
          <span className="sidebar-icon">{t.icon}</span>
          <span className="sidebar-label">{t.label}</span>
        </button>
      ))}
    </>
  );

  return (
    <div className="app-shell">

      {/* Permanent sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '2.2rem' }}><IconCart size={28} /></span>
          <span className="sidebar-logo-text">Pet<span style={{ color: 'var(--yellow)' }}>KO</span></span>
        </div>
        <nav className="sidebar-nav"><NavItems /></nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className={`sidebar-user-role ${user?.role}`}>{user?.role}</div>
          <button className="sidebar-logout" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && <div className="drawer-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar sidebar-mobile ${mobileOpen ? 'open' : ''}`} ref={drawerRef}>
        <div className="sidebar-logo">
          <span style={{ fontSize: '2.2rem' }}><IconCart size={28} /></span>
          <span className="sidebar-logo-text">Pet<span style={{ color: 'var(--yellow)' }}>KO</span></span>
          <button className="drawer-close" onClick={() => setMobileOpen(false)}><IconClose /></button>
        </div>
        <nav className="sidebar-nav"><NavItems onClose={() => setMobileOpen(false)} /></nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className={`sidebar-user-role ${user?.role}`}>{user?.role}</div>
          <button className="sidebar-logout" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
              <span className="ham-line" /><span className="ham-line" /><span className="ham-line" />
            </button>
            <div>
              <h1 className="topbar-title">Pet<span className="topbar-title-accent">KO</span> Dashboard</h1>
              <p className="topbar-sub">Everything Your Pets Need, All in One Place.</p>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-date"><IconCalendar style={{verticalAlign:'middle',marginRight:4}} /> {dateStr} · {timeStr}</span>
            <button className={`darkmode-toggle ${darkMode ? 'on' : ''}`}
              onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
              {darkMode ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </header>

        <div className="page-content">
          {tab === 'dashboard' && <Analytics />}
          {tab === 'pos'       && <POS />}
          {tab === 'inventory' && <Inventory />}
          {tab === 'lowstock'  && <LowStock />}
          {tab === 'daily'     && <DailySummary />}
          {tab === 'users'     && <UserManagement />}
        </div>
      </div>
    </div>
  );
}
