import React, { useState, useMemo, useRef } from 'react';
import useApi from '../hooks/useApi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#e879a0','#f43f8a','#fb7bb8','#fda4cf','#f59e0b','#10b981','#3b82f6','#a855f7'];
const fmt  = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });
const fmtK = v => '₱' + (v / 1000).toFixed(0) + 'k';

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Analytics() {
  const { data, loading } = useApi('/api/sales/summary');
  const [month, setMonth]     = useState('all');
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef();

  const months = useMemo(() => data ? data.monthly.map(m => m.month) : [], [data]);

  const dailyData = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.daily).map(([date, amount]) => ({ date, amount }));
    if (month === 'all') return entries.map(e => ({ ...e, date: e.date.slice(5) }));
    return entries.filter(e => e.date.startsWith(month)).map(e => ({ date: e.date.slice(8), amount: e.amount }));
  }, [data, month]);

  const filteredMonthly = useMemo(() => {
    if (!data) return [];
    return month === 'all' ? data.monthly : data.monthly.filter(m => m.month === month);
  }, [data, month]);

  const totals = useMemo(() => {
    const zero = { revenue: 0, expenses: 0, net: 0, transactions: 0 };
    return filteredMonthly.reduce((a, m) => ({
      revenue:      a.revenue      + m.revenue,
      expenses:     a.expenses     + m.expenses,
      net:          a.net          + m.net,
      transactions: a.transactions + m.transactions,
    }), zero);
  }, [filteredMonthly]);

  // vs previous period
  const prevTotals = useMemo(() => {
    if (!data || month === 'all') return null;
    const idx = data.monthly.findIndex(m => m.month === month);
    if (idx <= 0) return null;
    const prev = data.monthly[idx - 1];
    return { revenue: prev.revenue, transactions: prev.transactions };
  }, [data, month]);

  const pct = (curr, prev) => {
    if (!prev || prev === 0) return null;
    const p = ((curr - prev) / prev * 100).toFixed(1);
    return { val: p, up: p >= 0 };
  };

  const categoryData = useMemo(() => {
    if (!data) return [];
    const src = month === 'all' ? data.categories : (data.monthly.find(m => m.month === month)?.categories ?? {});
    return Object.entries(src).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [data, month]);

  const topProducts = useMemo(() => {
    if (!data) return [];
    const src = month === 'all' ? data.top_products : (data.monthly.find(m => m.month === month)?.top_products ?? {});
    return Object.entries(src).map(([name, value]) => ({ name, value }));
  }, [data, month]);

  // top product name + units (approximate from revenue / avg retail)
  const topProductName = topProducts[0]?.name ?? '—';

  // day-of-week breakdown
  const dowData = useMemo(() => {
    if (!data) return [];
    const buckets = Array(7).fill(0);
    Object.entries(data.daily).forEach(([date, amount]) => {
      if (month !== 'all' && !date.startsWith(month)) return;
      buckets[new Date(date).getDay()] += amount;
    });
    return DOW.map((d, i) => ({ day: d, amount: buckets[i] }));
  }, [data, month]);

  // avg daily sales
  const avgDaily = dailyData.length ? totals.revenue / dailyData.length : 0;

  // low stock items (critical only, max 3 shown)
  const { data: inventory } = useApi('/api/inventory');
  const lowStockItems = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(i => i.stock < i.reorder).slice(0, 5);
  }, [inventory]);

  const selectedLabel = month === 'all'
    ? 'All Time'
    : new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

  // ── PDF Export ──
  const exportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`PetKO_Dashboard_${month}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div ref={reportRef}>
      {/* ── Header row ── */}
      <div className="dash-header-row">
        <div>
          <div className="dash-period-label">{selectedLabel} Performance</div>
          {/* Month filter */}
          <div className="month-filter" style={{ marginTop: 8 }}>
            <button className={month === 'all' ? 'active' : ''} onClick={() => setMonth('all')}>All</button>
            {months.map(m => (
              <button key={m} className={month === m ? 'active' : ''} onClick={() => setMonth(m)}>
                {new Date(m + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
        <button className="export-btn" onClick={exportPDF} disabled={exporting}>
          {exporting ? 'Exporting...' : '⬇ Export PDF'}
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <KpiCard label={`Total Sales${month !== 'all' ? ` (${new Date(month+'-02').toLocaleString('default',{month:'short'})})` : ''}`}
          value={fmt(totals.revenue)}
          delta={pct(totals.revenue, prevTotals?.revenue)}
          sub="vs last month" color="primary" />
        <KpiCard label="Total Transactions"
          value={totals.transactions.toLocaleString()}
          delta={pct(totals.transactions, prevTotals?.transactions)}
          sub="vs last month" color="success" />
        <KpiCard label="Avg Daily Sales"
          value={fmt(avgDaily)}
          sub={`across ${dailyData.length} days`} color="warning" />
        <KpiCard label="Top Product"
          value={topProductName}
          sub={topProducts[0] ? fmt(topProducts[0].value) + ' revenue' : '—'} color="info" />
      </div>

      {/* ── Charts row 1: Daily trend full width ── */}
      <div className="charts-grid" style={{ marginTop: 4 }}>
        <div className="card chart-full">
          <h3>Daily Sales Trend</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                <Tooltip formatter={v => fmt(v)} labelFormatter={l => month === 'all' ? l : `Day ${l}`} />
                <Line type="monotone" dataKey="amount" stroke="#e879a0" strokeWidth={2.5} dot={false} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Category + DoW: side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Sales by Category</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={100} innerRadius={45}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
                <Legend iconType="circle" iconSize={11} formatter={(v) => {
                  const item = categoryData.find(d => d.name === v);
                  const total = categoryData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 && item ? ((item.value / total) * 100).toFixed(0) : 0;
                  return `${v} (${pct}%)`;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3>Sales by Day of Week</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtK} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="amount" name="Sales" radius={[6,6,0,0]} maxBarSize={60}>
                  {dowData.map((entry, i) => {
                    const max = Math.max(...dowData.map(d => d.amount));
                    return <Cell key={i} fill={entry.amount === max ? '#e879a0' : '#fda4cf'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="charts-grid">
        <div className="card">
          <h3>Top Products</h3>
          <table style={{ width: '100%', fontSize: '.85rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Product</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.slice(0, 8).map((p, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 8px', color: 'var(--muted)', fontSize: '.8rem' }}>{i + 1}</td>
                  <td style={{ padding: '7px 8px', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{fmt(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Monthly Summary</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th></tr>
              </thead>
              <tbody>
                {filteredMonthly.map(m => (
                  <tr key={m.month}>
                    <td>{new Date(m.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(m.revenue)}</td>
                    <td style={{ color: 'var(--danger)' }}>{fmt(m.expenses)}</td>
                    <td style={{ fontWeight: 600, color: m.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(m.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Low Stock Alert strip ── */}
      {lowStockItems.length > 0 && (
        <div className="low-stock-strip">
          <span className="low-stock-title">⚠ Low Stock Alerts!</span>
          <ul>
            {lowStockItems.map(i => (
              <li key={i.id}>{i.name} ({i.stock} left)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, delta, sub, color }) {
  const colors = { primary: '#e879a0', success: '#10b981', warning: '#f59e0b', info: '#f43f8a' };
  return (
    <div className="stat-card" style={{ borderLeftColor: colors[color] || colors.primary }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {delta && (
        <div className="stat-delta" style={{ color: delta.up ? 'var(--success)' : 'var(--danger)' }}>
          {delta.up ? '▲' : '▼'} {Math.abs(delta.val)}% {sub}
        </div>
      )}
      {!delta && sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
