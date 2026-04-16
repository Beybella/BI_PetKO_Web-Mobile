import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { IconLogout, IconKey, IconUser, IconPaw } from '../components/Icons';
import { colors, radius, font } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={s.page}>
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <View style={[s.roleBadge, user?.role === 'admin' ? s.roleAdmin : s.roleStaff]}>
          <Text style={[s.roleText, user?.role === 'admin' ? { color: colors.primary } : { color: '#028a39' }]}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>App Info</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Version</Text>
          <Text style={s.infoValue}>1.0.0</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Platform</Text>
          <Text style={s.infoValue}>React Native + Expo</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Backend</Text>
          <Text style={s.infoValue}>Laravel API</Text>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <IconLogout size={18} color="#fff" />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  page:       { flex: 1, backgroundColor: colors.bg, padding: 16 },
  card:       { backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatar:     { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 30, fontWeight: font.black, color: '#fff' },
  name:       { fontSize: 20, fontWeight: font.black, color: colors.text },
  email:      { fontSize: 13, color: colors.muted, marginTop: 4 },
  roleBadge:  { marginTop: 10, paddingHorizontal: 16, paddingVertical: 4, borderRadius: radius.full },
  roleAdmin:  { backgroundColor: '#ffe4e4' },
  roleStaff:  { backgroundColor: '#d4f7e4' },
  roleText:   { fontSize: 12, fontWeight: font.black, letterSpacing: 1 },
  sectionTitle:{ fontSize: 14, fontWeight: font.black, color: colors.text, marginBottom: 12, alignSelf: 'flex-start' },
  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel:  { fontSize: 13, color: colors.muted },
  infoValue:  { fontSize: 13, fontWeight: font.semibold, color: colors.text },
  logoutBtn:  { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  logoutText: { color: '#fff', fontWeight: font.black, fontSize: 16 },
});
