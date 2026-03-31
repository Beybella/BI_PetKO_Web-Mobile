import React from 'react';
import { fmt } from './Cart';

export default function Receipt({ receipt, onNew }) {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="card receipt">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '2.5rem' }}>🐾</div>
          <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>PetKO</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{receipt.date}</p>
          <div className="receipt-divider" />
        </div>

        <table style={{ width: '100%', fontSize: '.85rem', marginBottom: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingBottom: 6 }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {receipt.cartSnapshot.map((item, i) => (
              <tr key={i}>
                <td style={{ paddingBottom: 4 }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                <td style={{ textAlign: 'right' }}>{fmt(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider" />
        <div className="receipt-row"><span>Total</span><strong>{fmt(receipt.total)}</strong></div>
        <div className="receipt-row"><span>Cash Received</span><span>{fmt(receipt.cash_tendered)}</span></div>
        <div className="receipt-row" style={{ color: 'var(--success)' }}>
          <span>Change</span><strong>{fmt(receipt.change)}</strong>
        </div>
        <div className="receipt-divider" />
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', marginTop: 8 }}>
          Thank you for shopping at PetKO! 🐾
        </p>

        <button className="checkout-btn" style={{ marginTop: 16 }} onClick={onNew}>
          New Transaction
        </button>
      </div>
    </div>
  );
}
