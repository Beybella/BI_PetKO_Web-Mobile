import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE } from '../config';

const fmt    = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// helper: print HTML to a named PDF then share it
async function printAndShare(html, fileName, dialogTitle) {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const dest = FileSystem.cacheDirectory + fileName + '.pdf';
  await FileSystem.copyAsync({ from: uri, to: dest });
  await Sharing.shareAsync(dest, { mimeType: 'application/pdf', dialogTitle });
}
const fmtPHP = n => 'PHP ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// -- Receipt ------------------------------------------------------------------
export async function printReceipt(receipt) {
  const subtotal = receipt.cartSnapshot.reduce((s, i) => s + i.qty * i.price, 0);
  const disc     = receipt.discount || 0;
  const txNum    = receipt.transaction_id || ('#' + String(Date.now()).slice(-6));

  const rows = receipt.cartSnapshot.map(item => `
    <tr>
      <td style="padding:6px 0;line-height:1.5">
        <span style="font-weight:700;display:block">${item.name}</span>
        <span style="font-size:11px;color:#555">x${item.qty} @ ${fmt(item.price)}</span>
      </td>
      <td style="text-align:right;font-weight:700;padding:6px 0;vertical-align:top">${fmt(item.qty * item.price)}</td>
    </tr>
  `).join('');

  const html = `
    <html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Courier New', Courier, monospace; font-size: 13px; padding: 24px; max-width: 340px; margin: 0 auto; color: #000; background: #fff; }
      .logo { display: block; max-height: 52px; max-width: 180px; margin: 0 auto 8px; }
      .sub  { text-align: center; font-size: 11px; color: #555; margin: 2px 0; }
      hr    { border: none; border-top: 1px dashed #000; margin: 10px 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th    { text-align: left; padding: 4px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border-bottom: 1px solid #000; }
      th.right { text-align: right; }
      td    { padding: 0; border: none; background: none; }
      .row  { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
      .total-big { display: flex; justify-content: space-between; padding: 6px 0; font-size: 17px; font-weight: 800; border-top: 2px solid #000; margin-top: 4px; }
      .change    { display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px; font-weight: 800; }
      .footer    { text-align: center; font-size: 11px; color: #555; margin-top: 12px; border-top: 1px dashed #000; padding-top: 10px; line-height: 1.6; }
    </style></head><body>
      <img src="${API_BASE}/logo.png" class="logo" onerror="this.style.display='none'" />
      <div class="sub">Official Receipt</div>
      <div class="sub">${receipt.date ?? new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
      <div class="sub">Ref: ${txNum}</div>
      <hr/>
      <table>
        <thead><tr><th>Item</th><th class="right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr/>
      <div class="row"><span>Subtotal</span><span><b>${fmt(subtotal)}</b></span></div>
      ${disc > 0 ? `<div class="row"><span>Discount</span><span><b>- ${fmt(disc)}</b></span></div>` : ''}
      <div class="total-big"><span>TOTAL</span><span>${fmt(receipt.total)}</span></div>
      <div class="row" style="margin-top:6px"><span>Cash</span><span><b>${fmt(receipt.cash_tendered)}</b></span></div>
      <div class="change"><span>Change</span><span><b>${fmt(receipt.change)}</b></span></div>
      <div class="footer">Thank you for shopping at PetKO!<br/>Come back soon!</div>
    </body></html>
  `;

  await printAndShare(html, `PetKO_Receipt_${new Date().toISOString().slice(0, 10)}`, 'Share Receipt');
}

