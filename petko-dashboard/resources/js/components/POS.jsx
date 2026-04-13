import React, { useState, useMemo, useEffect } from 'react';
import useApi from '../hooks/useApi';
import Cart, { fmt } from './Cart';
import Receipt from './Receipt';

const CATEGORIES = ['All','Cat Food','Dog Food','Hygiene','Medical','Accessories','Treats/Snacks'];
const CAT_ICONS  = {'All':'🐾','Cat Food':'🐱','Dog Food':'🐶','Hygiene':'🧴','Medical':'💊','Accessories':'🎀','Treats/Snacks':'🦴'};

export default function POS() {
  const { data: apiInventory, loading } = useApi('/api/inventory');
  const [inventory, setInventory]   = useState(null);
  const [cart, setCart]             = useState([]);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cash, setCash]             = useState('');
  const [discount, setDiscount]     = useState('');
  const [receipt, setReceipt]       = useState(null);2
  const [error, setError]           = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (apiInventory) setInventory(apiInventory); }, [apiInventory]);

  const displayed = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(i => {
      const q = search.toLowerCase();
      return (!q || i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q))
        && (activeCategory === 'All' || i.category === activeCategory);
    });
  }, [inventory, search, activeCategory]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const addToCart = (item) => setCart(prev => {
    const ex = prev.find(c => c.id === item.id);
    if (ex) { if (ex.qty >= item.stock) return prev; return prev.map(c => c.id === item.id ? {...c, qty: c.qty+1} : c); }
    return [...prev, {...item, qty:1, price: item.retail_price}];
  });

  const updateQty   = (id, qty) => { if (qty < 1) { setCart(p => p.filter(c => c.id !== id)); return; } setCart(p => p.map(c => c.id===id ? {...c, qty: Math.min(qty, c.stock)} : c)); };
  const updatePrice = (id, price) => setCart(p => p.map(c => c.id===id ? {...c, price: parseFloat(price)||0} : c));

  const checkout = async () => {
    const subtotal = cart.reduce((s,c) => s + c.qty*c.price, 0);
    const disc     = parseFloat(discount) || 0;
    const total    = Math.max(0, subtotal - disc);
    const cashNum  = parseFloat(cash) || 0;
    if (!cart.length) return;
    if (cashNum < total) { setError('Cash received is less than total.'); return; }
    setError(''); setProcessing(true);
    try {
      const res  = await fetch('/api/pos/transaction', {
        method: 'POST',
        headers: {'Content-Type':'application/json', Accept:'application/json'},
        body: JSON.stringify({items: cart.map(c=>({name:c.name,qty:c.qty,price:c.price})), cash_tendered:cashNum, discount:disc}),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Transaction failed.'); return; }
      // Update local stock immediately
      setInventory(prev => prev ? prev.map(i => {
        const sold = cart.find(c => c.id === i.id);
        return sold ? {...i, stock: Math.max(0, i.stock - sold.qty)} : i;
      }) : prev);
      setReceipt({...json, cartSnapshot:[...cart], discount:disc});
      setCart([]); setCash(''); setDiscount('');
    } catch { setError('Network error. Please try again.'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="loading">Loading inventory...</div>;
  if (receipt)  return <Receipt receipt={receipt} onNew={() => setReceipt(null)} />;

  return (
    <div className="pos-layout">
      <div className="pos-left">
        <div className="card" style={{marginBottom:0}}>
          <div className="pos-header">
            <span className="pos-title">🛍️ Products</span>
            <span className="pos-stock-count">{inventory?.length ?? 0} items</span>
          </div>
          <input className="pos-search" type="text" placeholder="🔍  Search by name or brand..."
            value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="pos-cat-tabs">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`pos-cat-tab ${activeCategory===cat?'active':''}`}
                onClick={() => setActiveCategory(cat)}>{CAT_ICONS[cat]} {cat}</button>
            ))}
          </div>
          <div className="pos-results-info">{displayed.length} product{displayed.length!==1?'s':''}{search&&` for "${search}"`}</div>
          <div className="pos-product-grid">
            {displayed.length === 0
              ? <div className="pos-empty"><div style={{fontSize:'2rem'}}>🔍</div><p>No products found</p></div>
              : displayed.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button key={item.id}
                    className={`pos-product-card ${item.stock===0?'out-of-stock':''} ${inCart?'in-cart':''}`}
                    onClick={() => item.stock > 0 && addToCart(item)} disabled={item.stock===0}>
                    {inCart && <span className="pos-in-cart-badge">{inCart.qty}</span>}
                    <div className="pos-product-cat-icon">{CAT_ICONS[item.category]??'📦'}</div>
                    <div className="pos-product-name">{item.name}</div>
                    <div className="pos-product-brand">{item.brand}</div>
                    <div className="pos-product-footer">
                      <span className="pos-product-price">{fmt(item.retail_price)}</span>
                      <span className={`pos-product-stock ${item.stock===0?'out':item.stock<=item.reorder?'low':''}`}>
                        {item.stock===0?'✕ Out':`${item.stock} left`}
                      </span>
                    </div>
                  </button>
                );
              })
            }
          </div>
        </div>
      </div>
      <div className="pos-right">
        <Cart cart={cart} cartCount={cartCount} cash={cash} setCash={setCash}
          discount={discount} setDiscount={setDiscount} error={error} processing={processing}
          onUpdateQty={updateQty} onUpdatePrice={updatePrice}
          onRemove={id => setCart(p => p.filter(c => c.id !== id))}
          onClear={() => setCart([])} onCheckout={checkout} />
      </div>
    </div>
  );
}
