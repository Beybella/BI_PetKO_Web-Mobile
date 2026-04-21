import React, { useState, useEffect } from 'react';
import { IconCalendar, IconCheck, IconTrophy, IconAnalytics, IconCart, IconBox, IconWarning, MoneySack, IconCash, MoneyBillTrend } from './IconsAll';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const EXPENSE_CATEGORIES = [
  'Utilities', 'Supplies', 'Delivery Fee', 'Loan Payment',
  'Rent', 'Salary', 'Miscellaneous'
];

export default function DailySummary() {
  const [summary, setSummary]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [expanded, setExpanded]       = useState(null);
  const [desc, setDesc]               = useState('');
  const [amount, setAmount]           = useState('');
  const [expCat, setExpCat]           = useState('Miscellaneous');
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState('');
  const [error, setError]             = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/sales/today').then(r => r.json()),
      fetch('/api/transactions/today').then(r => r.json()),
    ]).then(([s, t]) => {
      setSummary(s);
      setTransactions(t);
      setLoading(false);
    });
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
          <div className="ds-date-label"><IconCalendar size={18} style={{marginRight:6}} /> Today — {summary.date}</div>
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="kpi-icon"><MoneySack size={24} /></div>
              <div className="stat-label">Today's Sales</div>
              <div className="stat-value">{fmt(summary.total_sales)}</div>
              <div className="stat-sub">{summary.transactions} transaction{summary.transactions !== 1 ? 's' : ''}</div>
            </div>
            <div className="stat-card red">
              <div className="kpi-icon"><IconCash size={24} /></div>
              <div className="stat-label">Today's Expenses</div>
              <div className="stat-value">{fmt(summary.total_expenses)}</div>
              <div className="stat-sub">Logged today</div>
            </div>
            <div className="stat-card blue">
              <div className="kpi-icon"><MoneyBillTrend size={24} /></div>
              <div className="stat-label">Net Income</div>
              <div className="stat-value" style={{ color: summary.net >= 0 ? 'var(--green)' : 'var(--primary)' }}>
                {fmt(summary.net)}
              </div>
              <div className="stat-sub">Sales minus expenses</div>
            </div>
            <div className="stat-card yellow">
              <div className="kpi-icon"><IconTrophy size={24} /></div>
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
                <div className="chart-card-title"><IconCart size={18} style={{marginRight:6}} /> Today's Sales</div>
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
                <div className="chart-card-title"><IconCash size={18} style={{marginRight:6}} /> Today's Expenses</div>
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
      {/* ── Recent Transactions ── */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="chart-card-header" style={{ marginBottom: 12 }}>
              <div className="chart-card-title"><IconCart size={18} style={{marginRight:6}} /> Today's Transactions</div>
              <span className="chart-total-badge">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
            </div>
            {transactions.length === 0 ? (
              <p className="alert-empty">No POS transactions recorded today yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <React.Fragment key={tx.transaction_id}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === tx.transaction_id ? null : tx.transaction_id)}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '.82rem' }}>{tx.transaction_id}</td>
                          <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{tx.created_at.slice(11, 16)}</td>
                          <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{tx.items.length} item{tx.items.length !== 1 ? 's' : ''}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{fmt(tx.total)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '.8rem' }}>{expanded === tx.transaction_id ? '▲' : '▼'}</td>
                        </tr>
                        {expanded === tx.transaction_id && (
                          <tr>
                            <td colSpan={5} style={{ padding: 0, background: 'var(--bg)' }}>
                              <table style={{ width: '100%', fontSize: '.82rem' }}>
                                <tbody>
                                  {tx.items.map((item, i) => (
                                    <tr key={i}>
                                      <td style={{ paddingLeft: 24 }}>{item.item}</td>
                                      <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>{fmt(item.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Log Expense Form ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="chart-card-title" style={{ marginBottom: 16 }}><IconCheck size={18} style={{marginRight:6}} /> Log an Expense</div>
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
        {msg   && <p style={{ color:'var(--green)',   fontSize:'.85rem', marginTop:10, fontWeight:600 }}><IconCheck size={14} style={{marginRight:4}} />{msg}</p>}
        {error && <p style={{ color:'var(--primary)', fontSize:'.85rem', marginTop:10 }}><IconWarning size={14} style={{marginRight:4}} />{error}</p>}
      </div>
    </div>
  );
}
