import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors, darkColors, radius, font } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE } from '../config';

const EMPTY = { name: '', email: '', password: '', role: 'staff' };

export default function UsersScreen() {
  const { token, user: me } = useAuth();
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;

  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers });
      const d   = await res.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch { Alert.alert('Error', 'Could not load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    if (!form.name || !form.email || !form.password) { setError('Fill in all fields.'); return; }
    setError(''); setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/users`, { method: 'POST', headers, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Failed.'); return; }
      setShowAdd(false); setForm(EMPTY); load();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const confirmDelete = (u) => {
    Alert.alert('Remove User', `Remove ${u.name}? They will lose access immediately.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await fetch(`${API_BASE}/api/users/${u.id}`, { method: 'DELETE', headers });
        load();
      }},
    ]);
  };

  const s = makeStyles(c);

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} size={36} /></View>;

  return (
    <View style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>User Accounts</Text>
          <Text style={s.headerSub}>{users.length} account{users.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setShowAdd(true); setForm(EMPTY); setError(''); }} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={18} color="#fff" />
          <Text style={s.addBtnText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {/* User list */}
      <FlatList
        data={users}
        keyExtractor={u => String(u.id)}
        contentContainerStyle={s.list}
        renderItem={({ item: u }) => (
          <View style={s.row}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{u.name?.[0]?.toUpperCase()}</Text>
            </View>
            <View style={s.rowInfo}>
              <Text style={s.rowName}>{u.name}</Text>
              <Text style={s.rowEmail}>{u.email}</Text>
              <View style={[s.roleBadge, u.role === 'admin' ? s.roleAdmin : s.roleStaff]}>
                <Text style={[s.roleText, { color: u.role === 'admin' ? c.primary : c.green }]}>
                  {u.role.toUpperCase()}
                </Text>
              </View>
            </View>
            {u.id !== me?.id && (
              <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(u)} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No users found.</Text>}
      />

      {/* Add User Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={s.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>Add New User</Text>
              <Text style={s.modalSub}>Create a new staff or admin account.</Text>

              {[
                { key: 'name',     label: 'Full Name',  secure: false, keyboard: 'default' },
                { key: 'email',    label: 'Email',      secure: false, keyboard: 'email-address' },
                { key: 'password', label: 'Password',   secure: true,  keyboard: 'default' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    secureTextEntry={f.secure}
                    keyboardType={f.keyboard}
                    autoCapitalize="none"
                    placeholderTextColor={c.muted}
                    placeholder={f.label}
                  />
                </View>
              ))}

              <Text style={s.fieldLabel}>Role</Text>
              <View style={s.roleRow}>
                {['staff', 'admin'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s.roleChip, form.role === r && s.roleChipActive]}
                    onPress={() => setForm(p => ({ ...p, role: r }))}
                  >
                    <Text style={[s.roleChipText, form.role === r && { color: '#fff' }]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {error ? <Text style={s.errorText}>⚠ {error}</Text> : null}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.btn} onPress={submitAdd} disabled={saving} activeOpacity={0.85}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create User</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  page:         { flex: 1, backgroundColor: c.bg },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: c.card, borderBottomWidth: 1, borderBottomColor: c.border },
  headerTitle:  { fontSize: 17, fontWeight: font.black, color: c.text },
  headerSub:    { fontSize: 12, color: c.muted, marginTop: 2 },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.primary, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText:   { color: '#fff', fontWeight: font.bold, fontSize: 13 },
  list:         { padding: 12, gap: 10 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: c.border, gap: 12 },
  avatar:       { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { fontSize: 18, fontWeight: font.black, color: '#fff' },
  rowInfo:      { flex: 1 },
  rowName:      { fontSize: 14, fontWeight: font.bold, color: c.text },
  rowEmail:     { fontSize: 12, color: c.muted, marginTop: 2 },
  roleBadge:    { marginTop: 6, paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.full, alignSelf: 'flex-start' },
  roleAdmin:    { backgroundColor: c.primaryLight },
  roleStaff:    { backgroundColor: '#D1FAE5' },
  roleText:     { fontSize: 10, fontWeight: font.black, letterSpacing: 0.5 },
  deleteBtn:    { padding: 8 },
  empty:        { textAlign: 'center', color: c.muted, padding: 40 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: c.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, maxHeight: '85%' },
  modalTitle:   { fontSize: 18, fontWeight: font.black, color: c.text, marginBottom: 4 },
  modalSub:     { fontSize: 13, color: c.muted, marginBottom: 16 },
  fieldLabel:   { fontSize: 11, fontWeight: font.bold, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:        { borderWidth: 1.5, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: c.text, backgroundColor: c.bg },
  roleRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleChip:     { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', backgroundColor: c.bg },
  roleChipActive:{ backgroundColor: c.primary, borderColor: c.primary },
  roleChipText: { fontSize: 14, fontWeight: font.bold, color: c.muted },
  errorText:    { color: c.danger, fontSize: 13, marginBottom: 12 },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn:          { flex: 1, backgroundColor: c.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnText:      { color: '#fff', fontWeight: font.black, fontSize: 15 },
  cancelBtn:    { flex: 1, borderWidth: 1.5, borderColor: c.border, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:{ color: c.muted, fontWeight: font.bold, fontSize: 15 },
});
