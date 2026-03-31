import React, { useState, useMemo, useRef } from 'react';
import useApi from '../hooks/useApi';
import Cart, { fmt } from './Cart';
import Receipt from './Receipt';

export default function POS() {
  const { data: inventory, loading } = useApi('/api/inventory');
  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState('');
  const [cash, setCash]             = useState('');
  const [receipt, setReceipt]       = useState(null);
  const [error, setError]           = useState('');
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef();

  const filtered = useMemo(() => {
    if (!inventory || !search.trim()) return [];
    const q = search.toLowerCase();
    return inventory
      .filter(i => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q))
      .slice(0, 8);
  }, [inventory, search]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, price: item.retail_price }];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { removeItem(id); return; }
    setCart(prev => prev.map(c =>
      c.id === id ? { ...c, qty: Math.min(qty, c.stock) } : c
    ));
  };

  const updatePrice = (id, price) =>
    setCart(prev => prev.map(c => c.id === id ? { ...c, price: parseFloat(price) || 0 } : c));

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const checkout = async () => {
    const total   = cart.reduce((s, c) => s + c.qty * c.price, 0);
    const cashNum = parseFloat(cash) || 0;
    if (!cart.length) return;
    if (cashNum < total) { setError('Cash received is less than total.'); return; }
    setError('');
    setProcessing(true);
    try {
      const res = await fetch('/api/pos/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
          cash_tendered: cashNum,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Transaction failed.'); return; }
      setReceipt({ ...json, cartSnapshot: [...cart] });
      setCart([]);
      setCash('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (receipt)  return <Receipt receipt={receipt} onNew={() => { setReceipt(null); searchRef.current?.focus(); }} />;

  return (
    <div className="pos-layout">
      {/* Left: product search */}
      <div className="pos-left">
        <div className="card" style={{ marginBottom: 0 }}>
          <h3>🔍 Add Item</h3>
          <div style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              className="pos-search"
              type="text"
              placeholder="Search product by name or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {filtered.length > 0 && (
              <div className="pos-dropdown">
                {filtered.map(item => (
                  <div key={item.id} className="pos-dropdown-item" onClick={() => addToCart(item)}>
                    <div>
                      <span className="pos-item-name">{item.name}</span>
                      <span className="pos-item-brand"> · {item.brand}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>Stock: {item.stock}</span>
                      <span className="pos-item-price">{fmt(item.retail_price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 8 }}>QUICK FILTER</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'].map(cat => (
                <button key={cat} className="pos-cat-btn" onClick={() => setSearch(cat.split(' ')[0])}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: cart */}
      <div className="pos-right">
        <Cart
          cart={cart}
          cash={cash}
          setCash={setCash}
          error={error}
          processing={processing}
          onUpdateQty={updateQty}
          onUpdatePrice={updatePrice}
          onRemove={removeItem}
          onClear={() => setCart([])}
          onCheckout={checkout}
        />
      </div>
    </div>
  );
}
