import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import useApi from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { IconAlert, IconCart, IconTrendUp, IconMoneySack, IconBox, IconWarning } from '../components/Icons';
import { colors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function DashboardScreen() {
  const { data: sales, loading: sLoading } = useApi('/api/sales/summary');
  const { data: inv,   loading: iLoading } = useApi('/api/inventory');

  if (sLoading || iLoading) {
    return (
      <View style={s.center}>
        <Text style={s.paw}>🐾</Text>
        <Text style={s.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totals = sales?.monthly?.reduce(
    (a, m) => ({ revenue: a.revenue + m.revenue, transactions: a.transactions + m.transactions, expenses: a.expenses + m.expenses }),
    { revenue: 0, transactions: 0, expenses: 0 }
  ) ?? { revenue: 0, transactions: 0, expenses: 0 };

  const lowStockItems = inv ? inv.filter(i => i.stock < i.reorder) : [];
  const warningItems  = inv ? inv.filter(i => i.stock === i.reorder) : [];
  const totalSKUs     = inv ? inv.length : 0;
  const net           = totals.revenue - totals.expenses;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>

      {/* KPI Grid */}
      <View style={s.grid}>
        <StatCard label="Total Sales"    value={fmt(totals.revenue)}              color={colors.green}   style={s.half} />
        <StatCard label="Transactions"   value={totals.transactions.toLocaleString()} color={colors.blue} style={s.half} />
        <StatCard label="Total Expenses" value={fmt(totals.expenses)}             color={colors.primary} style={s.half} />
        <StatCard label="Net Income"     value={fmt(net)}                         color={net >= 0 ? colors.green : colors.primary} style={s.half} />
        <StatCard label="Total SKUs"     value={totalSKUs.toString()}             color={colors.blue}    style={s.half} />
        <StatCard label="Low Stock"      value={lowStockItems.length.toString()}  color={lowStockItems.length > 0 ? colors.primary : colors.green} style={s.half} />
      </View>

      {/* Critical Low Stock List */}
      {lowStockItems.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <IconAlert size={18} color={colors.primary} />
            <Text style={s.sectionTitle}>Critical — Below Reorder Level</Text>
            <View style={s.countBadge}><Text style={s.countBadgeText}>{lowStockItems.length}</Text></View>
          </View>
          {lowStockItems.map(item => (
            <StockAlertRow key={item.id} item={item} type="critical" />
          ))}
        </View>
      )}

      {/* Warning Items */}
      {warningItems.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <IconWarning size={18} color="#d97706" />
            <Text style={[s.sectionTitle, { color: '#d97706' }]}>Warning — At Reorder Level</Text>
            <View style={[s.countBadge, { backgroundColor: '#fff9d6' }]}>
              <Text style={[s.countBadgeText, { color: '#b8860b' }]}>{warningItems.length}</Text>
            </View>
          </View>
          {warningItems.map(item => (
            <StockAlertRow key={item.id} item={item} type="warning" />
          ))}
        </View>
      )}

      {lowStockItems.length === 0 && warningItems.length === 0 && (
        <View style={s.allGood}>
          <Text style={s.allGoodText}>✅ All items are well stocked!</Text>
        </View>
      )}

    </ScrollView>
  );
}

function StockAlertRow({ item, type }) {
  const isCritical = type === 'critical';
  const needed     = Math.max(0, item.reorder * 2 - item.stock);
  const pct        = item.reorder > 0 ? Math.min(100, Math.round(item.stock / item.reorder * 100)) : 100;

  return (
    <View style={[s.alertRow, isCritical ? s.alertCritical : s.alertWarning]}>
      <View style={s.alertLeft}>
        <Text style={s.alertName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.alertMeta}>{item.category} · {item.brand}</Text>
        <View style={s.progressWrap}>
          <View style={[s.progressBar, { flex: pct, backgroundColor: isCritical ? colors.primary : '#d97706' }]} />
          <View style={{ flex: Math.max(0, 100 - pct) }} />
        </View>
        <Text style={s.alertPct}>{item.stock} / {item.reorder} units</Text>
      </View>
      <View style={s.alertRight}>
        <Text style={[s.alertStock, { color: isCritical ? colors.primary : '#d97706' }]}>{item.stock} left</Text>
        <Text style={s.alertNeed}>Need {needed}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: 16, paddingBottom: 40 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  paw:           { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  loadingText:   { fontSize: 16, color: colors.muted },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  half:          { width: '47%' },
  section:       { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle:  { flex: 1, fontSize: 13, fontWeight: font.black, color: colors.primary },
  countBadge:    { backgroundColor: '#ffe4e4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  countBadgeText:{ fontSize: 11, fontWeight: font.black, color: colors.primary },
  alertRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md, marginBottom: 8, borderWidth: 1.5 },
  alertCritical: { backgroundColor: '#fff4f4', borderColor: '#ffd6d6' },
  alertWarning:  { backgroundColor: '#fffbea', borderColor: '#fde68a' },
  alertLeft:     { flex: 1, marginRight: 12 },
  alertName:     { fontSize: 13, fontWeight: font.bold, color: colors.text },
  alertMeta:     { fontSize: 11, color: colors.muted, marginTop: 2, marginBottom: 6 },
  progressWrap:  { height: 5, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden', flexDirection: 'row', marginBottom: 4 },
  progressBar:   { height: 5, borderRadius: 999 },
  alertPct:      { fontSize: 10, color: colors.muted },
  alertRight:    { alignItems: 'flex-end' },
  alertStock:    { fontSize: 15, fontWeight: font.black },
  alertNeed:     { fontSize: 11, color: colors.muted, marginTop: 2 },
  allGood:       { backgroundColor: '#f0fff7', borderRadius: radius.md, padding: 20, alignItems: 'center' },
  allGoodText:   { fontSize: 14, fontWeight: font.bold, color: colors.green },
});
