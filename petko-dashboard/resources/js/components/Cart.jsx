import React from 'react';
import {
  IconCart,
  IconCheck,
  IconWarning,
  IconCash
} from './IconsAll';

export const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function Cart({ cart, cartCount, cash, setCash, discount, setDiscount, error, processing, onUpdateQty, onUpdatePrice, onRemove, onClear, onCheckout }) {
  const subtotal  = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const disc      = parseFloat(discount) || 0;
  const total     = Math.max(0, subtotal - disc);
  const cashNum   = parseFloat(cash) || 0;
  const change    = cashNum - total;

  return (
    <div className="card pos-cart-card" style={{ marginBottom: 0 }}>
      {/* Cart header */}
      <div className="pos-cart-header">
        <span className="pos-cart-title"><IconCart size={20} style={{verticalAlign:'middle',marginRight:6}} /> Cart</span>
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        {cart.length > 0 && (
          <button className="clear-btn-sm" onClick={onClear}>Clear all</button>
        )}
      </div>

      {/* Items */}
      {cart.length === 0
        ? (
          <div className="cart-empty">
            <div style={{ fontSize: '2.5rem' }}><IconCart size={32} /></div>
            <p>Cart is empty</p>
            <p style={{ fontSize: '.78rem' }}>Click a product to add it</p>
          </div>
        )
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
                  <span style={{ margin: '0 4px', color: 'var(--muted)', fontSize: '.8rem' }}>×</span>
                  <input
                    className="price-input"
                    type="number" min="0" step="0.01"
                    value={item.price}
                    onChange={e => onUpdatePrice(item.id, e.target.value)}
                  />
                  <span className="cart-line-total">{fmt(item.qty * item.price)}</span>
                  <button className="remove-btn" onClick={() => onRemove(item.id)} title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Payment section */}
      <div className="payment-section">
        <div className="payment-row">
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="payment-row">
          <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconCheck size={16} /> Discount
          </label>
          <input
            className="cash-input"
            type="number" min="0" step="1" placeholder="0.00"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
          />
        </div>
        {disc > 0 && (
          <div className="payment-row" style={{ color: 'var(--green)', fontSize: '.85rem' }}>
            <span>Discount Applied</span>
            <span>− {fmt(disc)}</span>
          </div>
        )}

        <div className="payment-row total-row">
          <span>TOTAL</span>
          <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{fmt(total)}</span>
        </div>

        <div className="payment-row" style={{ marginTop: 10 }}>
          <label style={{ fontWeight: 600 }}> <IconCash size={16} /> Cash Received</label>
          <input
            className="cash-input"
            type="number" min="0" step="1" placeholder="0.00"
            value={cash}
            onChange={e => setCash(e.target.value)}
          />
        </div>

        {cashNum > 0 && cashNum >= total && total > 0 && (
          <div className="payment-row change-row">
            <span>Change</span>
            <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: '1.05rem' }}>{fmt(change)}</span>
          </div>
        )}
        {cashNum > 0 && cashNum < total && total > 0 && (
          <div className="payment-row" style={{ color: 'var(--primary)', fontSize: '.85rem' }}>
            <span>Still needed</span>
            <span style={{ fontWeight: 700 }}>{fmt(total - cashNum)}</span>
          </div>
        )}

        {error && <p className="pos-error"><IconWarning size={16} style={{marginRight:4}} /> {error}</p>}

        <button
          className="checkout-btn"
          onClick={onCheckout}
          disabled={!cart.length || processing}
        >
          {processing ? 'Processing...' : (<><IconCheck size={16} style={{marginRight:4}} /> Checkout  {cart.length > 0 ? fmt(total) : ''}</>)}
        </button>
      </div>
    </div>
  );
}
