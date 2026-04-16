import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Cat Food','Dog Food','Hygiene','Medical','Accessories','Treats/Snacks'];
const EMPTY_FORM = { name:'', category:'', brand:'', unit_cost:'', retail_price:'', stock:'', reorder:'' };
const PAGE_SIZE  = 15;

export default function Inventory() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('');
  const [page, setPage]               = useState(1);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty]   = useState('');
  const [restockMsg, setRestockMsg]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [addError, setAddError]       = useState('');
  const [addSaving, setAddSaving]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  // Support multiple categories per product (comma-separated)
  const categories = useMemo(() => {
    if (!data) return [];
    const allCats = data.flatMap(i => (i.category || '').split(',').map(c => c.trim()));
    return [...new Set(allCats)].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter(i => {
      const cats = (i.category || '').split(',').map(c => c.trim());
      return (i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q)) &&
        (!category || cats.includes(category));
    });
  }, [data, search, category]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, category]);

  const openRestock = (item) => { setRestockItem(item); setRestockQty(''); setRestockMsg(''); };
  const openEdit    = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, brand: item.brand,
      unit_cost: item.unit_cost, retail_price: item.retail_price,
      stock: item.stock, reorder: item.reorder });
    setAddError('');
  };

  const submitRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty < 1) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/inventory/${restockItem.id}/restock`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ qty }),
      });
      const json = await res.json();
      if (!res.ok) { setRestockMsg(json.error || 'Failed.'); return; }
      setData(prev => prev.map(i => i.id === restockItem.id ? { ...i, stock: json.new_stock } : i));
      setRestockItem(prev => ({ ...prev, stock: json.new_stock }));
      setRestockMsg(`Stock updated to ${json.new_stock}`);
      setRestockQty('');
    } catch { setRestockMsg('Network error.'); }
    finally { setSaving(false); }
  };

  const submitAdd = async () => {
    if (!form.name || !form.brand || !form.unit_cost || !form.retail_price || form.stock === '' || form.reorder === '') {
      setAddError('Please fill in all fields.'); return;
    }
    if (!form.category) { setAddError('Please select at least one category.'); return; }
    setAddError(''); setAddSaving(true);
    try {
      const res  = await fetch('/api/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.message || 'Failed.'); return; }
      setData(prev => [...prev, json]);
      setShowAdd(false); setForm(EMPTY_FORM);
    } catch { setAddError('Network error.'); }
    finally { setAddSaving(false); }
  };

  const submitEdit = async () => {
    if (!form.name || !form.brand || form.unit_cost === '' || form.retail_price === '' || form.stock === '' || form.reorder === '') {
      setAddError('Please fill in all fields.'); return;
    }
    setAddError(''); setAddSaving(true);
    try {
      const res = await fetch(`/api/inventory/${editItem.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setAddError('Failed to update.'); return; }
      setData(prev => prev.map(i => i.id === editItem.id ? {
        ...i, ...form,
        unit_cost: parseFloat(form.unit_cost),
        retail_price: parseFloat(form.retail_price),
        stock: parseInt(form.stock),
        reorder: parseInt(form.reorder),
      } : i));
      setEditItem(null);
    } catch { setAddError('Network error.'); }
    finally { setAddSaving(false); }
  };

  const submitDelete = async (id) => {
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      setData(prev => prev.filter(i => i.id !== id));
      setDeleteConfirm(null);
    } catch { alert('Delete failed.'); }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;

  const badge = (stock, reorder) => {
    if (stock === 0)       return <span className="badge low">Out</span>;
    if (stock < reorder)   return <span className="badge low">Low</span>;
    if (stock === reorder) return <span className="badge warn">Reorder</span>;
    return <span className="badge ok">OK</span>;
  };

  return (
    <React.Fragment>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-label">Total SKUs</div><div className="stat-value">{data.length}</div></div>
        <div className="stat-card green"><div className="stat-label">Total Units</div><div className="stat-value">{data.reduce((s,i) => s+i.stock, 0).toLocaleString()}</div></div>
        <div className="stat-card yellow"><div className="stat-label">Cost Value</div><div className="stat-value">₱{data.reduce((s,i) => s+i.unit_cost*i.stock, 0).toLocaleString()}</div></div>
        <div className="stat-card red"><div className="stat-label">Retail Value</div><div className="stat-value">₱{data.reduce((s,i) => s+i.retail_price*i.stock, 0).toLocaleString()}</div></div>
      </div>

      <div className="card">
        <div className="inv-toolbar">
          <div className="search-bar" style={{ flex:1, marginBottom:0 }}>
            <input type="text" placeholder="Search by name or brand..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {isAdmin && (
            <button className="add-item-btn" onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); setAddError(''); }}>
              + Add Item
            </button>
          )}
        </div>

        <div className="table-wrap" style={{ marginTop:16 }}>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Category</th><th>Item Name</th><th>Brand</th>
                <th>Cost</th><th>Retail</th><th>Margin</th><th>Stock</th><th>Reorder</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(i => {
                const margin = i.retail_price > 0 ? Math.round((i.retail_price - i.unit_cost) / i.retail_price * 100) : 0;
                const marginColor = margin >= 30 ? 'var(--green)' : margin >= 15 ? '#d97706' : 'var(--primary)';
                return (
                  <tr key={i.id}>
                    <td style={{ color:'var(--muted)', fontSize:'.78rem' }}>{i.id}</td>
                    <td>{i.category}</td>
                    <td style={{ fontWeight:500 }}>{i.name}</td>
                    <td>{i.brand}</td>
                    <td>₱{i.unit_cost.toLocaleString()}</td>
                    <td>₱{i.retail_price.toLocaleString()}</td>
                    <td><span style={{ color: marginColor, fontWeight:700 }}>{margin}%</span></td>
                    <td style={{ fontWeight:700 }}>{i.stock}</td>
                    <td>{i.reorder}</td>
                    <td>{badge(i.stock, i.reorder)}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="restock-btn" onClick={() => openRestock(i)}>+ Stock</button>
                        {isAdmin && <button className="edit-btn" onClick={() => openEdit(i)}>✏️</button>}
                        {isAdmin && <button className="delete-btn" onClick={() => setDeleteConfirm(i)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--muted)', padding:24 }}>No items found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>‹ Prev</button>
            <span className="page-info">Page {page} of {totalPages} · {filtered.length} items</span>
            <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>Next ›</button>
          </div>
        )}
      </div>

      {restockItem && (
        <div className="modal-overlay" onClick={() => setRestockItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom:4 }}>Add Stock</h3>
            <p style={{ color:'var(--muted)', fontSize:'.85rem', marginBottom:16 }}>
              {restockItem.name}<br />Current stock: <strong>{restockItem.stock}</strong>
            </p>
            <label style={{ fontSize:'.82rem', fontWeight:600, display:'block', marginBottom:6 }}>Quantity to Add</label>
            <input className="modal-input" type="number" min="1" placeholder="e.g. 10"
              value={restockQty} onChange={e => setRestockQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitRestock()} autoFocus />
            {restockMsg && <p style={{ fontSize:'.82rem', marginTop:8, color:'var(--green)' }}>✓ {restockMsg}</p>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="checkout-btn" style={{ flex:1 }} onClick={submitRestock} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
              <button className="inv-close-btn" onClick={() => setRestockItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <FormModal title="➕ Add New Item" onSubmit={submitAdd} onClose={() => setShowAdd(false)}
          form={form} setForm={setForm} addError={addError} addSaving={addSaving} />
      )}

      {editItem && (
        <FormModal title={`✏️ Edit — ${editItem.name}`} onSubmit={submitEdit} onClose={() => setEditItem(null)}
          form={form} setForm={setForm} addError={addError} addSaving={addSaving} />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom:8 }}>🗑️ Delete Item</h3>
            <p style={{ color:'var(--muted)', fontSize:'.88rem', marginBottom:20 }}>
              Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="checkout-btn" style={{ flex:1, background:'var(--primary)' }} onClick={() => submitDelete(deleteConfirm.id)}>
                Yes, Delete
              </button>
              <button className="inv-close-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function FormModal({ title, onSubmit, onClose, form, setForm, addError, addSaving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom:4 }}>{title}</h3>
        <p style={{ color:'var(--muted)', fontSize:'.82rem', marginBottom:18 }}>Fill in the product details.</p>
        <div className="add-form-grid">
          {[
            { key:'name',         label:'Item Name *',        type:'text',   placeholder:'e.g. Royal Canin Adult 2kg' },
            { key:'brand',        label:'Brand *',            type:'text',   placeholder:'e.g. Royal Canin' },
            { key:'unit_cost',    label:'Unit Cost (₱) *',    type:'number', placeholder:'0.00' },
            { key:'retail_price', label:'Retail Price (₱) *', type:'number', placeholder:'0.00' },
            { key:'stock',        label:'Stock Level *',      type:'number', placeholder:'0' },
            { key:'reorder',      label:'Reorder Level *',    type:'number', placeholder:'0' },
          ].map(f => (
            <div key={f.key} className="add-form-field">
              <label>{f.label}</label>
              <input className="modal-input" type={f.type} placeholder={f.placeholder}
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="add-form-field" style={{ gridColumn: '1 / -1' }}>
            <label>Category * <span style={{ color:'var(--muted)', fontWeight:400 }}>(select multiple)</span></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
              {CATEGORIES.map(c => {
                const cats = (form.category || '').split(',').map(x => x.trim()).filter(Boolean);
                const selected = cats.includes(c);
                return (
                  <button key={c} type="button"
                    onClick={() => {
                      const current = (form.category || '').split(',').map(x => x.trim()).filter(Boolean);
                      const next = selected ? current.filter(x => x !== c) : [...current, c];
                      setForm(p => ({ ...p, category: next.join(',') }));
                    }}
                    style={{
                      padding:'5px 14px', borderRadius:999, fontSize:'.78rem', fontWeight:600,
                      cursor:'pointer', transition:'all .15s', fontFamily:'inherit',
                      background: selected ? 'var(--primary)' : 'white',
                      color: selected ? 'white' : 'var(--muted)',
                      border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
                    }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {addError && <p style={{ color:'var(--primary)', fontSize:'.82rem', marginTop:8 }}>⚠️ {addError}</p>}
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="checkout-btn" style={{ flex:1 }} onClick={onSubmit} disabled={addSaving}>
            {addSaving ? 'Saving...' : '✓ Save'}
          </button>
          <button className="inv-close-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
