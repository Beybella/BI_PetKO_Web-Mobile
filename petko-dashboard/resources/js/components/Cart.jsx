import React from 'react';

export const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function Cart({ cart, cash, setCash, error, processing, onUpdateQty, onUpdatePrice, onRemove, onClear, onCheckout }) {
  const total   = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const cashNum = parseFloat(cash) || 0;
  const change  = cashNum - total;

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <h3>🛒 Cart {cart.length > 0 && <span className="cart-count">{cart.length}</span>}</h3>

      {cart.length === 0
        ? <p style={{ color: 'var(--muted)', fontSize: '.9rem', padding: '20px 0' }}>No items added yet.</p>
        : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-sub">{item.brand} · {item.category}</div>
                </div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty - 1)}>−</button>
                  <input
                    className="qty-input"
                    type="number" min="1" max={item.stock}
                    value={item.qty}
                    onChange={e => onUpdateQty(item.id, parseInt(e.target.value) || 1)}
                  />
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, item.qty + 1)}>+</button>
                  <span style={{ margin: '0 6px', color: 'var(--muted)', fontSize: '.8rem' }}>×</span>
                  <input
                    className="price-input"
                    type="number" min="0" step="0.01"
                    value={item.price}
                    onChange={e => onUpdatePrice(item.id, e.target.value)}
                  />
                  <span className="cart-line-total">{fmt(item.qty * item.price)}</span>
                  <button className="remove-btn" onClick={() => onRemove(item.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <div className="payment-section">
        <div className="payment-row">
          <span>Subtotal</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="payment-row total-row">
          <span>TOTAL</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="payment-row" style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 600 }}>Cash Received</label>
          <input
            className="cash-input"
            type="number" min="0" step="1" placeholder="0.00"
            value={cash}
            onChange={e => setCash(e.target.value)}
          />
        </div>
        {cashNum >= total && total > 0 && (
          <div className="payment-row change-row">
            <span>Change</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(change)}</span>
          </div>
        )}
        {error && <p className="pos-error">{error}</p>}
        <button
          className="checkout-btn"
          onClick={onCheckout}
          disabled={!cart.length || processing}
        >
          {processing ? 'Processing...' : `Checkout ${cart.length > 0 ? fmt(total) : ''}`}
        </button>
        {cart.length > 0 && (
          <button className="clear-btn" onClick={onClear}>Clear Cart</button>
        )}
      </div>
    </div>
  );
}
