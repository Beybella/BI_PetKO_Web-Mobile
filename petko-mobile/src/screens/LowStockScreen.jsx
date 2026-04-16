import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import useApi from '../hooks/useApi';
import StatCard from '../components/StatCard';
import { IconAlert, IconWarning, IconCheck, IconBox, IconCash } from '../components/Icons';
import { colors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

export default function LowStockScreen() {
  const { data, loading } = useApi('/api/inventory');

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size={36} /></View>;

  const critical = data?.filter(i => i.stock < i.reorder) ?? [];
  const warning  = data?.filter(i => i.stock === i.reorder) ?? [];
  const ok       = data?.filter(i => i.stock > i.reorder) ?? [];

  const restockCost = critical.reduce((sum, i) => {
    return sum + Math.max(0, i.reorder * 2 - i.stock) * (i.unit_cost || 0);
  }, 0);

  const allAlerts = [
    ...critical.map(i => ({ ...i, _type: 'critical' })),
    ...warning.map(i => ({ ...i, _type: 'warning' })),
  ];

  return (
    <FlatList
      style={s.page}
      contentContainerStyle={s.content}
      ListHeaderComponent={() => (
        <>
          <View style={s.statsRow}>
            <StatCard label="Critical" value={String(critical.length)} color={colors.primary} style={s.statQ} icon={<IconAlert size={18} color={colors.primary} />} />
            <StatCard label="Warning"  value={String(warning.length)}  color="#d97706"        style={s.statQ} icon={<IconWarning size={18} color="#d97706" />} />
            <StatCard label="OK"       value={String(ok.length)}       color={colors.green}   style={s.statQ} icon={<IconCheck size={18} color={colors.green} />} />
          </View>
          <View style={s.costCard}>
            <Text style={s.costLabel}>Est. Restock Cost</Text>
            <Text style={s.costValue}>{fmt(restockCost)}</Text>
          </View>
          {allAlerts.length === 0 && (
            <Text style={s.empty}>✅ All items are well stocked!</Text>
          )}
        </>
      )}
      data={allAlerts}
      keyExtractor={i => String(i.id)}
      renderItem={({ item }) => {
        const isCritical = item._type === 'critical';
        const pct = item.reorder > 0 ? Math.min(100, Math.round(item.stock / item.reorder * 100)) : 100;
        const needed = Math.max(0, item.reorder * 2 - item.stock);
        return (
          <View style={[s.alertCard, isCritical ? s.alertCritical : s.alertWarning]}>
            <View style={s.alertTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.alertName}>{item.name}</Text>
                <Text style={s.alertMeta}>{item.category} · {item.brand}</Text>
              </View>
              <View style={s.alertRight}>
                <Text style={[s.alertNum, { color: isCritical ? colors.danger : '#d97706' }]}>{item.stock} left</Text>
                <Text style={s.alertNeed}>Need {needed} units</Text>
              </View>
            </View>
            <View style={s.progressWrap}>
              <View style={[s.progressBar, { flex: pct, backgroundColor: isCritical ? colors.danger : colors.yellow }]} />
              <View style={{ flex: 100 - pct }} />
            </View>
            <Text style={s.alertPct}>{item.stock} / {item.reorder} units ({pct}%)</Text>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: colors.bg },
  content:        { padding: 12, paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statQ:          { flex: 1 },
  costCard:       { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  costLabel:      { fontSize: 12, color: colors.muted, fontWeight: font.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  costValue:      { fontSize: 22, fontWeight: font.black, color: colors.green, marginTop: 4 },
  empty:          { textAlign: 'center', color: colors.green, padding: 40, fontSize: 15, fontWeight: font.bold },
  alertCard:      { borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1.5 },
  alertCritical:  { backgroundColor: '#fff4f4', borderColor: '#ffd6d6' },
  alertWarning:   { backgroundColor: '#fffbea', borderColor: '#fde68a' },
  alertTop:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  alertName:      { fontSize: 14, fontWeight: font.bold, color: colors.text },
  alertMeta:      { fontSize: 11, color: colors.muted, marginTop: 2 },
  alertRight:     { alignItems: 'flex-end' },
  alertNum:       { fontSize: 16, fontWeight: font.black },
  alertNeed:      { fontSize: 11, color: colors.muted, marginTop: 2 },
  progressWrap:   { height: 6, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden', marginBottom: 4, flexDirection: 'row' },
  progressBar:    { height: 6, borderRadius: 999 },
  alertPct:       { fontSize: 11, color: colors.muted },
});
