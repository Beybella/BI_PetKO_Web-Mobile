import React, { useState, useMemo } from 'react';
import useApi from '../hooks/useApi';
import Cart, { fmt } from './Cart';
import Receipt from './Receipt';

const CATEGORIES = ['All', 'Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'];

export default function POS() {
  const { data: inventory, loading } = useApi('/api/inventory');
  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cash, setCash]             = useState('');
  const [receipt, setReceipt]       = useState(null);
  const [error, setError]           = useState('');
  const [processing, setProcessing] = useState(false);

  const displayed = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(i => {
      const matchSearch = !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.brand.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'All' || i.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [inventory, search, activeCategory]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, price: item.retail_price }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { removeItem(id); return; }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.min(qty, c.stock) } : c));
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
  if (receipt)  return <Receipt receipt={receipt} onNew={() => setReceipt(null)} />;

  return (
    <div className="pos-layout">
      {/* Left: product browser */}
      <div className="pos-left">
        <div className="card" style={{ marginBottom: 0 }}>
          {/* Search */}
          <input
            className="pos-search"
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />

          {/* Category tabs */}
          <div className="pos-cat-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`pos-cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="pos-product-grid">
            {displayed.length === 0
              ? <p style={{ color: 'var(--muted)', fontSize: '.85rem', padding: '16px 0' }}>No products found.</p>
              : displayed.map(item => (
                <button
                  key={item.id}
                  className={`pos-product-card ${item.stock === 0 ? 'out-of-stock' : ''}`}
                  onClick={() => item.stock > 0 && addToCart(item)}
                  disabled={item.stock === 0}
                >
                  <div className="pos-product-name">{item.name}</div>
                  <div className="pos-product-brand">{item.brand}</div>
                  <div className="pos-product-footer">
                    <span className="pos-product-price">{fmt(item.retail_price)}</span>
                    <span className={`pos-product-stock ${item.stock <= item.reorder ? 'low' : ''}`}>
                      {item.stock === 0 ? 'Out' : `${item.stock} left`}
                    </span>
                  </div>
                </button>
              ))
            }
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
