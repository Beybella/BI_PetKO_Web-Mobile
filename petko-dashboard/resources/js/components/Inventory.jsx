import React, { useState, useMemo } from 'react';
import useApi from '../hooks/useApi';

export default function Inventory() {
  const { data, loading } = useApi('/api/inventory');
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(i => i.category))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                          i.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = !category || i.category === category;
      return matchSearch && matchCat;
    });
  }, [data, search, category]);

  if (loading) return <div className="loading">Loading inventory...</div>;

  const statusBadge = (stock, reorder) => {
    if (stock < reorder)  return <span className="badge low">Low</span>;
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
          <div className="stat-label">Total Stock Units</div>
          <div className="stat-value">{data.reduce((s, i) => s + i.stock, 0).toLocaleString()}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Inventory Value (Cost)</div>
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
            type="text"
            placeholder="Search by name or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{i.id}</td>
                  <td>{i.category}</td>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td>{i.brand}</td>
                  <td>₱{i.unit_cost.toLocaleString()}</td>
                  <td>₱{i.retail_price.toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{i.stock}</td>
                  <td>{i.reorder}</td>
                  <td>{statusBadge(i.stock, i.reorder)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
