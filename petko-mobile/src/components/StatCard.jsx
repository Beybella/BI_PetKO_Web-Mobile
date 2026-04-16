import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, font } from '../theme';

export default function StatCard({ label, value, color, style, icon }) {
  return (
    <View style={[s.card, { borderTopColor: color }, style]}>
      {icon && <View style={s.iconWrap}>{icon}</View>}
      <Text style={s.label}>{label}</Text>
      <Text style={s.value} numberOfLines={1} adjustsFontSizeToFit={true}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:     { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconWrap: { marginBottom: 6 },
  label:    { fontSize: 10, fontWeight: font.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value:    { fontSize: 18, fontWeight: font.black, color: colors.text, letterSpacing: -0.5 },
});
