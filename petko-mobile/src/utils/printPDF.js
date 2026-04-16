import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ── Receipt PDF ──────────────────────────────────────────────────────────────
export async function printReceipt(receipt) {
  const subtotal = receipt.cartSnapshot.reduce((s, i) => s + i.qty * i.price, 0);
  const disc     = receipt.discount || 0;
  const txNum    = receipt.transaction_id || ('#' + String(Date.now()).slice(-6));

  const rows = receipt.cartSnapshot.map(item => `
    <tr>
      <td style="padding:5px 0;line-height:1.4">
        <span style="font-weight:600;display:block">${item.name}</span>
        <span style="font-size:11px;color:#444;display:block">${fmt(item.price)} each</span>
      </td>
      <td style="text-align:center;font-weight:600;padding:5px 4px;vertical-align:top">${item.qty}</td>
      <td style="text-align:right;font-weight:600;padding:5px 0;vertical-align:top">${fmt(item.qty * item.price)}</td>
    </tr>
  `).join('');

  const html = `
    <html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Courier New', Courier, monospace;
        font-size: 13px;
        padding: 20px;
        max-width: 320px;
        margin: 0 auto;
        color: #1a1a2e;
      }
      .center { text-align: center; }
      .paw    { text-align: center; margin-bottom: 6px; }
      h2      { text-align: center; font-size: 18px; font-weight: 800; margin: 4px 0 2px; }
      .sub    { text-align: center; font-size: 12px; color: #555; margin: 2px 0; }
      .ref    { text-align: center; font-size: 11px; color: #4e4e4eff; margin: 2px 0; }
      hr      { border: none; border-top: 1px dashed #000000ff; margin: 10px 0; }
      table   { width: 100%; border-collapse: collapse; font-size: 12px; }
      th      { text-align: left; padding: 4px 0; color: #434343ff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      th.right { text-align: right; }
      th.center { text-align: center; }
      .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
      .total-big  { display: flex; justify-content: space-between; padding: 6px 0; font-size: 16px; font-weight: 800; }
      .total-big span:last-child { color: #F24C4C; }
      .change-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; font-weight: 700; color: #1a7a3a; }
      .discount   { color: #04B94D; }
      .footer     { text-align: center; font-size: 11px; color: #0b0b0bff; margin-top: 10px; line-height: 1.6; }
    </style></head><body>

      <div class="paw">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="40" height="40" fill="#000000ff">
          <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
        </svg>
      </div>
      <h2>PetKO</h2>
      <div class="sub">Your Trusted Pet Shop</div>
      <div class="ref">${receipt.date ?? new Date().toLocaleDateString('en-PH')}</div>
      <div class="ref">Ref: ${txNum}</div>

      <hr/>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="center">Qty</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <hr/>

      <div class="totals-row"><span>Subtotal:</span><span><b>${fmt(subtotal)}</b></span></div>
      ${disc > 0 ? `<div class="totals-row discount"><span>Discount:</span><span><b>− ${fmt(disc)}</b></span></div>` : ''}
      <div class="total-big"><span>TOTAL:</span><span>${fmt(receipt.total)}</span></div>
      <div class="totals-row"><span>Cash Received:</span><span><b>${fmt(receipt.cash_tendered)}</b></span></div>
      <div class="change-row"><span>Change:</span><span><b>${fmt(receipt.change)}</b></span></div>

      <hr/>

      <div class="footer">
        Thank you for shopping at PetKO!<br/>
        Come back soon!
      </div>

    </body></html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
}

// ── Analytics PDF ────────────────────────────────────────────────────────────
export async function printAnalytics(sales, inventory, label) {
  const totals = sales?.monthly?.reduce(
    (a, m) => ({ revenue: a.revenue + m.revenue, expenses: a.expenses + m.expenses, transactions: a.transactions + m.transactions, net: a.net + m.net }),
    { revenue: 0, expenses: 0, transactions: 0, net: 0 }
  ) ?? { revenue: 0, expenses: 0, transactions: 0, net: 0 };

  const monthRows = (sales?.monthly ?? []).map(m => `
    <tr>
      <td>${new Date(m.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
      <td style="color:#04B94D;text-align:right">${fmt(m.revenue)}</td>
      <td style="color:#F24C4C;text-align:right">${fmt(m.expenses)}</td>
      <td style="font-weight:bold;text-align:right;color:${m.net >= 0 ? '#04B94D' : '#F24C4C'}">${fmt(m.net)}</td>
      <td style="text-align:center">${m.transactions}</td>
    </tr>
  `).join('');

  const topProducts = Object.entries(sales?.top_products ?? {})
    .sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topRows = topProducts.map(([name, value], i) => `
    <tr>
      <td style="color:#7a7a9a;text-align:center">${i + 1}</td>
      <td>${name}</td>
      <td style="text-align:right;color:#04B94D;font-weight:bold">${fmt(value)}</td>
    </tr>
  `).join('');

  const lowStock = (inventory ?? []).filter(i => i.stock < i.reorder);
  const lowRows = lowStock.slice(0, 10).map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.category}</td>
      <td style="text-align:center;color:#F24C4C;font-weight:bold">${i.stock}</td>
      <td style="text-align:center">${i.reorder}</td>
    </tr>
  `).join('');

  const html = `
    <html><head><style>
      body { font-family: Arial, sans-serif; padding: 24px; }
      h1 { color: #F24C4C; font-size: 24px; margin-bottom: 4px; }
      .period { color: #7a7a9a; font-size: 13px; margin-bottom: 20px; }
      .kpi-grid { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
      .kpi { background: #FDF8F0; border-radius: 12px; padding: 14px 18px; flex: 1; min-width: 120px; border-top: 4px solid #F24C4C; }
      .kpi.green { border-top-color: #1f8648ff; }
      .kpi.blue  { border-top-color: #2699F7; }
      .kpi-label { font-size: 10px; text-transform: uppercase; color: #7a7a9a; letter-spacing: 0.5px; }
      .kpi-value { font-size: 18px; font-weight: bold; margin-top: 4px; }
      h2 { font-size: 15px; color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #f0e8d8; padding-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
      th { background: #FDF8F0; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; color: #7a7a9a; }
      td { padding: 8px 10px; border-bottom: 1px solid #f0e8d8; }
      .footer { text-align: center; color: #aaa; font-size: 11px; margin-top: 24px; }
    </style></head><body>
      <h1>🐾 PetKO — Analytics Report</h1>
      <div class="period">Period: ${label} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-PH')}</div>

      <div class="kpi-grid">
        <div class="kpi green"><div class="kpi-label">Total Sales</div><div class="kpi-value">${fmt(totals.revenue)}</div></div>
        <div class="kpi blue"><div class="kpi-label">Transactions</div><div class="kpi-value">${totals.transactions}</div></div>
        <div class="kpi"><div class="kpi-label">Expenses</div><div class="kpi-value">${fmt(totals.expenses)}</div></div>
        <div class="kpi ${totals.net >= 0 ? 'green' : ''}"><div class="kpi-label">Net Income</div><div class="kpi-value">${fmt(totals.net)}</div></div>
      </div>

      <h2>Monthly Summary</h2>
      <table>
        <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Txns</th></tr></thead>
        <tbody>${monthRows}</tbody>
      </table>

      <h2>Top 10 Products</h2>
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Revenue</th></tr></thead>
        <tbody>${topRows}</tbody>
      </table>

      ${lowStock.length > 0 ? `
      <h2>Low Stock Alert (${lowStock.length} items)</h2>
      <table>
        <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Reorder</th></tr></thead>
        <tbody>${lowRows}</tbody>
      </table>` : ''}

      <div class="footer">PetKO Business Intelligence &nbsp;•&nbsp; Confidential</div>
    </body></html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Analytics Report' });
}
