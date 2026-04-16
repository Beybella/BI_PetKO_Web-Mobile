import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import useApi from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { IconAlert, IconWarning } from '../components/Icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { printAnalytics, printInventory } from '../utils/printPDF';
import { colors, darkColors, radius, font } from '../theme';
import { useTheme } from '../context/ThemeContext';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function DashboardScreen() {
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;
  const { data: sales, loading: sLoading } = useApi('/api/sales/summary');
  const { data: inv,   loading: iLoading } = useApi('/api/inventory');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try { await printAnalytics(sales, inv, 'All Time'); }
    catch (e) { Alert.alert('Export failed', e.message); }
    finally { setExporting(false); }
  };

  if (sLoading || iLoading) return (
    <View style={[s.center, { backgroundColor: c.bg }]}>
      <Text style={s.paw}>🐾</Text>
      <ActivityIndicator color={c.primary} size={36} />
    </View>
  );

  const totals = sales?.monthly?.reduce(
    (a, m) => ({ revenue: a.revenue + m.revenue, transactions: a.transactions + m.transactions, expenses: a.expenses + m.expenses }),
    { revenue: 0, transactions: 0, expenses: 0 }
  ) ?? { revenue: 0, transactions: 0, expenses: 0 };

  const lowStockItems = inv ? inv.filter(i => i.stock < i.reorder) : [];
  const warningItems  = inv ? inv.filter(i => i.stock === i.reorder) : [];
  const totalSKUs     = inv ? inv.length : 0;
  const net           = totals.revenue - totals.expenses;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={s.content}>
      {/* Export buttons */}
      <TouchableOpacity style={[s.exportBtn, { backgroundColor: c.card, borderColor: c.primary, borderWidth: 1.5 }]} onPress={handleExport} disabled={exporting} activeOpacity={0.85}>
        {exporting ? <ActivityIndicator color={c.primary} /> : (
          <>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={c.primary} />
            <Text style={[s.exportBtnText, { color: c.primary }]}>Export Sales Report</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={[s.exportBtn, { backgroundColor: c.card, borderColor: c.green, borderWidth: 1.5, marginTop: -8 }]}
        onPress={async () => { try { await printInventory(inv); } catch(e) { Alert.alert('Export failed', e.message); } }}
        activeOpacity={0.85}>
        <MaterialCommunityIcons name="package-variant-closed" size={20} color={c.green} />
        <Text style={[s.exportBtnText, { color: c.green }]}>Export Inventory Report</Text>
      </TouchableOpacity>

      {/* KPI Grid */}
      <View style={s.grid}>
        <StatCard label="Total Sales"    value={fmt(totals.revenue)}                  color={c.green}   style={s.half} dark={dark} />
        <StatCard label="Transactions"   value={totals.transactions.toLocaleString()} color={c.blue}    style={s.half} dark={dark} />
        <StatCard label="Total Expenses" value={fmt(totals.expenses)}                 color={c.primary} style={s.half} dark={dark} />
        <StatCard label="Net Income"     value={fmt(net)}                             color={net >= 0 ? c.green : c.primary} style={s.half} dark={dark} />
        <StatCard label="Total SKUs"     value={totalSKUs.toString()}                 color={c.blue}    style={s.half} dark={dark} />
        <StatCard label="Low Stock"      value={lowStockItems.length.toString()}      color={lowStockItems.length > 0 ? c.danger : c.green} style={s.half} dark={dark} />
      </View>

      {/* Critical */}
      {lowStockItems.length > 0 && (
        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.sectionHeader}>
            <IconAlert size={18} color={c.danger} />
            <Text style={[s.sectionTitle, { color: c.danger }]}>Critical — Below Reorder Level</Text>
            <View style={[s.countBadge, { backgroundColor: dark ? 'rgba(192,57,43,.2)' : '#FEE2E2' }]}>
              <Text style={[s.countBadgeText, { color: c.danger }]}>{lowStockItems.length}</Text>
            </View>
          </View>
          {lowStockItems.map(item => <StockAlertRow key={item.id} item={item} type="critical" c={c} />)}
        </View>
      )}

      {/* Warning */}
      {warningItems.length > 0 && (
        <View style={[s.section, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.sectionHeader}>
            <IconWarning size={18} color="#d97706" />
            <Text style={[s.sectionTitle, { color: '#d97706' }]}>Warning — At Reorder Level</Text>
            <View style={[s.countBadge, { backgroundColor: dark ? 'rgba(217,119,6,.2)' : '#FEF3C7' }]}>
              <Text style={[s.countBadgeText, { color: '#d97706' }]}>{warningItems.length}</Text>
            </View>
          </View>
          {warningItems.map(item => <StockAlertRow key={item.id} item={item} type="warning" c={c} />)}
        </View>
      )}

      {lowStockItems.length === 0 && warningItems.length === 0 && (
        <View style={[s.allGood, { backgroundColor: dark ? 'rgba(46,125,82,.15)' : '#ECFDF5' }]}>
          <Text style={[s.allGoodText, { color: c.green }]}>✅ All items are well stocked!</Text>
        </View>
      )}
    </ScrollView>
  );
}

