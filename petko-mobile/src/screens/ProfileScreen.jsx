import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IconLogout } from '../components/Icons';
import { colors, darkColors, radius, font } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const c = dark ? darkColors : colors;

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[s.page, { backgroundColor: c.bg }]}>
      {/* Avatar card */}
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[s.avatar, { backgroundColor: c.primary }]}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={[s.name, { color: c.text }]}>{user?.name}</Text>
        <Text style={[s.email, { color: c.muted }]}>{user?.email}</Text>
        <View style={[s.roleBadge, user?.role === 'admin' ? { backgroundColor: c.primaryLight } : { backgroundColor: '#D1FAE5' }]}>
          <Text style={[s.roleText, { color: user?.role === 'admin' ? c.primary : c.green }]}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.sectionTitle, { color: c.text }]}>Settings</Text>
        <View style={[s.infoRow, { borderBottomColor: c.border }]}>
          <Text style={[s.infoLabel, { color: c.muted }]}>Dark Mode</Text>
          <Switch
            value={dark}
            onValueChange={toggle}
            trackColor={{ false: c.border, true: c.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* App info */}
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.sectionTitle, { color: c.text }]}>App Info</Text>
        {[
          { label: 'Version',  value: '1.0.0' },
          { label: 'Platform', value: 'React Native + Expo' },
          { label: 'Backend',  value: 'Laravel API' },
        ].map(r => (
          <View key={r.label} style={[s.infoRow, { borderBottomColor: c.border }]}>
            <Text style={[s.infoLabel, { color: c.muted }]}>{r.label}</Text>
            <Text style={[s.infoValue, { color: c.text }]}>{r.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[s.logoutBtn, { backgroundColor: c.danger }]} onPress={confirmLogout} activeOpacity={0.85}>
        <IconLogout size={18} color="#fff" />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  page:        { flex: 1, backgroundColor: colors.bg, padding: 16 },
  card:        { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, marginBottom: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: colors.border },
  avatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 30, fontWeight: font.black, color: '#fff' },
  name:        { fontSize: 20, fontWeight: font.black, color: colors.text },
  email:       { fontSize: 13, color: colors.muted, marginTop: 4 },
  roleBadge:   { marginTop: 10, paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.full },
  roleAdmin:   { backgroundColor: colors.primaryLight },
  roleStaff:   { backgroundColor: '#D1FAE5' },
  roleText:    { fontSize: 12, fontWeight: font.black, letterSpacing: 1 },
  sectionTitle:{ fontSize: 14, fontWeight: font.black, color: colors.text, marginBottom: 12, alignSelf: 'flex-start' },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:   { fontSize: 13, color: colors.muted },
  infoValue:   { fontSize: 13, fontWeight: font.semibold, color: colors.text },
  logoutBtn:   { backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: colors.danger, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  logoutText:  { color: '#fff', fontWeight: font.black, fontSize: 16 },
});
