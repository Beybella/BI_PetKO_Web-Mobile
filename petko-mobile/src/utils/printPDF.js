import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_BASE } from '../config';

const fmt    = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
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

  const { uri } = await Print.printToFileAsync({ html, base64: false, fileName: `PetKO_Receipt_${new Date().toISOString().slice(0,10)}` });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
}
