import React, { useState, useMemo, useRef } from 'react';
import {
  IconCart,
  IconAlert,
  IconAnalytics,
  IconUser,
  IconCalendar,
  IconSearch,
  IconBox,
  IconTrophy,
  IconCheck,
  IconClose,
  IconWarning,
  IconDownload,
  MonthlySum,
  MoneySack,
  MoneyBillTrend
} from './IconsAll';

import useApi from '../hooks/useApi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#D4900A','#7B5EA7','#2E7D52','#C0392B','#E8A020','#A0522D','#059669','#8B6914'];
const fmt    = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPDF = n => 'PHP ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK   = v => v >= 1000 ? '₱' + (v / 1000).toFixed(0) + 'k' : '₱' + v;
const DOW  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// -- Custom Tooltip ------------------------------------------------------------
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#FFFDF7', border:'1.5px solid #EDE5C8', borderRadius:12, padding:'10px 14px', boxShadow:'0 4px 16px rgba(212,144,10,.1)', fontSize:'.82rem' }}>
      <div style={{ fontWeight:700, marginBottom:4, color:'#1C1400' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight:600 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { data, loading }         = useApi('/api/sales/summary');
  const { data: inventory }       = useApi('/api/inventory');
  const [month, setMonth]         = useState('all');
  const [exporting, setExporting] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const reportRef  = useRef();
  const exportRef  = useRef();

  const months = useMemo(() => data ? data.monthly.map(m => m.month) : [], [data]);

  const dailyData = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.daily).map(([date, amount]) => ({ date, amount }));
    if (month === 'all') return entries.map(e => ({ ...e, date: e.date.slice(5) }));
    return entries.filter(e => e.date.startsWith(month)).map(e => ({ date: e.date.slice(8), amount: e.amount }));
  }, [data, month]);

  const filteredMonthly = useMemo(() => {
    if (!data) return [];
    return month === 'all' ? data.monthly : data.monthly.filter(m => m.month === month);
  }, [data, month]);

  const totals = useMemo(() => {
    const zero = { revenue: 0, expenses: 0, net: 0, transactions: 0 };
    return filteredMonthly.reduce((a, m) => ({
      revenue:      a.revenue      + m.revenue,
      expenses:     a.expenses     + m.expenses,
      net:          a.net          + m.net,
      transactions: a.transactions + m.transactions,
    }), zero);
  }, [filteredMonthly]);

  const prevTotals = useMemo(() => {
    if (!data || month === 'all') return null;
    const idx = data.monthly.findIndex(m => m.month === month);
    if (idx <= 0) return null;
    const prev = data.monthly[idx - 1];
    return { revenue: prev.revenue, transactions: prev.transactions };
  }, [data, month]);

  const pct = (curr, prev) => {
    if (!prev || prev === 0) return null;
    const p = ((curr - prev) / prev * 100).toFixed(1);
    return { val: p, up: parseFloat(p) >= 0 };
  };

  const categoryData = useMemo(() => {
    if (!data) return [];
    const src = month === 'all' ? data.categories : (data.monthly.find(m => m.month === month)?.categories ?? {});
    return Object.entries(src).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [data, month]);

  const topProducts = useMemo(() => {
    if (!data) return [];
    const src = month === 'all' ? data.top_products : (data.monthly.find(m => m.month === month)?.top_products ?? {});
    return Object.entries(src).map(([name, value]) => ({ name, value }));
  }, [data, month]);

  const dowData = useMemo(() => {
    if (!data) return [];
    const buckets = Array(7).fill(0);
    Object.entries(data.daily).forEach(([date, amount]) => {
      if (month !== 'all' && !date.startsWith(month)) return;
      buckets[new Date(date).getDay()] += amount;
    });
    return DOW.map((d, i) => ({ day: d, amount: buckets[i] }));
  }, [data, month]);

  const avgDaily      = dailyData.length ? totals.revenue / dailyData.length : 0;
  const topProductName = topProducts[0]?.name ?? '—';
  const lowStockItems = useMemo(() => inventory ? inventory.filter(i => i.stock < i.reorder) : [], [inventory]);

  const selectedLabel = month === 'all'
    ? 'All Time'
    : new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });

  // -- PDF: Sales Report ------------------------------------------------------
  const exportSalesPDF = async () => {
    setExporting('sales'); setShowExportMenu(false);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const BROWN  = [28,  20,  0];
      const MUTED  = [140, 124, 88];
      const BORDER = [230, 220, 185];
      const YELLOW = [255, 248, 210];
      const GREEN  = [46,  125, 82];
      const RED    = [192, 57,  43];

      // ── Logo centered ──
      let y = 14;
      try {
        const img = new Image(); img.src = '/logo.png';
        await new Promise(r => { img.onload = r; img.onerror = r; });
        const logoH = 18; const logoW = logoH * (img.naturalWidth / img.naturalHeight);
        doc.addImage(img, 'PNG', (W - logoW) / 2, y, logoW, logoH);
        y += logoH + 4;
      } catch (_) { y += 4; }

      // ── Title ──
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...BROWN);
      doc.text('Sales Report', W / 2, y, { align: 'center' });
      y += 7;

      // ── Period & Generated on separate lines ──
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text(`Period: ${selectedLabel}`, W / 2, y, { align: 'center' });
      y += 5;
      doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}`, W / 2, y, { align: 'center' });
      y += 9;

      // ── Divider ──
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.5);
      doc.line(14, y, W - 14, y);
      y += 8;

      // ── KPI cards — evenly spaced, text centered ──
      const kpis = [
        { label: 'Total Sales',     value: fmtPDF(totals.revenue) },
        { label: 'Transactions',    value: totals.transactions.toLocaleString() },
        { label: 'Avg Daily Sales', value: fmtPDF(avgDaily) },
        { label: 'Top Product',     value: topProductName },
      ];
      const cardW = (W - 28 - 9) / 4; // full usable width ÷ 4 cards with 3 gaps of 3mm
      kpis.forEach((k, i) => {
        const x = 14 + i * (cardW + 3);
        const cx = x + cardW / 2;
        doc.setFillColor(252, 250, 245); doc.setDrawColor(...BORDER);
        doc.roundedRect(x, y, cardW, 22, 2, 2, 'FD');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...MUTED);
        doc.text(k.label.toUpperCase(), cx, y + 7, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...BROWN);
        doc.setFontSize(9);
        doc.text(String(k.value).slice(0, 22), cx, y + 16, { align: 'center' });
      });
      y += 30;

      // ── Monthly Summary ──
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...BROWN);
      doc.text('Monthly Summary', 14, y); y += 6;

      const mHeaders = ['Month', 'Revenue', 'Expenses', 'Net Income', 'Transactions'];
      const mColW    = [38, 38, 38, 38, 30];
      doc.setFillColor(...YELLOW); doc.setDrawColor(...BORDER);
      doc.rect(14, y, W - 28, 8, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BROWN);
      let cx = 14;
      mHeaders.forEach((h, i) => { doc.text(h, cx + mColW[i]/2, y + 5.5, { align: 'center' }); cx += mColW[i]; });
      y += 8;

      filteredMonthly.forEach((m, ri) => {
        if (ri % 2 === 0) { doc.setFillColor(252, 250, 245); doc.rect(14, y, W - 28, 7, 'F'); }
        doc.setDrawColor(...BORDER); doc.line(14, y + 7, W - 14, y + 7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); cx = 14;
        const row = [
          new Date(m.month + '-02').toLocaleString('default', { month: 'short', year: 'numeric' }),
          fmtPDF(m.revenue), fmtPDF(m.expenses), fmtPDF(m.net), m.transactions.toString()
        ];
        row.forEach((v, i) => {
          if (i === 1) doc.setTextColor(...GREEN);
          else if (i === 2) doc.setTextColor(...RED);
          else if (i === 3) doc.setTextColor(...(m.net >= 0 ? GREEN : RED));
          else doc.setTextColor(...BROWN);
          doc.text(v, cx + mColW[i]/2, y + 5, { align: 'center' }); cx += mColW[i];
        });
        y += 7;
      });
      y += 10;

      // ── Top Products ──
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...BROWN);
      doc.text('Top Products', 14, y); y += 6;

      doc.setFillColor(...YELLOW); doc.setDrawColor(...BORDER);
      doc.rect(14, y, W - 28, 8, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BROWN);
      doc.text('#',       21,     y + 5.5, { align: 'center' });
      doc.text('Product', W / 2,  y + 5.5, { align: 'center' });
      doc.text('Revenue', W - 14, y + 5.5, { align: 'right' });
      y += 8;

      topProducts.slice(0, 10).forEach((p, i) => {
        if (y > H - 20) {
          doc.setDrawColor(...BORDER); doc.line(14, H - 12, W - 14, H - 12);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
          doc.text('PetKO Business Intelligence  ·  Confidential', 14, H - 7);
          doc.addPage(); y = 14;
          // redraw top products header on new page
          doc.setFillColor(...YELLOW); doc.setDrawColor(...BORDER);
          doc.rect(14, y, W - 28, 8, 'FD');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...BROWN);
          doc.text('#',       21,     y + 5.5, { align: 'center' });
          doc.text('Product', W / 2,  y + 5.5, { align: 'center' });
          doc.text('Revenue', W - 14, y + 5.5, { align: 'right' });
          y += 8;
        }
        if (i % 2 === 0) { doc.setFillColor(252, 250, 245); doc.rect(14, y, W - 28, 7, 'F'); }
        doc.setDrawColor(...BORDER); doc.line(14, y + 7, W - 14, y + 7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
        doc.text(String(i + 1), 21, y + 5, { align: 'center' });
        doc.setTextColor(...BROWN);
        doc.text(p.name.length > 44 ? p.name.slice(0, 44) + '...' : p.name, W / 2, y + 5, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN);
        doc.text(fmtPDF(p.value), W - 14, y + 5, { align: 'right' });
        y += 7;
      });

      // ── Footer ──
      doc.setDrawColor(...BORDER); doc.line(14, H - 12, W - 14, H - 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text('PetKO Business Intelligence  ·  Confidential', 14, H - 7);
      doc.text('Page 1', W - 14, H - 7, { align: 'right' });

      doc.save(`PetKO_Sales_${month}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally { setExporting(''); }
  };

  // -- PDF: Inventory Report --------------------------------------------------
  const exportInventoryPDF = async () => {
    if (!inventory) { alert('Inventory data not loaded yet. Please wait.'); return; }
    setExporting('inventory'); setShowExportMenu(false);
    await new Promise(r => setTimeout(r, 50));
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const BROWN  = [28,   20,   0];
      const MUTED  = [140, 124,  88];
      const BORDER = [230, 220, 185];
      const YELLOW = [255, 248, 210];
      const GREEN  = [46,  125,  82];
      const RED    = [192,  57,  43];
      const WARN   = [180, 100,   0];
      const AMBER  = [212, 144,  10];

      // ── Logo centered ──
      let y = 14;
      try {
        const img = new Image(); img.src = '/logo.png';
        await new Promise(r => { img.onload = r; img.onerror = r; });
        const logoH = 18; const logoW = logoH * (img.naturalWidth / img.naturalHeight);
        doc.addImage(img, 'PNG', (W - logoW) / 2, y, logoW, logoH);
        y += logoH + 4;
      } catch (_) { y += 4; }

      // ── Title ──
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...BROWN);
      doc.text('Inventory Report', W / 2, y, { align: 'center' });
      y += 7;

      // ── Total items & Generated on separate lines ──
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
      doc.text(`Total Items: ${inventory.length}`, W / 2, y, { align: 'center' });
      y += 5;
      doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}`, W / 2, y, { align: 'center' });
      y += 9;

      // ── Divider ──
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.5);
      doc.line(14, y, W - 14, y);
      y += 8;

      // ── Summary cards — evenly spaced, text centered ──
      const critical = inventory.filter(i => i.stock < i.reorder).length;
      const warning  = inventory.filter(i => i.stock === i.reorder).length;
      const ok       = inventory.filter(i => i.stock > i.reorder).length;
      const summaries = [
        { label: 'Total Items',  value: inventory.length, accent: AMBER },
        { label: 'Well Stocked', value: ok,               accent: GREEN },
        { label: 'Warning',      value: warning,          accent: WARN  },
        { label: 'Critical',     value: critical,         accent: RED   },
      ];
      const sCardW = (W - 28 - 9) / 4; // 4 cards, 3 gaps of 3mm
      summaries.forEach((s, i) => {
        const x = 14 + i * (sCardW + 3);
        const cx = x + sCardW / 2;
        doc.setFillColor(252, 250, 245); doc.setDrawColor(...BORDER);
        doc.roundedRect(x, y, sCardW, 22, 2, 2, 'FD');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...MUTED);
        doc.text(s.label.toUpperCase(), cx, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
        doc.setTextColor(s.accent[0], s.accent[1], s.accent[2]);
        doc.text(String(s.value), cx, y + 18, { align: 'center' });
      });
      y += 30;

      // section label
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...BROWN);
      doc.text('Stock List', 14, y); y += 6;

      // table
      const headers = ['ID', 'Category', 'Item Name', 'Brand', 'Cost', 'Retail', 'Stock', 'Reorder', 'Status'];
      const colW    = [20, 28, 64, 28, 22, 22, 16, 18, 22];
      let pageNum = 1;

      const drawHeader = () => {
        doc.setFillColor(...YELLOW); doc.setDrawColor(...BORDER);
        doc.rect(14, y, W - 28, 7.5, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...BROWN);
        let cx = 14;
        headers.forEach((h, i) => {
          doc.text(h, cx + colW[i] / 2, y + 5, { align: 'center' });
          cx += colW[i];
        });
        y += 7.5;
      };
      drawHeader();

      inventory.forEach((item, ri) => {
        if (y > H - 18) {
          doc.setDrawColor(...BORDER); doc.line(14, H - 12, W - 14, H - 12);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
          doc.text('PetKO Business Intelligence  ·  Confidential', 14, H - 7);
          doc.text(`Page ${pageNum}`, W - 14, H - 7, { align: 'right' });
          doc.addPage(); pageNum++; y = 10;
          y += 5; drawHeader();
        }
        const status = item.stock < item.reorder ? 'Critical' : item.stock === item.reorder ? 'Warning' : 'OK';
        if (ri % 2 === 0) { doc.setFillColor(252, 250, 245); doc.rect(14, y, W - 28, 6.5, 'F'); }
        doc.setDrawColor(...BORDER); doc.line(14, y + 6.5, W - 14, y + 6.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...BROWN);
        let cx = 14;
        const p = n => 'PHP ' + Number(n).toFixed(2);
        const row = [
          item.id, item.category,
          item.name.length > 32 ? item.name.slice(0, 32) + '...' : item.name,
          item.brand.length > 13 ? item.brand.slice(0, 13) + '...' : item.brand,
          p(item.unit_cost), p(item.retail_price),
          String(item.stock), String(item.reorder), status
        ];
        row.forEach((v, i) => {
          if (i === 8) {
            const sc = status === 'Critical' ? RED : status === 'Warning' ? WARN : GREEN;
            doc.setTextColor(...sc); doc.setFont('helvetica', 'bold');
          } else { doc.setTextColor(...BROWN); doc.setFont('helvetica', 'normal'); }
          doc.text(v, cx + colW[i] / 2, y + 4.5, { align: 'center' }); cx += colW[i];
        });
        y += 6.5;
      });

      // footer
      doc.setDrawColor(...BORDER); doc.line(14, H - 12, W - 14, H - 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text('PetKO Business Intelligence  ·  Confidential', 14, H - 7);
      doc.text(`Page ${pageNum}`, W - 14, H - 7, { align: 'right' });

      doc.save(`PetKO_Inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error('Inventory PDF error:', e);
      alert('Export failed: ' + e.message);
    } finally { setExporting(''); }
  };
  if (loading) return (
    <div className="analytics-loading">
      <div className="loading-spinner">🐾</div>
      <p>Loading analytics...</p>
    </div>
  );

  return (
    <div ref={reportRef} className="analytics-wrap">

      {/* -- Header row -- */}
      <div className="dash-header-row">
        <div>
          <div className="analytics-period-badge">{selectedLabel} Performance</div>
          <div className="month-filter" style={{ marginTop: 10 }}>
            <button className={month === 'all' ? 'active' : ''} onClick={() => setMonth('all')}>All</button>
            {months.map(m => (
              <button key={m} className={month === m ? 'active' : ''} onClick={() => setMonth(m)}>
                {new Date(m + '-02').toLocaleString('default', { month: 'short', year: 'numeric' })}
              </button>
            ))}
          </div>
        </div>

        {/* Export dropdown */}
        <div className="export-dropdown-wrap" ref={exportRef}>
          <button
            className="export-btn"
            onClick={() => setShowExportMenu(v => !v)}
            disabled={!!exporting}
          >
            {exporting ? (
              <>
                <IconAnalytics size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Exporting {exporting}...
              </>
            ) : (
              <>
                <IconDownload size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Export PDF
              </>
            )}
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button className="export-menu-item" onClick={exportSalesPDF}>
                <span className="export-menu-icon"><IconAnalytics size={18} /></span>
                <div>
                  <div className="export-menu-label">Sales Report</div>
                  <div className="export-menu-sub">KPIs, monthly summary & top products</div>
                </div>
              </button>
              <button className="export-menu-item" onClick={exportInventoryPDF}>
                <span className="export-menu-icon"><IconBox size={18} /></span>
                <div>
                  <div className="export-menu-label">Inventory Report</div>
                  <div className="export-menu-sub">Full stock list with status</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* -- KPI Cards -- */}
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <KpiCard
          icon={<MoneySack size={24} />} label={`Total Sales${month !== 'all' ? ` (${new Date(month+'-02').toLocaleString('default',{month:'short'})})` : ''}`}
          value={fmt(totals.revenue)}
          delta={pct(totals.revenue, prevTotals?.revenue)}
          sub="vs last month" color="red" />
        <KpiCard
          icon={<IconCart size={24} />} label="Total Transactions"
          value={totals.transactions.toLocaleString()}
          delta={pct(totals.transactions, prevTotals?.transactions)}
          sub="vs last month" color="green" />
        <KpiCard
          icon={<MoneyBillTrend size={24} />} label="Avg Daily Sales"
          value={fmt(avgDaily)}
          sub={`across ${dailyData.length} days`} color="yellow" />
        <KpiCard
          icon={<IconTrophy size={24} />} label="Top Product"
          value={topProductName}
          sub={topProducts[0] ? fmt(topProducts[0].value) + ' revenue' : '—'}
          color="blue" smallValue />
      </div>

      {/* -- Daily Sales Area Chart -- */}
      <div className="card analytics-chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-card-header">
          <div>
            <div className="chart-card-title"><MoneyBillTrend size={18} style={{marginRight:6}} /> Daily Sales Trend</div>
            <div className="chart-card-sub">{dailyData.length} data points</div>
          </div>
          <div className="chart-total-badge">{fmt(totals.revenue)}</div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#D4900A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D4900A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE5C8" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill:'#8A7A5A' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill:'#8A7A5A' }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="amount" name="Sales" stroke="#D4900A" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ r:3, fill:'#D4900A', strokeWidth:0 }} activeDot={{ r:5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* -- Category + DoW -- */}
      <div className="analytics-2col" style={{ marginBottom: 20 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="chart-card-header">
            <div className="chart-card-title"><IconBox size={18} style={{marginRight:6}} /> Sales by Category</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
              <Legend iconType="circle" iconSize={10} formatter={(v) => {
                const item = categoryData.find(d => d.name === v);
                const total = categoryData.reduce((s, d) => s + d.value, 0);
                const p = total > 0 && item ? ((item.value / total) * 100).toFixed(0) : 0;
                return `${v} (${p}%)`;
              }} wrapperStyle={{ fontSize: '.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="chart-card-header">
            <div className="chart-card-title"><IconCalendar size={18} style={{marginRight:6}} /> Sales by Day of Week</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dowData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE5C8" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill:'#8A7A5A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill:'#8A7A5A' }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" name="Sales" radius={[8,8,0,0]} maxBarSize={52}>
                {dowData.map((entry, i) => {
                  const max = Math.max(...dowData.map(d => d.amount));
                  return <Cell key={i} fill={entry.amount === max ? '#D4900A' : '#F5D98A'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* -- Top Products + Monthly Summary -- */}
      <div className="analytics-2col" style={{ marginBottom: 20 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="chart-card-header">
            <div className="chart-card-title"><IconTrophy size={18} style={{marginRight:6}} /> Top Products</div>
            <div className="chart-card-sub">{topProducts.length} products</div>
          </div>
          <div style={{ marginTop: 8 }}>
            {topProducts.slice(0, 8).map((p, i) => {
              const max = topProducts[0]?.value || 1;
              const barPct = (p.value / max * 100).toFixed(0);
              return (
                <div key={i} className="top-product-row">
                  <span className="top-product-rank">{i + 1}</span>
                  <div className="top-product-info">
                    <div className="top-product-name">{p.name}</div>
                    <div className="top-product-bar-wrap">
                      <div className="top-product-bar" style={{ width: `${barPct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                  <span className="top-product-value">{fmt(p.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="chart-card-header">
            <div className="chart-card-title"><MonthlySum size={18} style={{marginRight:6}} /> Monthly Summary</div>
          </div>
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table>
              <thead>
                <tr>
                  <th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Txns</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthly.map(m => (
                  <tr key={m.month}>
                    <td style={{ fontWeight: 600 }}>{new Date(m.month+'-02').toLocaleString('default',{month:'short',year:'numeric'})}</td>
                    <td style={{ color:'var(--green)', fontWeight:700 }}>{fmt(m.revenue)}</td>
                    <td style={{ color:'var(--primary)' }}>{fmt(m.expenses)}</td>
                    <td style={{ fontWeight:700, color: m.net >= 0 ? 'var(--green)' : 'var(--primary)' }}>{fmt(m.net)}</td>
                    <td style={{ color:'var(--muted)' }}>{m.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* -- Low Stock Alert -- */}
      {lowStockItems.length > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <span className="ls-alert-icon"><IconAlert size={15} /></span>
            <span style={{fontWeight:700,fontSize:'.92rem',color:'var(--text)'}}>Low Stock Alerts</span>
            <span className="ls-status-badge ls-status-critical" style={{marginLeft:4}}>
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need reordering
            </span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',minWidth:480,borderCollapse:'collapse',fontSize:'.84rem'}}>
              <thead>
                <tr>
                  <th style={{padding:'8px 12px',textAlign:'left',background:'var(--bg)',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)',fontWeight:600}}>Item</th>
                  <th style={{padding:'8px 12px',textAlign:'left',background:'var(--bg)',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)',fontWeight:600}}>Category</th>
                  <th style={{padding:'8px 12px',textAlign:'center',background:'var(--bg)',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)',fontWeight:600}}>Current Stock</th>
                  <th style={{padding:'8px 12px',textAlign:'center',background:'var(--bg)',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)',fontWeight:600}}>Reorder Level</th>
                  <th style={{padding:'8px 12px',textAlign:'center',background:'var(--bg)',fontSize:'.7rem',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--muted)',fontWeight:600}}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <LowStockRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function LowStockRow({ item }) {
  let status = 'OK', label = 'OK';
  if (item.stock < item.reorder)       { status = 'Critical'; label = 'Critical'; }
  else if (item.stock === item.reorder) { status = 'Warning';  label = 'Warning';  }
  const badgeClass = status === 'Critical' ? 'ls-status-critical' : status === 'Warning' ? 'ls-status-warning' : 'ls-status-ok';
  return (
    <tr className="ls-row">
      <td style={{padding:'10px 12px',fontWeight:600,color:'var(--text)'}}>{item.name}</td>
      <td style={{padding:'10px 12px',color:'var(--muted)'}}>{item.category}</td>
      <td style={{padding:'10px 12px',textAlign:'center',fontWeight:700,color: status==='Critical' ? 'var(--danger)' : 'var(--text)'}}>{item.stock}</td>
      <td style={{padding:'10px 12px',textAlign:'center',color:'var(--muted)'}}>{item.reorder}</td>
      <td style={{padding:'10px 12px',textAlign:'center'}}>
        <span className={`ls-status-badge ${badgeClass}`}>{label}</span>
      </td>
    </tr>
  );
}

// -- KPI Card ------------------------------------------------------------------
function KpiCard({ icon, label, value, delta, sub, color, smallValue }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${smallValue ? 'stat-value-sm' : ''}`}>{value}</div>
      {delta
        ? <div className="stat-delta" style={{ color: delta.up ? 'var(--green)' : 'var(--primary)' }}>
            {delta.up ? '▲' : '▼'} {Math.abs(delta.val)}% {sub}
          </div>
        : <div className="stat-sub">{sub}</div>
      }
    </div>
  );
}
