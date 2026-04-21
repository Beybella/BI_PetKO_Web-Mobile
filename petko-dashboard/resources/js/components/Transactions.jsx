import React, { useState, useEffect } from 'react';
import { IconCart, IconCalendar, IconSearch, IconReceipt } from './IconsAll';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [date, setDate]                 = useState('');
  const [expanded, setExpanded]         = useState(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (date)   params.set('date', date);
    fetch(`/api/transactions?${params}`)
      .then(r => r.json())
      .then(d => { setTransactions(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSearch = e => { e.preventDefault(); load(); };

  return (
    <div>
      <div className="dash-header-row" style={{ marginBottom: 16 }}>
        <div>
          <div className="analytics-period-badge">Sales History</div>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 4 }}>
            Only transactions made through the POS are shown here.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <IconSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="modal-input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by item name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <input
          type="date"
          className="modal-input"
          style={{ width: 180 }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button type="submit" className="add-item-btn">Search</button>
        {(search || date) && (
          <button type="button" className="add-item-btn" style={{ background: 'var(--muted)' }}
            onClick={() => { setSearch(''); setDate(''); setTimeout(load, 0); }}>
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}><IconReceipt size={40} style={{ color: 'var(--muted)' }} /></div>
          <p>No transactions found.</p>
          <p style={{ fontSize: '.8rem', marginTop: 4 }}>Transactions will appear here once sales are made through the POS.</p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <React.Fragment key={tx.transaction_id}>
                  <tr
                    style={{ cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === tx.transaction_id ? null : tx.transaction_id)}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{tx.transaction_id}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                      <IconCalendar size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      {tx.created_at}
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                      {tx.items.length} item{tx.items.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{fmt(tx.total)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '.8rem' }}>
                      {expanded === tx.transaction_id ? '▲' : '▼'}
                    </td>
                  </tr>
                  {expanded === tx.transaction_id && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, background: 'var(--bg)' }}>
                        <table style={{ width: '100%', fontSize: '.85rem' }}>
                          <thead>
                            <tr>
                              <th style={{ paddingLeft: 32 }}>Item</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tx.items.map((item, i) => (
                              <tr key={i}>
                                <td style={{ paddingLeft: 32 }}>{item.item}</td>
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
  );
}
