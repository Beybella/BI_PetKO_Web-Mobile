import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import useApi from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { IconAlert, IconWarning, IconCheck } from '../components/Icons';
import { colors, darkColors, radius, font } from '../theme';
import { useTheme } from '../context/ThemeContext';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function LowStockScreen() {
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;
  const { data, loading } = useApi('/api/inventory');

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} size={36} /></View>;

  const critical = data?.filter(i => i.stock < i.reorder) ?? [];
  const warning  = data?.filter(i => i.stock === i.reorder) ?? [];
  const ok       = data?.filter(i => i.stock > i.reorder) ?? [];

  const restockCost = critical.reduce((sum, i) =>
    sum + Math.max(0, i.reorder * 2 - i.stock) * (i.unit_cost || 0), 0);

  const allAlerts = [
    ...critical.map(i => ({ ...i, _type: 'critical' })),
    ...warning.map(i => ({ ...i, _type: 'warning' })),
  ];

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={s.content}
      ListHeaderComponent={() => (
        <>
          <View style={s.statsRow}>
            <StatCard label="Critical" value={String(critical.length)} color={c.danger} style={s.statQ} icon={<IconAlert size={18} color={c.danger} />} dark={dark} />
            <StatCard label="Warning"  value={String(warning.length)}  color="#d97706"  style={s.statQ} icon={<IconWarning size={18} color="#d97706" />} dark={dark} />
            <StatCard label="OK"       value={String(ok.length)}       color={c.green}  style={s.statQ} icon={<IconCheck size={18} color={c.green} />} dark={dark} />
          </View>
          <View style={[s.costCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.costLabel, { color: c.muted }]}>Est. Restock Cost</Text>
            <Text style={[s.costValue, { color: c.green }]}>{fmt(restockCost)}</Text>
          </View>
          {allAlerts.length === 0 && <Text style={[s.empty, { color: c.green }]}>✅ All items are well stocked!</Text>}
        </>
      )}
      data={allAlerts}
      keyExtractor={i => String(i.id)}
      renderItem={({ item }) => {
        const isCritical = item._type === 'critical';
        const pct    = item.reorder > 0 ? Math.min(100, Math.round(item.stock / item.reorder * 100)) : 100;
        const needed = Math.max(0, item.reorder * 2 - item.stock);
        return (
          <View style={[s.alertCard, {
            backgroundColor: isCritical ? (dark ? 'rgba(192,57,43,.1)' : '#FEF2F2') : (dark ? 'rgba(217,119,6,.1)' : '#FFFBEB'),
            borderColor:     isCritical ? (dark ? 'rgba(192,57,43,.3)' : '#FECACA') : (dark ? 'rgba(217,119,6,.3)' : '#FDE68A'),
          }]}>
            <View style={s.alertTop}>
              <View style={{ flex: 1 }}>
                <Text style={[s.alertName, { color: c.text }]}>{item.name}</Text>
                <Text style={[s.alertMeta, { color: c.muted }]}>{item.category} · {item.brand}</Text>
              </View>
              <View style={s.alertRight}>
                <Text style={[s.alertNum, { color: isCritical ? c.danger : '#d97706' }]}>{item.stock} left</Text>
                <Text style={[s.alertNeed, { color: c.muted }]}>Need {needed} units</Text>
              </View>
            </View>
            <View style={[s.progressWrap, { backgroundColor: c.border }]}>
              <View style={[s.progressBar, { flex: pct, backgroundColor: isCritical ? c.danger : '#d97706' }]} />
              <View style={{ flex: 100 - pct }} />
            </View>
            <Text style={[s.alertPct, { color: c.muted }]}>{item.stock} / {item.reorder} units ({pct}%)</Text>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:     { padding: 12, paddingBottom: 40 },
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statQ:       { flex: 1 },
  costCard:    { borderRadius: radius.md, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  costLabel:   { fontSize: 12, fontWeight: font.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  costValue:   { fontSize: 22, fontWeight: font.black, marginTop: 4 },
  empty:       { textAlign: 'center', padding: 40, fontSize: 15, fontWeight: font.bold },
  alertCard:   { borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5 },
  alertTop:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  alertName:   { fontSize: 14, fontWeight: font.bold },
  alertMeta:   { fontSize: 11, marginTop: 2 },
  alertRight:  { alignItems: 'flex-end' },
  alertNum:    { fontSize: 16, fontWeight: font.black },
  alertNeed:   { fontSize: 11, marginTop: 2 },
  progressWrap:{ height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 4, flexDirection: 'row' },
  progressBar: { height: 6, borderRadius: 999 },
  alertPct:    { fontSize: 11 },
});
