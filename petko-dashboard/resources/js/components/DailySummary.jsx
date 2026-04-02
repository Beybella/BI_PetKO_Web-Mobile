import React, { useState, useEffect } from 'react';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const EXPENSE_CATEGORIES = [
  'Utilities', 'Supplies', 'Delivery Fee', 'Loan Payment',
  'Rent', 'Salary', 'Miscellaneous'
];

export default function DailySummary() {
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [desc, setDesc]           = useState('');
  const [amount, setAmount]       = useState('');
  const [expCat, setExpCat]       = useState('Miscellaneous');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/sales/today')
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const submitExpense = async () => {
    if (!desc.trim() || !amount) { setError('Please fill in description and amount.'); return; }
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ description: `${expCat}: ${desc}`, amount }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Failed.'); return; }
      setMsg(`Expense of ${fmt(amount)} logged.`);
      setDesc(''); setAmount('');
      setTimeout(() => { setMsg(''); load(); }, 1500);
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* ── Daily Summary Cards ── */}
      {loading ? (
        <div className="loading">Loading today's summary...</div>
      ) : (
        <>
          <div className="ds-date-label">📅 Today — {summary.date}</div>
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="kpi-icon">💰</div>
              <div className="stat-label">Today's Sales</div>
              <div className="stat-value">{fmt(summary.total_sales)}</div>
              <div className="stat-sub">{summary.transactions} transaction{summary.transactions !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card red">
              <div className="kpi-icon">📤</div>
              <div className="stat-label">Today's Expenses</div>
              <div className="stat-value">{fmt(summary.total_expenses)}</div>
              <div className="stat-sub">Logged today</div>
            </div>
            <div className="stat-card blue">
              <div className="kpi-icon">📈</div>
              <div className="stat-label">Net Income</div>
              <div className="stat-value" style={{ color: summary.net >= 0 ? 'var(--green)' : 'var(--primary)' }}>
                {fmt(summary.net)}
              </div>
              <div className="stat-sub">Sales minus expenses</div>
            </div>
            <div className="stat-card yellow">
              <div className="kpi-icon">🏆</div>
              <div className="stat-label">Top Item</div>
              <div className="stat-value" style={{ fontSize: '1rem' }}>{summary.top_item || '—'}</div>
              <div className="stat-sub">{summary.top_item ? fmt(summary.top_item_amt) + ' revenue' : 'No sales yet'}</div>
            </div>
          </div>

          {/* ── Today's breakdown ── */}
          <div className="ds-grid">
            {/* Sales list */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="chart-card-header">
                <div className="chart-card-title">🧾 Today's Sales</div>
                <span className="chart-total-badge">{fmt(summary.total_sales)}</span>
              </div>
              {summary.sales.length === 0
                ? <p className="alert-empty">No sales recorded today yet.</p>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Item</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
                      <tbody>
                        {summary.sales.map((s, i) => (
                          <tr key={i}>
                            <td>{s.item}</td>
                            <td style={{ textAlign:'right', fontWeight:600, color:'var(--green)' }}>{fmt(s.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>

            {/* Expenses list */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="chart-card-header">
                <div className="chart-card-title">📤 Today's Expenses</div>
                <span className="chart-total-badge">{fmt(summary.total_expenses)}</span>
              </div>
              {summary.expenses.length === 0
                ? <p className="alert-empty">No expenses logged today.</p>
                : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Description</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
                      <tbody>
                        {summary.expenses.map((e, i) => (
                          <tr key={i}>
                            <td>{e.item}</td>
                            <td style={{ textAlign:'right', fontWeight:600, color:'var(--primary)' }}>{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          </div>
        </>
      )}

      {/* ── Log Expense Form ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="chart-card-title" style={{ marginBottom: 16 }}>➕ Log an Expense</div>
        <div className="expense-form">
          <div className="add-form-field">
            <label>Category</label>
            <select className="modal-input" value={expCat} onChange={e => setExpCat(e.target.value)}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="add-form-field" style={{ flex: 2 }}>
            <label>Description *</label>
            <input className="modal-input" placeholder="e.g. Meralco bill, Lalamove fee..."
              value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="add-form-field">
            <label>Amount (₱) *</label>
            <input className="modal-input" type="number" min="0" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitExpense()} />
          </div>
          <div className="add-form-field" style={{ justifyContent: 'flex-end' }}>
            <label>&nbsp;</label>
            <button className="add-item-btn" onClick={submitExpense} disabled={saving}>
              {saving ? 'Saving...' : '+ Log Expense'}
            </button>
          </div>
        </div>
        {msg   && <p style={{ color:'var(--green)',   fontSize:'.85rem', marginTop:10, fontWeight:600 }}>✓ {msg}</p>}
        {error && <p style={{ color:'var(--primary)', fontSize:'.85rem', marginTop:10 }}>⚠️ {error}</p>}
      </div>
    </div>
  );
}
