import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import useApi from '../hooks/useApi';
import authFetch from '../hooks/useAuthFetch';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import { colors, darkColors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const EMPTY = { name: '', category: ['Cat Food'], brand: '', unit_cost: '', retail_price: '', stock: '', reorder: '' };
const CATEGORIES = ['Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'];

export default function InventoryScreen() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;
  const isAdmin = user?.role === 'admin';
  const { data, loading, refetch } = useApi('/api/inventory');

  const [search, setSearch]           = useState('');
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState(EMPTY);
  const [formSaving, setFormSaving]   = useState(false);

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
      const res  = await authFetch(`/api/inventory/${restockItem.id}/restock`, { method: 'POST', body: JSON.stringify({ qty }) });
      const json = await res.json();
      if (!res.ok) { Alert.alert('Error', json.error || 'Failed'); return; }
      Alert.alert('Done', `Stock updated to ${json.new_stock}`);
      setRestockItem(null); setRestockQty(''); refetch();
    } catch { Alert.alert('Network error'); }
    finally { setSaving(false); }
  };

  const submitAdd = async () => {
    if (!form.name || !form.brand || !form.unit_cost || !form.retail_price || form.stock === '' || form.reorder === '') {
      Alert.alert('Error', 'Please fill in all fields.'); return;
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
    if (stock === 0)       return { label: 'Out',     bg: dark ? 'rgba(192,57,43,.2)' : '#FEE2E2', color: c.danger };
    if (stock < reorder)   return { label: 'Low',     bg: dark ? 'rgba(192,57,43,.2)' : '#FEE2E2', color: c.danger };
    if (stock === reorder) return { label: 'Reorder', bg: dark ? 'rgba(217,119,6,.2)'  : '#FEF3C7', color: '#b8860b' };
    return { label: 'OK', bg: dark ? 'rgba(46,125,82,.2)' : '#D1FAE5', color: c.green };
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={c.primary} size={36} /></View>;

  const totalUnits = data?.reduce((s, i) => s + i.stock, 0) ?? 0;
  const retailVal  = data?.reduce((s, i) => s + i.retail_price * i.stock, 0) ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="SKUs"         value={String(data?.length ?? 0)} color={c.blue}    style={s.statQ} dark={dark} />
        <StatCard label="Units"        value={totalUnits.toLocaleString()} color={c.green} style={s.statQ} dark={dark} />
        <StatCard label="Retail Value" value={fmt(retailVal)}             color={c.primary} style={s.statQ} dark={dark} />
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        <TextInput
          style={[s.search, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          placeholder="Search..." placeholderTextColor={c.muted}
          value={search} onChangeText={setSearch}
        />
        {isAdmin && (
          <TouchableOpacity style={[s.addBtn, { backgroundColor: c.green }]} onPress={() => { setShowAdd(true); setForm(EMPTY); }}>
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
            <View style={[s.row, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={s.rowLeft}>
                <Text style={[s.rowName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[s.rowMeta, { color: c.muted }]}>{item.category} · {item.brand}</Text>
                <Text style={[s.rowPrice, { color: c.primary }]}>{fmt(item.retail_price)}</Text>
              </View>
              <View style={s.rowRight}>
                <View style={[s.badgeWrap, { backgroundColor: b.bg }]}>
                  <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
                </View>
                <Text style={[s.rowStock, { color: c.muted }]}>{item.stock} units</Text>
                <TouchableOpacity
                  style={[s.restockBtn, { backgroundColor: c.primaryLight, borderColor: c.primary }]}
                  onPress={() => { setRestockItem(item); setRestockQty(''); }}
                >
                  <Text style={[s.restockBtnText, { color: c.primary }]}>+ Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={[s.empty, { color: c.muted }]}>No items found.</Text>}
      />

      {/* Restock Modal */}
      <Modal visible={!!restockItem} transparent animationType="fade" onRequestClose={() => setRestockItem(null)}>
        <View style={s.overlay}>
          <View style={[s.modal, { backgroundColor: c.card }]}>
            <Text style={[s.modalTitle, { color: c.text }]}>Add Stock</Text>
            <Text style={[s.modalSub, { color: c.muted }]}>{restockItem?.name}</Text>
            <Text style={[s.modalSub, { color: c.muted }]}>Current: <Text style={{ fontWeight: font.bold, color: c.text }}>{restockItem?.stock}</Text></Text>
            <TextInput
              style={[s.modalInput, { borderColor: c.border, color: c.text, backgroundColor: c.bg }]}
              placeholder="Quantity to add" placeholderTextColor={c.muted}
              value={restockQty} onChangeText={setRestockQty} keyboardType="numeric" autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.btn, { backgroundColor: c.primary }]} onPress={submitRestock} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirm</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: c.border }]} onPress={() => setRestockItem(null)}>
                <Text style={[s.cancelBtnText, { color: c.muted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={s.sheetOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[s.sheet, { backgroundColor: c.card }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[s.modalTitle, { color: c.text }]}>Add New Item</Text>
              {[
                { key: 'name',         label: 'Item Name',        keyboard: 'default' },
                { key: 'brand',        label: 'Brand',            keyboard: 'default' },
                { key: 'unit_cost',    label: 'Unit Cost (₱)',    keyboard: 'numeric' },
                { key: 'retail_price', label: 'Retail Price (₱)', keyboard: 'numeric' },
                { key: 'stock',        label: 'Stock Level',      keyboard: 'numeric' },
                { key: 'reorder',      label: 'Reorder Level',    keyboard: 'numeric' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 12 }}>
                  <Text style={[s.fieldLabel, { color: c.muted }]}>{f.label}</Text>
                  <TextInput
                    style={[s.modalInput, { borderColor: c.border, color: c.text, backgroundColor: c.bg }]}
                    value={form[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard} placeholderTextColor={c.muted}
                  />
                </View>
              ))}
              <Text style={[s.fieldLabel, { color: c.muted }]}>Category</Text>
              <View style={s.catChipWrap}>
                {CATEGORIES.map(cat => {
                  const selected = form.category.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[s.catChip, { borderColor: c.border, backgroundColor: selected ? c.primary : c.bg },
                        selected && { borderColor: c.primary }]}
                      onPress={() => setForm(p => ({
                        ...p,
                        category: selected ? p.category.filter(x => x !== cat) : [...p.category, cat]
                      }))}
                    >
                      <Text style={[s.catChipText, { color: selected ? '#fff' : c.muted }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={s.modalBtns}>
                <TouchableOpacity style={[s.btn, { backgroundColor: c.primary }]} onPress={submitAdd} disabled={formSaving}>
                  {formSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Save Item</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.cancelBtn, { borderColor: c.border }]} onPress={() => setShowAdd(false)}>
                  <Text style={[s.cancelBtnText, { color: c.muted }]}>Cancel</Text>
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
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow:      { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0 },
  statQ:         { flex: 1 },
  toolbar:       { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'center' },
  search:        { flex: 1, borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 9, fontSize: 14 },
  addBtn:        { borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText:    { color: '#fff', fontWeight: font.black, fontSize: 13 },
  list:          { padding: 12, paddingTop: 0, gap: 10 },
  row:           { borderRadius: radius.md, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  rowLeft:       { flex: 1, marginRight: 10 },
  rowName:       { fontSize: 14, fontWeight: font.bold },
  rowMeta:       { fontSize: 11, marginTop: 2 },
  rowPrice:      { fontSize: 13, fontWeight: font.black, marginTop: 4 },
  rowRight:      { alignItems: 'flex-end', gap: 6 },
  badgeWrap:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText:     { fontSize: 11, fontWeight: font.black },
  rowStock:      { fontSize: 12 },
  restockBtn:    { borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  restockBtnText:{ fontSize: 11, fontWeight: font.bold },
  empty:         { textAlign: 'center', padding: 40 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal:         { borderRadius: 24, padding: 24, width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  sheetOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, maxHeight: '85%' },
  modalTitle:    { fontSize: 18, fontWeight: font.black, marginBottom: 4 },
  modalSub:      { fontSize: 13, marginBottom: 8 },
  modalInput:    { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  modalBtns:     { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn:           { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  btnText:       { color: '#fff', fontWeight: font.black, fontSize: 15 },
  cancelBtn:     { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontWeight: font.bold, fontSize: 15 },
  fieldLabel:    { fontSize: 11, fontWeight: font.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  catChipWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1.5 },
  catChipText:   { fontSize: 12, fontWeight: font.semibold },
});
