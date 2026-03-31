import React, { useState, useMemo, useEffect } from 'react';

export default function Inventory() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('');
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty]   = useState('');
  const [restockMsg, setRestockMsg]   = useState('');
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    fetch('/api/inventory')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(i => i.category))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter(i =>
      (i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)) &&
      (!category || i.category === category)
    );
  }, [data, search, category]);

  const openRestock = (item) => {
    setRestockItem(item);
    setRestockQty('');
    setRestockMsg('');
  };

  const submitRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty < 1) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/inventory/${restockItem.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ qty }),
      });
      const json = await res.json();
      if (!res.ok) { setRestockMsg(json.error || 'Failed.'); return; }
      setData(prev => prev.map(i =>
        i.id === restockItem.id ? { ...i, stock: json.new_stock } : i
      ));
      setRestockItem(prev => ({ ...prev, stock: json.new_stock }));
      setRestockMsg(`Stock updated to ${json.new_stock}`);
      setRestockQty('');
    } catch {
      setRestockMsg('Network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  const badge = (stock, reorder) => {
    if (stock === 0)       return <span className="badge low">Out</span>;
    if (stock < reorder)   return <span className="badge low">Low</span>;
    if (stock === reorder) return <span className="badge warn">Reorder</span>;
    return <span className="badge ok">OK</span>;
  };

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total SKUs</div>
          <div className="stat-value">{data.length}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Total Units</div>
          <div className="stat-value">{data.reduce((s, i) => s + i.stock, 0).toLocaleString()}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Cost Value</div>
          <div className="stat-value">₱{data.reduce((s, i) => s + i.unit_cost * i.stock, 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Retail Value</div>
          <div className="stat-value">₱{data.reduce((s, i) => s + i.retail_price * i.stock, 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            type="text" placeholder="Search by name or brand..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Item Name</th>
                <th>Brand</th>
                <th>Cost</th>
                <th>Retail</th>
                <th>Stock</th>
                <th>Reorder</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '.78rem' }}>{i.id}</td>
                  <td>{i.category}</td>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td>{i.brand}</td>
                  <td>₱{i.unit_cost.toLocaleString()}</td>
                  <td>₱{i.retail_price.toLocaleString()}</td>
                  <td style={{ fontWeight: 700 }}>{i.stock}</td>
                  <td>{i.reorder}</td>
                  <td>{badge(i.stock, i.reorder)}</td>
                  <td>
                    <button className="restock-btn" onClick={() => openRestock(i)}>
                      + Add Stock
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {restockItem && (
        <div className="modal-overlay" onClick={() => setRestockItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}>Add Stock</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: 16 }}>
              {restockItem.name}<br />
              Current stock: <strong style={{ color: 'var(--text)' }}>{restockItem.stock}</strong>
            </p>
            <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Quantity to Add
            </label>
            <input
              className="modal-input"
              type="number" min="1" placeholder="e.g. 10"
              value={restockQty}
              onChange={e => setRestockQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitRestock()}
              autoFocus
            />
            {restockMsg && (
              <p style={{ fontSize: '.82rem', marginTop: 8, color: 'var(--success)' }}>
                ✓ {restockMsg}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="checkout-btn" style={{ flex: 1 }} onClick={submitRestock} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
              <button className="clear-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => setRestockItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