// -- Sales / Analytics Report -------------------------------------------------
export async function printAnalytics(filteredMonthly, sales, inv, periodLabel = 'All Time', exportedBy = '') {
  const monthly = filteredMonthly ?? [];
  const totals  = monthly.reduce(
    (a, m) => ({ revenue: a.revenue + m.revenue, transactions: a.transactions + m.transactions, expenses: a.expenses + (m.expenses ?? 0), net: a.net + (m.net ?? 0) }),
    { revenue: 0, transactions: 0, expenses: 0, net: 0 }
  );

  // top products: prefer filtered month's data, fall back to all-time
  const topProducts = (() => {
    const src = (monthly.length === 1 ? monthly[0]?.top_products : null) ?? sales?.top_products ?? {};
    return Object.entries(src).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  })();

  const monthRows = monthly.map((m, i) => `
    <tr style="background:${i % 2 === 0 ? '#fffdf5' : '#fff'}">
      <td>${new Date(m.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}</td>
      <td style="color:#2e7d52;font-weight:700">${fmtPHP(m.revenue)}</td>
      <td style="color:#c0392b">${fmtPHP(m.expenses ?? 0)}</td>
      <td style="font-weight:700;color:${(m.net ?? 0) >= 0 ? '#2e7d52' : '#c0392b'}">${fmtPHP(m.net ?? 0)}</td>
      <td style="color:#888">${m.transactions}</td>
    </tr>
  `).join('');

  const productRows = topProducts.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#fffdf5' : '#fff'}">
      <td style="color:#aaa;text-align:center">${i + 1}</td>
      <td>${p.name}</td>
      <td style="color:#2e7d52;font-weight:700;text-align:right">${fmtPHP(p.value)}</td>
    </tr>
  `).join('');

  const html = `
    <html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 28px; color: #1c1400; background: #fff; }
      h1   { font-size: 22px; text-align: center; margin-bottom: 4px; }
      .sub { text-align: center; font-size: 11px; color: #8a7a5a; margin-bottom: 2px; }
      hr   { border: none; border-top: 1px solid #e6dcb9; margin: 14px 0; }
      .kpi-grid { display: flex; gap: 10px; margin-bottom: 20px; }
      .kpi { flex: 1; border: 1px solid #e6dcb9; border-radius: 6px; padding: 10px 12px; background: #fffdf5; }
      .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: .06em; color: #8a7a5a; margin-bottom: 4px; }
      .kpi-value { font-size: 15px; font-weight: 800; }
      h2   { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
      th   { background: #fff8d2; padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e6dcb9; }
      td   { padding: 6px 10px; border-bottom: 1px solid #f0e8cc; }
      .footer { text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #e6dcb9; padding-top: 8px; margin-top: 8px; }
    </style></head><body>
      <img src="${API_BASE}/logo.png" style="display:block;max-height:52px;max-width:180px;margin:0 auto 8px" onerror="this.style.display='none'" />
      <h1>Sales Report</h1>
      <div class="sub">Period: ${periodLabel}</div>
      <div class="sub">Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${exportedBy ? `<div class="sub">Exported by: <b>${exportedBy}</b></div>` : ''}
      <hr/>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total Sales</div><div class="kpi-value" style="color:#2e7d52">${fmtPHP(totals.revenue)}</div></div>
        <div class="kpi"><div class="kpi-label">Transactions</div><div class="kpi-value" style="color:#1a6fa8">${totals.transactions.toLocaleString()}</div></div>
        <div class="kpi"><div class="kpi-label">Total Expenses</div><div class="kpi-value" style="color:#c0392b">${fmtPHP(totals.expenses)}</div></div>
        <div class="kpi"><div class="kpi-label">Net Income</div><div class="kpi-value" style="color:${totals.net >= 0 ? '#2e7d52' : '#c0392b'}">${fmtPHP(totals.net)}</div></div>
      </div>
      <h2>Monthly Summary</h2>
      <table>
        <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net Income</th><th>Transactions</th></tr></thead>
        <tbody>${monthRows}</tbody>
      </table>
      ${topProducts.length > 0 ? `
      <h2>Top Products</h2>
      <table>
        <thead><tr><th style="text-align:center">#</th><th>Product</th><th style="text-align:right">Revenue</th></tr></thead>
        <tbody>${productRows}</tbody>
      </table>` : ''}
      <div class="footer">PetKO Business Intelligence · Confidential</div>
    </body></html>
  `;

  await printAndShare(html, `PetKO_Sales_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, 'Share Sales Report');
}

// -- Inventory Report ---------------------------------------------------------
export async function printInventory(inv, exportedBy = '') {
  if (!inv || inv.length === 0) throw new Error('No inventory data available.');

  const critical = inv.filter(i => i.stock < i.reorder).length;
  const warning  = inv.filter(i => i.stock === i.reorder).length;
  const ok       = inv.filter(i => i.stock > i.reorder).length;

  const rows = inv.map((item, i) => {
    const status     = item.stock < item.reorder ? 'Critical' : item.stock === item.reorder ? 'Warning' : 'OK';
    const statusColor = status === 'Critical' ? '#c0392b' : status === 'Warning' ? '#b46400' : '#2e7d52';
    return `
      <tr style="background:${i % 2 === 0 ? '#fffdf5' : '#fff'}">
        <td>${item.id}</td>
        <td>${item.category}</td>
        <td style="font-weight:600">${item.name}</td>
        <td>${item.brand}</td>
        <td style="text-align:right">${fmtPHP(item.unit_cost)}</td>
        <td style="text-align:right">${fmtPHP(item.retail_price)}</td>
        <td style="text-align:center">${item.stock}</td>
        <td style="text-align:center">${item.reorder}</td>
        <td style="text-align:center;font-weight:700;color:${statusColor}">${status}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; color: #1c1400; background: #fff; }
      h1   { font-size: 20px; text-align: center; margin-bottom: 4px; }
      .sub { text-align: center; font-size: 10px; color: #8a7a5a; margin-bottom: 2px; }
      hr   { border: none; border-top: 1px solid #e6dcb9; margin: 12px 0; }
      .kpi-grid { display: flex; gap: 8px; margin-bottom: 16px; }
      .kpi { flex: 1; border: 1px solid #e6dcb9; border-radius: 6px; padding: 8px 10px; background: #fffdf5; text-align: center; }
      .kpi-label { font-size: 8px; text-transform: uppercase; letter-spacing: .06em; color: #8a7a5a; margin-bottom: 3px; }
      .kpi-value { font-size: 18px; font-weight: 800; }
      table { width: 100%; border-collapse: collapse; font-size: 9px; }
      th    { background: #fff8d2; padding: 6px 8px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid #e6dcb9; }
      td    { padding: 5px 8px; border-bottom: 1px solid #f0e8cc; }
      .footer { text-align: center; font-size: 8px; color: #aaa; border-top: 1px solid #e6dcb9; padding-top: 8px; margin-top: 12px; }
    </style></head><body>
      <img src="${API_BASE}/logo.png" style="display:block;max-height:52px;max-width:180px;margin:0 auto 8px" onerror="this.style.display='none'" />
      <h1>Inventory Report</h1>
      <div class="sub">Total Items: ${inv.length}</div>
      <div class="sub">Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${exportedBy ? `<div class="sub">Exported by: <b>${exportedBy}</b></div>` : ''}
      <hr/>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Total Items</div><div class="kpi-value" style="color:#d4900a">${inv.length}</div></div>
        <div class="kpi"><div class="kpi-label">Well Stocked</div><div class="kpi-value" style="color:#2e7d52">${ok}</div></div>
        <div class="kpi"><div class="kpi-label">Warning</div><div class="kpi-value" style="color:#b46400">${warning}</div></div>
        <div class="kpi"><div class="kpi-label">Critical</div><div class="kpi-value" style="color:#c0392b">${critical}</div></div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Category</th><th>Item Name</th><th>Brand</th><th style="text-align:right">Cost</th><th style="text-align:right">Retail</th><th style="text-align:center">Stock</th><th style="text-align:center">Reorder</th><th style="text-align:center">Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">PetKO Business Intelligence · Confidential</div>
    </body></html>
  `;

  await printAndShare(html, `PetKO_Inventory_${new Date().toISOString().slice(0, 10)}`, 'Share Inventory Report');
}
