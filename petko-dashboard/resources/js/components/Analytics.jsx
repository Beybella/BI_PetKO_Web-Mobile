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
  IconDownload
} from './IconsAll';
import useApi from '../hooks/useApi';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#F24C4C','#2699F7','#04B94D','#F6E04B','#ff8c42','#a855f7','#06b6d4','#10b981'];
const fmt    = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPDF = n => 'PHP ' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK   = v => v >= 1000 ? '₱' + (v / 1000).toFixed(0) + 'k' : '₱' + v;
const DOW  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1.5px solid #f0e8d8', borderRadius:12, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,.1)', fontSize:'.82rem' }}>
      <div style={{ fontWeight:700, marginBottom:4, color:'#1a1a2e' }}>{label}</div>
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

  // ── PDF: Sales Report ──────────────────────────────────────────────────────
  const exportSalesPDF = async () => {
    setExporting('sales'); setShowExportMenu(false);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      let y = 0;

      // Header
      doc.setFillColor(242, 76, 76);
      doc.rect(0, 0, W, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('PetKO — Sales Report', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${selectedLabel}   |   Generated: ${new Date().toLocaleDateString('en-PH')}`, 14, 22);
      y = 36;

      // KPI row
      const kpis = [
        { label: 'Total Sales',       value: fmtPDF(totals.revenue) },
        { label: 'Transactions',      value: totals.transactions.toLocaleString() },
        { label: 'Avg Daily Sales',   value: fmtPDF(avgDaily) },
        { label: 'Top Product',       value: topProductName },
      ];
      doc.setFontSize(8); doc.setTextColor(120, 120, 140);
      kpis.forEach((k, i) => {
        const x = 14 + i * 46;
        doc.setFillColor(253, 248, 240);
        doc.roundedRect(x, y, 44, 18, 3, 3, 'F');
        doc.setFont('helvetica', 'normal'); doc.setTextColor(120,120,140);
        doc.text(k.label.toUpperCase(), x + 3, y + 6);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 46);
        doc.setFontSize(k.label === 'Top Product' ? 7 : 9);
        doc.text(k.value, x + 3, y + 14);
        doc.setFontSize(8);
      });
      y += 26;

      // Monthly summary table
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(26,26,46);
      doc.text('Monthly Summary', 14, y); y += 6;
      const mHeaders = ['Month', 'Revenue', 'Expenses', 'Net Income', 'Transactions'];
      const mColW    = [38, 38, 38, 38, 30];
      doc.setFillColor(242, 76, 76);
      doc.rect(14, y, W - 28, 8, 'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
      let cx = 14;
      mHeaders.forEach((h, i) => { doc.text(h, cx + 2, y + 5.5); cx += mColW[i]; });
      y += 8;
      filteredMonthly.forEach((m, ri) => {
        if (ri % 2 === 0) { doc.setFillColor(253,248,240); doc.rect(14, y, W-28, 7, 'F'); }
        doc.setTextColor(26,26,46); doc.setFont('helvetica','normal'); doc.setFontSize(8);
        cx = 14;
        const row = [
          new Date(m.month+'-02').toLocaleString('default',{month:'short',year:'numeric'}),
          fmtPDF(m.revenue), fmtPDF(m.expenses), fmtPDF(m.net), m.transactions.toString()
        ];
        row.forEach((v, i) => { doc.text(v, cx + 2, y + 5); cx += mColW[i]; });
        y += 7;
      });
      y += 8;

      // Top products table
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(26,26,46);
      doc.text('Top Products', 14, y); y += 6;
      doc.setFillColor(38, 153, 247);
      doc.rect(14, y, W-28, 8, 'F');
      doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
      doc.text('#', 16, y+5.5); doc.text('Product', 24, y+5.5); doc.text('Revenue', W-42, y+5.5);
      y += 8;
      topProducts.slice(0,10).forEach((p, i) => {
        if (i % 2 === 0) { doc.setFillColor(240,248,255); doc.rect(14, y, W-28, 7, 'F'); }
        doc.setTextColor(26,26,46); doc.setFont('helvetica','normal'); doc.setFontSize(8);
        doc.text(String(i+1), 16, y+5);
        doc.text(p.name.length > 40 ? p.name.slice(0,40)+'...' : p.name, 24, y+5);
        doc.text(fmtPDF(p.value), W-42, y+5);
        y += 7;
      });

      // Footer
      doc.setFontSize(7); doc.setTextColor(160,160,180);
      doc.text('PetKO Business Intelligence  •  Confidential', 14, 290);
      doc.text(`Page 1`, W-20, 290);

      doc.save(`PetKO_Sales_${month}_${new Date().toISOString().slice(0,10)}.pdf`);
    } finally { setExporting(''); }
  };

  // ── PDF: Inventory Report ──────────────────────────────────────────────────
  const exportInventoryPDF = async () => {
    if (!inventory) { alert('Inventory data not loaded yet. Please wait.'); return; }
    setExporting('inventory'); setShowExportMenu(false);
    await new Promise(r => setTimeout(r, 50));
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        let y = 0;

        // Header
        doc.setFillColor(4, 185, 77);
        doc.rect(0, 0, W, 28, 'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(18); doc.setFont('helvetica','bold');
        doc.text('PetKO - Inventory Report', 14, 12);
        doc.setFontSize(9); doc.setFont('helvetica','normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('en-PH')}   |   Total Items: ${inventory.length}`, 14, 22);
        y = 36;

        // Summary row
        const critical = inventory.filter(i => i.stock < i.reorder).length;
        const warning  = inventory.filter(i => i.stock === i.reorder).length;
        const ok       = inventory.filter(i => i.stock > i.reorder).length;
        const summaries = [
          { label: 'Total Items',  value: inventory.length, color: [38,153,247] },
          { label: 'Well Stocked', value: ok,               color: [4,185,77] },
          { label: 'Warning',      value: warning,          color: [200,150,0] },
          { label: 'Critical',     value: critical,         color: [242,76,76] },
        ];
        summaries.forEach((s, i) => {
          const x = 14 + i * 68;
          doc.setFillColor(...s.color);
          doc.roundedRect(x, y, 64, 16, 3, 3, 'F');
          doc.setTextColor(255,255,255); doc.setFont('helvetica','normal'); doc.setFontSize(7);
          doc.text(s.label.toUpperCase(), x+3, y+6);
          doc.setFont('helvetica','bold'); doc.setFontSize(12);
          doc.text(String(s.value), x+3, y+13);
        });
        y += 24;

        // Table header helper
        const headers = ['ID','Category','Item Name','Brand','Cost','Retail','Stock','Reorder','Status'];
        const colW    = [20, 28, 62, 28, 20, 20, 16, 18, 20];
        const drawTableHeader = () => {
          doc.setFillColor(4,185,77);
          doc.rect(14, y, W-28, 8, 'F');
          doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
          let cx = 14;
          headers.forEach((h, i) => { doc.text(h, cx+1, y+5.5); cx += colW[i]; });
          y += 8;
        };
        drawTableHeader();

        inventory.forEach((item, ri) => {
          if (y > 185) { doc.addPage(); y = 14; drawTableHeader(); }
          const status = item.stock < item.reorder ? 'Critical' : item.stock === item.reorder ? 'Warning' : 'OK';
          if (ri % 2 === 0) { doc.setFillColor(240,255,248); doc.rect(14, y, W-28, 6.5, 'F'); }
          doc.setTextColor(26,26,46); doc.setFont('helvetica','normal'); doc.setFontSize(7);
          let cx = 14;
          const p = (n) => 'PHP ' + Number(n).toFixed(2);
          const row = [
            item.id, item.category,
            item.name.length > 30 ? item.name.slice(0,30)+'...' : item.name,
            item.brand.length > 12 ? item.brand.slice(0,12)+'...' : item.brand,
            p(item.unit_cost), p(item.retail_price),
            String(item.stock), String(item.reorder), status
          ];
          row.forEach((v, i) => {
            if (i === 8) {
              const sc = status==='Critical'?[242,76,76]:status==='Warning'?[200,150,0]:[4,185,77];
              doc.setTextColor(...sc); doc.setFont('helvetica','bold');
            }
            doc.text(v, cx+1, y+4.5);
            doc.setTextColor(26,26,46); doc.setFont('helvetica','normal');
            cx += colW[i];
          });
          y += 6.5;
        });

        doc.setFontSize(7); doc.setTextColor(160,160,180);
        doc.text('PetKO Business Intelligence  -  Confidential', 14, 200);
        doc.save(`PetKO_Inventory_${new Date().toISOString().slice(0,10)}.pdf`);
      } catch (e) {
        console.error('Inventory PDF error:', e);
        alert('Export failed: ' + e.message);
      } finally {
        setExporting('');
      }
  };

  if (loading) return (
    <div className="analytics-loading">
      <div className="loading-spinner"><IconAnalytics size={32} /></div>
      <p>Loading analytics...</p>
    </div>
  );

  return (
    <div ref={reportRef} className="analytics-wrap">

      {/* ── Header row ── */}
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
                <IconDownload size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Export PDF ▾
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

      {/* ── KPI Cards ── */}
      <div className="stats-grid" style={{ marginTop: 16 }}>
        <KpiCard
          icon={<IconAnalytics size={24} />} label={`Total Sales${month !== 'all' ? ` (${new Date(month+'-02').toLocaleString('default',{month:'short'})})` : ''}`}
          value={fmt(totals.revenue)}
          delta={pct(totals.revenue, prevTotals?.revenue)}
          sub="vs last month" color="red" />
        <KpiCard
          icon={<IconCart size={24} />} label="Total Transactions"
          value={totals.transactions.toLocaleString()}
          delta={pct(totals.transactions, prevTotals?.transactions)}
          sub="vs last month" color="green" />
        <KpiCard
          icon={<IconAnalytics size={24} />} label="Avg Daily Sales"
          value={fmt(avgDaily)}
          sub={`across ${dailyData.length} days`} color="yellow" />
        <KpiCard
          icon={<IconTrophy size={24} />} label="Top Product"
          value={topProductName}
          sub={topProducts[0] ? fmt(topProducts[0].value) + ' revenue' : '—'}
          color="blue" smallValue />
      </div>

      {/* ── Daily Sales Area Chart ── */}
      <div className="card analytics-chart-card" style={{ marginBottom: 20 }}>
        <div className="chart-card-header">
          <div>
            <div className="chart-card-title"><IconAnalytics size={18} style={{marginRight:6}} /> Daily Sales Trend</div>
            <div className="chart-card-sub">{dailyData.length} data points</div>
          </div>
          <div className="chart-total-badge">{fmt(totals.revenue)}</div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2699F7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2699F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill:'#7a7a9a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill:'#7a7a9a' }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="amount" name="Sales" stroke="#2699F7" strokeWidth={2.5} fill="url(#salesGrad)" dot={{ r:3, fill:'#2699F7', strokeWidth:0 }} activeDot={{ r:5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Category + DoW ── */}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill:'#7a7a9a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill:'#7a7a9a' }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" name="Sales" radius={[10,10,0,0]} maxBarSize={52}>
                {dowData.map((entry, i) => {
                  const max = Math.max(...dowData.map(d => d.amount));
                  return <Cell key={i} fill={entry.amount === max ? '#F24C4C' : '#FFBDBD'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Products + Monthly Summary ── */}
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
            <div className="chart-card-title"><IconAnalytics size={18} style={{marginRight:6}} /> Monthly Summary</div>
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

      {/* ── Low Stock Alert ── */}
      {lowStockItems.length > 0 && (
        <div className="low-stock-strip">
          <span className="low-stock-title"><IconAlert size={18} style={{marginRight:6}} /> Low Stock Alerts — {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need reordering</span>
          <ul>
            {lowStockItems.map(i => (
              <li key={i.id}><strong>{i.name}</strong> — {i.stock} left (reorder at {i.reorder})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
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
