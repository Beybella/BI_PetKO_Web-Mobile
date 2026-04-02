import React from 'react';
import { fmt } from './Cart';

export default function Receipt({ receipt, onNew }) {
  const subtotal = receipt.cartSnapshot.reduce((s, i) => s + i.qty * i.price, 0);
  const disc     = receipt.discount || 0;
  const txNum    = receipt.transaction_id || ('#' + String(Date.now()).slice(-6));

  const handlePrint = () => {
    const printArea = document.getElementById('receipt-print-area');
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
      <html><head><title>PetKO Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; padding: 16px; max-width: 320px; margin: 0 auto; }
        h2 { text-align: center; font-size: 1.1rem; margin: 4px 0; }
        p  { text-align: center; margin: 2px 0; font-size: 12px; color: #555; }
        hr { border: none; border-top: 1px dashed #ccc; margin: 8px 0; }
        table { width: 100%; font-size: 12px; border-collapse: collapse; }
        td { padding: 3px 0; }
        .right { text-align: right; }
        .bold  { font-weight: bold; }
        .total { font-size: 14px; font-weight: bold; }
      </style></head><body>
      ${printArea.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card receipt-card">

        {/* Success banner */}
        <div className="receipt-success-banner">
          <div style={{ fontSize: '2.2rem' }}>✅</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Transaction Complete!</div>
            <div style={{ fontSize: '.78rem', opacity: .8 }}>Transaction {txNum}</div>
          </div>
        </div>

        {/* Printable area */}
        <div id="receipt-print-area" className="receipt-body">
          <div className="receipt-shop-header">
            <div style={{ fontSize: '2rem' }}>🐾</div>
            <h2>PetKO</h2>
            <p>Your Trusted Pet Shop</p>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{receipt.date}</p>
            <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Ref: {txNum}</p>
          </div>

          <hr className="receipt-divider" />

          <table style={{ width: '100%', fontSize: '.84rem', marginBottom: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Item</th>
                <th style={{ textAlign: 'center', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ textAlign: 'right', color: 'var(--muted)', fontWeight: 600, fontSize: '.72rem', textTransform: 'uppercase' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.cartSnapshot.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '5px 0', lineHeight: 1.3 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{fmt(item.price)} each</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="receipt-divider" />

          <div className="receipt-totals">
            <div className="receipt-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {disc > 0 && (
              <div className="receipt-row" style={{ color: 'var(--green)' }}>
                <span>Discount</span><span>− {fmt(disc)}</span>
              </div>
            )}
            <div className="receipt-row receipt-total-row">
              <span>TOTAL</span><strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{fmt(receipt.total)}</strong>
            </div>
            <div className="receipt-row"><span>Cash Received</span><span>{fmt(receipt.cash_tendered)}</span></div>
            <div className="receipt-row" style={{ color: 'var(--green)', fontWeight: 700 }}>
              <span>Change</span><strong>{fmt(receipt.change)}</strong>
            </div>
          </div>

          <hr className="receipt-divider" />
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem', marginTop: 8 }}>
            🐾 Thank you for shopping at PetKO! 🐾<br />
            <span style={{ fontSize: '.72rem' }}>Come back soon!</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="receipt-actions">
          <button className="receipt-print-btn" onClick={handlePrint}>🖨️ Print Receipt</button>
          <button className="checkout-btn" onClick={onNew}>+ New Transaction</button>
        </div>
      </div>
    </div>
  );
}
