import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import useApi from '../hooks/useApi';
import authFetch from '../hooks/useAuthFetch';
import { colors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const CATEGORIES = ['All', 'Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'];

export default function POSScreen() {
  const { data: apiInv, loading } = useApi('/api/inventory');
  const [inventory, setInventory] = useState(null);
  const [cart, setCart]           = useState([]);
  const [search, setSearch]       = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [cash, setCash]           = useState('');
  const [discount, setDiscount]   = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt]     = useState(null);

  useEffect(() => { if (apiInv) setInventory(apiInv); }, [apiInv]);

  const displayed = useMemo(() => {
    if (!inventory) return [];
    const q = search.toLowerCase();
    return inventory.filter(i => {
      const cats = (i.category || '').split(',').map(c => c.trim());
      return (!q || i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q))
        && (activeCat === 'All' || cats.includes(activeCat));
    });
  }, [inventory, search, activeCat]);

  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const disc     = parseFloat(discount) || 0;
  const total    = Math.max(0, subtotal - disc);
  const cashNum  = parseFloat(cash) || 0;
  const change   = cashNum - total;

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      if (ex) {
        if (ex.qty >= item.stock) return prev;
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1, price: item.retail_price }];
    });
  };

  const removeFromCart = (id) => setCart(p => p.filter(c => c.id !== id));

  const checkout = async () => {
    if (!cart.length) { Alert.alert('Cart is empty'); return; }
    if (cashNum < total) { Alert.alert('Insufficient cash', 'Cash received is less than total.'); return; }
    setProcessing(true);
    try {
      const res  = await authFetch('/api/pos/transaction', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
          cash_tendered: cashNum,
          discount: disc,
        }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert('Error', json.error || 'Transaction failed.'); return; }
      setInventory(prev => prev ? prev.map(i => {
        const sold = cart.find(c => c.id === i.id);
        return sold ? { ...i, stock: Math.max(0, i.stock - sold.qty) } : i;
      }) : prev);
      setReceipt({ ...json, cartSnapshot: [...cart], discount: disc, total, change });
      setCart([]); setCash(''); setDiscount('');
    } catch { Alert.alert('Network error', 'Please try again.'); }
    finally { setProcessing(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size={36} /></View>;

  if (receipt) return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.receiptBanner}>
        <Text style={s.receiptBannerText}>✅ Transaction Complete!</Text>
        <Text style={s.receiptRef}>Ref: {receipt.transaction_id}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.receiptShop}>🐾 PetKO</Text>
        <Text style={s.receiptSub}>Official Receipt</Text>
        {receipt.cartSnapshot.map((item, i) => (
          <View key={i} style={s.receiptRow}>
            <Text style={s.receiptItem}>{item.name} × {item.qty}</Text>
            <Text style={s.receiptAmt}>{fmt(item.qty * item.price)}</Text>
          </View>
        ))}
        <View style={[s.receiptRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }]}>
          <Text style={{ fontWeight: font.bold }}>Total</Text>
          <Text style={{ fontWeight: font.black, color: colors.primary }}>{fmt(receipt.total)}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={{ color: colors.muted }}>Cash</Text>
          <Text>{fmt(receipt.cash_tendered)}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={{ color: colors.green, fontWeight: font.bold }}>Change</Text>
          <Text style={{ color: colors.green, fontWeight: font.black }}>{fmt(receipt.change)}</Text>
        </View>
      </View>
      <TouchableOpacity style={s.btn} onPress={() => setReceipt(null)}>
        <Text style={s.btnText}>New Transaction</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={s.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View style={s.searchWrap}>
            <TextInput style={s.search} placeholder="Search products..." placeholderTextColor={colors.muted}
              value={search} onChangeText={setSearch} />
          </View>

          {/* Category tabs */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat} style={[s.catTab, activeCat === cat && s.catTabActive]}
                onPress={() => setActiveCat(cat)}>
                <Text style={[s.catTabText, activeCat === cat && s.catTabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product grid */}
          <FlatList
            data={displayed}
            keyExtractor={i => String(i.id)}
            numColumns={2}
            style={{ flex: 1 }}
            contentContainerStyle={s.grid}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const inCart = cart.find(c => c.id === item.id);
              return (
                <TouchableOpacity
                  style={[s.productCard, item.stock === 0 && s.outOfStock, inCart && s.inCart]}
                  onPress={() => { Keyboard.dismiss(); item.stock > 0 && addToCart(item); }}
                  disabled={item.stock === 0}
                  activeOpacity={0.8}
                >
                  {inCart && <View style={s.badge}><Text style={s.badgeText}>{inCart.qty}</Text></View>}
                  <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.productBrand}>{item.brand}</Text>
                  <View style={s.productFooter}>
                    <Text style={s.productPrice}>{fmt(item.retail_price)}</Text>
                    <Text style={[s.productStock, item.stock === 0 && { color: colors.danger }, item.stock <= item.reorder && { color: colors.warning }]}>
                      {item.stock === 0 ? 'Out' : `${item.stock} left`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<Text style={s.empty}>No products found</Text>}
          />

          {/* Cart summary */}
          {cart.length > 0 && (
            <View style={s.cartBar}>
              <ScrollView style={{ maxHeight: 140 }} keyboardShouldPersistTaps="handled">
                {cart.map(item => (
                  <View key={item.id} style={s.cartRow}>
                    <Text style={s.cartName} numberOfLines={1}>{item.name} × {item.qty}</Text>
                    <Text style={s.cartAmt}>{fmt(item.qty * item.price)}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                      <Text style={s.cartRemove}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <View style={s.payRow}>
                <TextInput
                  style={s.cashInput} placeholder="Cash" placeholderTextColor={colors.muted}
                  value={cash} onChangeText={setCash} keyboardType="numeric"
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
                />
                <TextInput
                  style={s.cashInput} placeholder="Discount" placeholderTextColor={colors.muted}
                  value={discount} onChangeText={setDiscount} keyboardType="numeric"
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total: <Text style={s.totalAmt}>{fmt(total)}</Text></Text>
                {cashNum >= total && cashNum > 0 && (
                  <Text style={s.changeText}>Change: {fmt(change)}</Text>
                )}
              </View>

              <TouchableOpacity style={s.btn} onPress={() => { Keyboard.dismiss(); checkout(); }} disabled={processing} activeOpacity={0.85}>
                {processing
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Checkout · {fmt(total)}</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:            { flex: 1, backgroundColor: colors.bg },
  content:         { padding: 16, paddingBottom: 40 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchWrap:      { padding: 12, paddingBottom: 0 },
  search:          { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.text },
  catScroll:       { maxHeight: 48, marginTop: 8 },
  catContent:      { paddingHorizontal: 12, gap: 6, alignItems: 'center' },
  catTab:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff', marginRight: 6 },
  catTabActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  catTabText:      { fontSize: 12, fontWeight: font.semibold, color: colors.muted },
  catTabTextActive:{ color: '#fff' },
  grid:            { padding: 10, gap: 10 },
  productCard:     { flex: 1, margin: 4, backgroundColor: '#fff', borderRadius: radius.md, padding: 12, borderWidth: 2, borderColor: colors.border, position: 'relative' },
  outOfStock:      { opacity: 0.45 },
  inCart:          { borderColor: colors.green, backgroundColor: '#f0fff7' },
  badge:           { position: 'absolute', top: -6, right: -6, backgroundColor: colors.green, borderRadius: 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  badgeText:       { color: '#fff', fontSize: 11, fontWeight: font.black },
  productName:     { fontSize: 13, fontWeight: font.bold, color: colors.text, marginBottom: 2 },
  productBrand:    { fontSize: 11, color: colors.muted, marginBottom: 6 },
  productFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice:    { fontSize: 13, fontWeight: font.black, color: colors.primary },
  productStock:    { fontSize: 11, color: colors.green, fontWeight: font.semibold },
  empty:           { textAlign: 'center', color: colors.muted, padding: 40 },
  cartBar:         { backgroundColor: '#fff', borderTopWidth: 1.5, borderTopColor: colors.border, padding: 12 },
  cartRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  cartName:        { flex: 1, fontSize: 13, color: colors.text },
  cartAmt:         { fontSize: 13, fontWeight: font.bold, color: colors.text },
  cartRemove:      { color: colors.muted, fontSize: 14, paddingHorizontal: 4 },
  payRow:          { flexDirection: 'row', gap: 10, marginTop: 8 },
  cashInput:       { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: colors.text, textAlign: 'right' },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  totalLabel:      { fontSize: 15, color: colors.text },
  totalAmt:        { fontWeight: font.black, color: colors.primary },
  changeText:      { fontSize: 13, color: colors.green, fontWeight: font.bold },
  btn:             { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 13, alignItems: 'center', marginTop: 10, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  btnText:         { color: '#fff', fontWeight: font.black, fontSize: 15 },
  receiptBanner:   { backgroundColor: '#f0fff7', borderWidth: 1.5, borderColor: '#b6f5d0', borderRadius: radius.md, padding: 16, marginBottom: 16, alignItems: 'center' },
  receiptBannerText:{ fontSize: 16, fontWeight: font.black, color: colors.green },
  receiptRef:      { fontSize: 12, color: colors.muted, marginTop: 4 },
  card:            { backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  receiptShop:     { fontSize: 22, fontWeight: font.black, textAlign: 'center', color: colors.primary },
  receiptSub:      { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  receiptRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  receiptItem:     { flex: 1, fontSize: 13, color: colors.text },
  receiptAmt:      { fontSize: 13, fontWeight: font.bold, color: colors.text },
});
