import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import useApi from '../hooks/useApi';
import authFetch from '../hooks/useAuthFetch';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { colors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const EMPTY = { name: '', category: ['Cat Food'], brand: '', unit_cost: '', retail_price: '', stock: '', reorder: '' };
const CATEGORIES = ['Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'];

export default function InventoryScreen() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';
  const { data, loading, refetch } = useApi('/api/inventory');

  const [search, setSearch]         = useState('');
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [saving, setSaving]         = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [formSaving, setFormSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter(i => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q));
  }, [data, search]);

  const submitRestock = async () => {
    const qty = parseInt(restockQty);
    if (!qty || qty < 1) return;
    setSaving(true);
    try {
      const res  = await authFetch(`/api/inventory/${restockItem.id}/restock`, {
        method: 'POST', body: JSON.stringify({ qty }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert('Error', json.error || 'Failed'); return; }
      Alert.alert('Done', `Stock updated to ${json.new_stock}`);
      setRestockItem(null); setRestockQty('');
      refetch();
    } catch { Alert.alert('Network error'); }
    finally { setSaving(false); }
  };

  const submitAdd = async () => {
    if (!form.name || !form.brand || !form.unit_cost || !form.retail_price || form.stock === '' || form.reorder === '') {
      Alert.alert('Error', 'Please fill in all fields.'); return;
    }
    if (!form.category.length) {
      Alert.alert('Error', 'Please select at least one category.'); return;
    }
    setFormSaving(true);
    try {
      const payload = { ...form, category: form.category.join(',') };
      const res = await authFetch('/api/inventory', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) { Alert.alert('Error', 'Failed to add item.'); return; }
      setShowAdd(false); setForm(EMPTY); refetch();
    } catch { Alert.alert('Network error'); }
    finally { setFormSaving(false); }
  };

  const badge = (stock, reorder) => {
    if (stock === 0)     return { label: 'Out',    bg: '#ffe4e4', color: colors.danger };
    if (stock < reorder) return { label: 'Low',    bg: '#ffe4e4', color: colors.danger };
    if (stock === reorder) return { label: 'Reorder', bg: '#fff9d6', color: '#b8860b' };
    return { label: 'OK', bg: '#d4f7e4', color: '#028a39' };
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size={36} /></View>;

  const totalUnits = data?.reduce((s, i) => s + i.stock, 0) ?? 0;
  const retailVal  = data?.reduce((s, i) => s + i.retail_price * i.stock, 0) ?? 0;

  return (
    <View style={s.page}>
      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="SKUs"         value={String(data?.length ?? 0)} color={colors.blue}    style={s.statQ} />
        <StatCard label="Units"        value={totalUnits.toLocaleString()} color={colors.green} style={s.statQ} />
        <StatCard label="Retail Value" value={fmt(retailVal)}             color={colors.primary} style={s.statQ} />
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        <TextInput style={s.search} placeholder="Search..." placeholderTextColor={colors.muted}
          value={search} onChangeText={setSearch} />
        {isAdmin && (
          <TouchableOpacity style={s.addBtn} onPress={() => { setShowAdd(true); setForm(EMPTY); }}>
            <Text style={s.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const b = badge(item.stock, item.reorder);
          return (
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.rowMeta}>{item.category} · {item.brand}</Text>
                <Text style={s.rowPrice}>{fmt(item.retail_price)}</Text>
              </View>
              <View style={s.rowRight}>
                <View style={[s.badgeWrap, { backgroundColor: b.bg }]}>
                  <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
                </View>
                <Text style={s.rowStock}>{item.stock} units</Text>
                <TouchableOpacity style={s.restockBtn} onPress={() => { setRestockItem(item); setRestockQty(''); }}>
                  <Text style={s.restockBtnText}>+ Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No items found.</Text>}
      />

      {/* Restock Modal */}
      <Modal visible={!!restockItem} transparent={true} animationType="fade" onRequestClose={() => setRestockItem(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Add Stock</Text>
            <Text style={s.modalSub}>{restockItem?.name}</Text>
            <Text style={s.modalSub}>Current: <Text style={{ fontWeight: font.bold }}>{restockItem?.stock}</Text></Text>
            <TextInput style={s.modalInput} placeholder="Quantity to add" placeholderTextColor={colors.muted}
              value={restockQty} onChangeText={setRestockQty} keyboardType="numeric" autoFocus={true} />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btn} onPress={submitRestock} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirm</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setRestockItem(null)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAdd} transparent={true} animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={s.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text style={s.modalTitle}>➕ Add New Item</Text>
            {[
              { key: 'name',         label: 'Item Name',        keyboard: 'default' },
              { key: 'brand',        label: 'Brand',            keyboard: 'default' },
              { key: 'unit_cost',    label: 'Unit Cost (₱)',    keyboard: 'numeric' },
              { key: 'retail_price', label: 'Retail Price (₱)', keyboard: 'numeric' },
              { key: 'stock',        label: 'Stock Level',      keyboard: 'numeric' },
              { key: 'reorder',      label: 'Reorder Level',    keyboard: 'numeric' },
            ].map(f => (
              <View key={f.key} style={{ marginBottom: 12 }}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <TextInput style={s.modalInput} value={form[f.key]}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                  keyboardType={f.keyboard} placeholderTextColor={colors.muted} />
              </View>
            ))}
            <Text style={s.fieldLabel}>Category (select multiple)</Text>
            <View style={s.catChipWrap}>
              {CATEGORIES.map(c => {
                const selected = form.category.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={[s.catChip, selected && s.catChipActive]}
                    onPress={() => setForm(p => ({
                      ...p,
                      category: selected
                        ? p.category.filter(x => x !== c)
                        : [...p.category, c]
                    }))}
                  >
                    <Text style={[s.catChipText, selected && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btn} onPress={submitAdd} disabled={formSaving}>
                {formSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save Item</Text>}
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

const s = StyleSheet.create({
  page:         { flex: 1, backgroundColor: colors.bg },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow:     { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  statQ:        { flex: 1 },
  toolbar:      { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'center' },
  search:       { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 9, fontSize: 14, color: colors.text },
  addBtn:       { backgroundColor: colors.green, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText:   { color: '#fff', fontWeight: font.black, fontSize: 13 },
  list:         { padding: 12, paddingTop: 0, gap: 10 },
  row:          { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rowLeft:      { flex: 1, marginRight: 10 },
  rowName:      { fontSize: 14, fontWeight: font.bold, color: colors.text },
  rowMeta:      { fontSize: 11, color: colors.muted, marginTop: 2 },
  rowPrice:     { fontSize: 13, fontWeight: font.black, color: colors.primary, marginTop: 4 },
  rowRight:     { alignItems: 'flex-end', gap: 6 },
  badgeWrap:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText:    { fontSize: 11, fontWeight: font.black },
  rowStock:     { fontSize: 12, color: colors.muted },
  restockBtn:   { backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  restockBtnText:{ fontSize: 11, fontWeight: font.bold, color: colors.primary },
  empty:        { textAlign: 'center', color: colors.muted, padding: 40 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal:        { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, maxHeight: '85%' },
  modalTitle:   { fontSize: 18, fontWeight: font.black, color: colors.text, marginBottom: 4 },
  modalSub:     { fontSize: 13, color: colors.muted, marginBottom: 8 },
  modalInput:   { borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: '#fff' },
  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn:          { flex: 1, backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 13, alignItems: 'center' },
  btnText:      { color: '#fff', fontWeight: font.black, fontSize: 15 },
  cancelBtn:    { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:{ color: colors.muted, fontWeight: font.bold, fontSize: 15 },
  fieldLabel:   { fontSize: 11, fontWeight: font.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  catChipWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  catChipActive:{ backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText:  { fontSize: 12, fontWeight: font.semibold, color: colors.muted },
});
