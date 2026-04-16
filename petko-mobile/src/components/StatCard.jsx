import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, darkColors, radius, font } from '../theme';

export default function StatCard({ label, value, color, style, icon, dark }) {
  const c = dark ? darkColors : colors;
  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }, style]}>
      {icon && (
        <View style={[s.iconWrap, { backgroundColor: color + '22' }]}>
          {icon}
        </View>
      )}
      <Text style={[s.label, { color: c.muted }]}>{label}</Text>
      <Text style={[s.value, { color: color ?? c.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:     { borderRadius: radius.md, padding: 14, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  label:    { fontSize: 10, fontWeight: font.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  value:    { fontSize: 18, fontWeight: font.black, letterSpacing: -0.5 },
});