function StockAlertRow({ item, type, c }) {
  const isCritical = type === 'critical';
  const needed = Math.max(0, item.reorder * 2 - item.stock);
  const pct    = item.reorder > 0 ? Math.min(100, Math.round(item.stock / item.reorder * 100)) : 100;
  return (
    <View style={[s.alertRow, { backgroundColor: isCritical ? 'rgba(192,57,43,.08)' : 'rgba(217,119,6,.08)', borderColor: isCritical ? 'rgba(192,57,43,.25)' : 'rgba(217,119,6,.25)' }]}>
      <View style={s.alertLeft}>
        <Text style={[s.alertName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[s.alertMeta, { color: c.muted }]}>{item.category} · {item.brand}</Text>
        <View style={[s.progressWrap, { backgroundColor: c.border }]}>
          <View style={[s.progressBar, { flex: pct, backgroundColor: isCritical ? c.danger : '#d97706' }]} />
          <View style={{ flex: Math.max(0, 100 - pct) }} />
        </View>
        <Text style={[s.alertPct, { color: c.muted }]}>{item.stock} / {item.reorder} units</Text>
      </View>
      <View style={s.alertRight}>
        <Text style={[s.alertStock, { color: isCritical ? c.danger : '#d97706' }]}>{item.stock} left</Text>
        <Text style={[s.alertNeed, { color: c.muted }]}>Need {needed}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  paw:           { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  content:       { padding: 16, paddingBottom: 40 },
  exportBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: 12, marginBottom: 16 },
  exportBtnText: { fontWeight: font.bold, fontSize: 14 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  half:          { width: '47%' },
  section:       { borderRadius: radius.lg, padding: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { flex: 1, fontSize: 13, fontWeight: font.black },
  countBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  countBadgeText:{ fontSize: 11, fontWeight: font.black },
  alertRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, marginBottom: 8, borderWidth: 1.5 },
  alertLeft:     { flex: 1, marginRight: 12 },
  alertName:     { fontSize: 13, fontWeight: font.bold },
  alertMeta:     { fontSize: 11, marginTop: 2, marginBottom: 6 },
  progressWrap:  { height: 5, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 },
  progressBar:   { height: 5, borderRadius: 999 },
  alertPct:      { fontSize: 10 },
  alertRight:    { alignItems: 'flex-end' },
  alertStock:    { fontSize: 15, fontWeight: font.black },
  alertNeed:     { fontSize: 11, marginTop: 2 },
  allGood:       { borderRadius: radius.md, padding: 20, alignItems: 'center' },
  allGoodText:   { fontSize: 14, fontWeight: font.bold },
});
