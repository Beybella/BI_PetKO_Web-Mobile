import React, { useState, useMemo } from 'react';
import useApi from '../hooks/useApi';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6c63ff','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316'];
const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 });

export default function Analytics() {
  const { data, loading } = useApi('/api/sales/summary');
  const [month, setMonth] = useState('all');

  const months = useMemo(() => {
    if (!data) return [];
    return data.monthly.map(m => m.month);
  }, [data]);

  const dailyData = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.daily).map(([date, amount]) => ({ date: date.slice(5), amount }));
    if (month === 'all') return entries;
    return entries.filter(e => {
      const full = Object.keys(data.daily).find(d => d.slice(5) === e.date);
      return full && full.startsWith(month);
    });
  }, [data, month]);

  const filteredMonthly = useMemo(() => {
    if (!data) return [];
    if (month === 'all') return data.monthly;
    return data.monthly.filter(m => m.month === month);
  }, [data, month]);

  const totals = useMemo(() => {
    if (!filteredMonthly.length) return { revenue: 0, expenses: 0, net: 0, transactions: 0 };
    return filteredMonthly.reduce((acc, m) => ({
      revenue:      acc.revenue      + m.revenue,
      expenses:     acc.expenses     + m.expenses,
      net:          acc.net          + m.net,
      transactions: acc.transactions + m.transactions,
    }), { revenue: 0, expenses: 0, net: 0, transactions: 0 });
  }, [filteredMonthly]);

  const categoryData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.categories).map(([name, value]) => ({ name, value }));
  }, [data]);

  const topProducts = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.top_products).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <>
      {/* Month filter */}
      <div className="month-filter">
        <button className={month === 'all' ? 'active' : ''} onClick={() => setMonth('all')}>All</button>
        {months.map(m => (
          <button key={m} className={month === m ? 'active' : ''} onClick={() => setMonth(m)}>
            {new Date(m + '-01').toLocaleString('default', { month: 'short', year: '2-digit' })}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{fmt(totals.revenue)}</div>
          <div className="stat-sub">Recorded sales</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{totals.transactions.toLocaleString()}</div>
          <div className="stat-sub">Line items</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Expenses</div>
          <div className="stat-value">{fmt(totals.expenses)}</div>
          <div className="stat-sub">Fees, loans, misc</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Net Income</div>
          <div className="stat-value">{fmt(totals.net)}</div>
          <div className="stat-sub">Revenue − Expenses</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card chart-full">
          <h3>Daily Sales</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'} />
              <Tooltip formatter={v => fmt(v)} />
              <Line type="monotone" dataKey="amount" stroke="#6c63ff" strokeWidth={2} dot={false} name="Sales" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Sales by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3>Top 10 Products</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="value" fill="#6c63ff" name="Revenue" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly summary table */}
      <div className="card">
        <h3>Monthly Summary</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Transactions</th></tr>
            </thead>
            <tbody>
              {filteredMonthly.map(m => (
                <tr key={m.month}>
                  <td>{new Date(m.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(m.revenue)}</td>
                  <td style={{ color: 'var(--danger)' }}>{fmt(m.expenses)}</td>
                  <td style={{ fontWeight: 600, color: m.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(m.net)}</td>
                  <td>{m.transactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
