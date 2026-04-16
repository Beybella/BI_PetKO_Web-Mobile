import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import useApi from '../hooks/useApi';
import authFetch from '../hooks/useAuthFetch';
import { IconCart, IconSearch, IconBox, IconWarning, IconCheck, IconCatFood, IconDogFood } from '../components/Icons';
import { printReceipt } from '../utils/printPDF';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, font } from '../theme';

const fmt = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const CATEGORIES = ['All', 'Cat Food', 'Dog Food', 'Hygiene', 'Medical', 'Accessories', 'Treats/Snacks'];
const { width: SCREEN_W } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_W - 52) / 4; // 4 columns

const CAT_ICON = {
  'All':           (c) => <MaterialCommunityIcons name="paw"                    size={16} color={c} />,
  'Cat Food':      (c) => <MaterialCommunityIcons name="cat"                    size={16} color={c} />,
  'Dog Food':      (c) => <MaterialCommunityIcons name="dog"                    size={16} color={c} />,
  'Hygiene':       (c) => <MaterialCommunityIcons name="shower-head"            size={16} color={c} />,
  'Medical':       (c) => <MaterialCommunityIcons name="medical-bag"            size={16} color={c} />,
  'Accessories':   (c) => <MaterialCommunityIcons name="shopping-outline"       size={16} color={c} />,
  'Treats/Snacks': (c) => <MaterialCommunityIcons name="food-drumstick-outline" size={16} color={c} />,
};

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
  const [showCart, setShowCart]   = useState(false);

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

  const subtotal   = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const disc       = parseFloat(discount) || 0;
  const total      = Math.max(0, subtotal - disc);
  const cashNum    = parseFloat(cash) || 0;
  const change     = cashNum - total;
  const cartCount  = cart.reduce((s, c) => s + c.qty, 0);

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
  const updateQty = (id, delta) => setCart(p => p.map(c => {
    if (c.id !== id) return c;
    const newQty = c.qty + delta;
    if (newQty <= 0) return { ...c, qty: 0 };
    if (newQty > c.stock) return c; // cap at stock
    return { ...c, qty: newQty };
  }).filter(c => c.qty > 0));

  const checkout = async () => {
    if (!cart.length) { Alert.alert('Cart is empty'); return; }
    if (cashNum < total) { Alert.alert('Insufficient cash', 'Cash received is less than total.'); return; }
    setProcessing(true);
    try {
      const res  = await authFetch('/api/pos/transaction', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
          cash_tendered: cashNum, discount: disc,
        }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert('Error', json.error || 'Transaction failed.'); return; }
      setInventory(prev => prev ? prev.map(i => {
        const sold = cart.find(c => c.id === i.id);
        return sold ? { ...i, stock: Math.max(0, i.stock - sold.qty) } : i;
      }) : prev);
      setReceipt({ ...json, cartSnapshot: [...cart], discount: disc, total, change });
      setCart([]); setCash(''); setDiscount(''); setShowCart(false);
    } catch { Alert.alert('Network error', 'Please try again.'); }
    finally { setProcessing(false); }
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={colors.primary} size={36} />
    </View>
  );

  // ── Receipt ──────────────────────────────────────────────────────────────
  if (receipt) return (
    <ScrollView style={s.page} contentContainerStyle={s.receiptContent}>
      <View style={s.receiptBanner}>
        <MaterialCommunityIcons name="check-circle" size={48} color={colors.green} />
        <Text style={s.receiptBannerTitle}>Transaction Complete!</Text>
        <Text style={s.receiptRef}>Ref: {receipt.transaction_id}</Text>
      </View>
      <View style={s.receiptCard}>
        <Text style={s.receiptShop}>🐾 PetKO</Text>
        <Text style={s.receiptSubtitle}>Official Receipt</Text>
        <View style={s.receiptDivider} />
        {receipt.cartSnapshot.map((item, i) => (
          <View key={i} style={s.receiptRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.receiptItemName}>{item.name}</Text>
              <Text style={s.receiptItemSub}>× {item.qty} @ {fmt(item.price)}</Text>
            </View>
            <Text style={s.receiptItemAmt}>{fmt(item.qty * item.price)}</Text>
          </View>
        ))}
        <View style={s.receiptDivider} />
        {receipt.discount > 0 && (
          <View style={s.receiptTotalRow}>
            <Text style={{ color: colors.muted }}>Discount</Text>
            <Text style={{ color: colors.muted }}>-{fmt(receipt.discount)}</Text>
          </View>
        )}
        <View style={s.receiptTotalRow}>
          <Text style={s.receiptTotalLabel}>Total</Text>
          <Text style={s.receiptTotalAmt}>{fmt(receipt.total)}</Text>
        </View>
        <View style={s.receiptTotalRow}>
          <Text style={{ color: colors.muted }}>Cash</Text>
          <Text>{fmt(receipt.cash_tendered)}</Text>
        </View>
        <View style={[s.receiptTotalRow, { marginTop: 4 }]}>
          <Text style={{ color: colors.green, fontWeight: font.black }}>Change</Text>
          <Text style={{ color: colors.green, fontWeight: font.black, fontSize: 18 }}>{fmt(receipt.change)}</Text>
        </View>
      </View>
      <TouchableOpacity style={s.newTxnBtn} onPress={() => setReceipt(null)} activeOpacity={0.85}>
        <Text style={s.newTxnBtnText}>+ New Transaction</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.printBtn} onPress={() => printReceipt(receipt)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="printer-outline" size={18} color={colors.primary} />
        <Text style={s.printBtnText}>Print / Share Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Main POS ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>

          {/* ── Top bar ── */}
          <View style={s.topBar}>
            <View style={s.searchBox}>
              <IconSearch size={16} color={colors.muted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search products..."
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={s.cartBtn} onPress={() => setShowCart(true)} activeOpacity={0.85}>
              <IconCart size={20} color="#fff" />
              {cartCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Category tabs ── */}
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}
            style={s.catScroll} contentContainerStyle={s.catContent}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat}
                style={[s.catTab, activeCat === cat && s.catTabActive]}
                onPress={() => setActiveCat(cat)}>
                <View style={s.catEmoji}>
                  {(CAT_ICON[cat] ?? CAT_ICON['All'])(activeCat === cat ? '#fff' : colors.muted)}
                </View>
                <Text style={[s.catTabText, activeCat === cat && s.catTabTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Product tiles ── */}
          <FlatList
            data={displayed}
            keyExtractor={i => String(i.id)}
            numColumns={4}
            contentContainerStyle={s.tilesGrid}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyText}>No products found</Text>
              </View>
            }
            renderItem={({ item }) => {
              const inCart  = cart.find(c => c.id === item.id);
              const outOfStock = item.stock === 0;
              return (
                <TouchableOpacity
                  style={[s.tile, outOfStock && s.tileOut, inCart && s.tileInCart]}
                  onPress={() => { if (!outOfStock) { addToCart(item); } }}
                  disabled={outOfStock}
                  activeOpacity={0.75}
                >
                  {/* In-cart qty badge */}
                  {inCart && (
                    <View style={s.tileBadge}>
                      <Text style={s.tileBadgeText}>{inCart.qty}</Text>
                    </View>
                  )}

                  {/* Category icon */}
                  <View style={s.tileIcon}>
                    {(CAT_ICON[(item.category || '').split(',')[0]?.trim()] ?? CAT_ICON['All'])(inCart ? colors.green : colors.primary)}
                  </View>

                  {/* Name */}
                  <Text style={s.tileName} numberOfLines={2}>{item.name}</Text>

                  {/* Brand */}
                  <Text style={s.tileBrand} numberOfLines={1}>{item.brand}</Text>

                  {/* Price */}
                  <Text style={s.tilePrice}>{fmt(item.retail_price)}</Text>

                  {/* Stock */}
                  <Text style={[
                    s.tileStock,
                    outOfStock && { color: colors.danger },
                    !outOfStock && item.stock <= item.reorder && { color: '#d97706' },
                  ]}>
                    {outOfStock ? '✕ Out' : `${item.stock} left`}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* ── Bottom checkout bar (when cart has items) ── */}
          {cart.length > 0 && !showCart && (
            <TouchableOpacity style={s.floatingCartBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
              <View style={s.floatingLeft}>
                <Text style={s.floatingCount}>{cartCount} item{cartCount > 1 ? 's' : ''}</Text>
                <Text style={s.floatingTotal}>{fmt(total)}</Text>
              </View>
              <Text style={s.floatingCta}>View Cart →</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ── Cart Sheet ── */}
      {showCart && (
        <View style={s.cartSheet}>
          {/* Header */}
          <View style={s.cartHeader}>
            <Text style={s.cartTitle}>🛒 Cart ({cartCount})</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Text style={s.cartClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          <ScrollView style={s.cartItems} keyboardShouldPersistTaps="handled">
            {cart.map(item => (
              <View key={item.id} style={s.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cartItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.cartItemPrice}>{fmt(item.price)} each</Text>
                </View>
                <View style={s.qtyControls}>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                    <Text style={s.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.qtyNum}>{item.qty}</Text>
                  <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                    <Text style={s.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.cartLineTotal}>{fmt(item.qty * item.price)}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Payment */}
          <View style={s.paySection}>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Subtotal</Text>
              <Text style={s.payValue}>{fmt(subtotal)}</Text>
            </View>
            <View style={s.payInputRow}>
              <View style={s.payInputWrap}>
                <Text style={s.payInputLabel}>Cash</Text>
                <TextInput style={s.payInput} value={cash} onChangeText={setCash}
                  keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted}
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              </View>
              <View style={s.payInputWrap}>
                <Text style={s.payInputLabel}>Discount</Text>
                <TextInput style={s.payInput} value={discount} onChangeText={setDiscount}
                  keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted}
                  returnKeyType="done" onSubmitEditing={Keyboard.dismiss} />
              </View>
            </View>
            <View style={[s.payRow, s.totalRow]}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalAmt}>{fmt(total)}</Text>
            </View>
            {cashNum > 0 && cashNum >= total && (
              <View style={s.changeRow}>
                <Text style={s.changeLabel}>Change</Text>
                <Text style={s.changeAmt}>{fmt(change)}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.checkoutBtn, (processing || cashNum < total) && s.checkoutBtnDisabled]}
              onPress={() => { Keyboard.dismiss(); checkout(); }}
              disabled={processing || cashNum < total}
              activeOpacity={0.85}
            >
              {processing
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.checkoutBtnText}>✓ Checkout · {fmt(total)}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.clearBtn} onPress={() => { setCart([]); setCash(''); setDiscount(''); setShowCart(false); }}>
              <Text style={s.clearBtnText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:              { flex: 1, backgroundColor: '#f5f5f5' },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar:            { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBox:         { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f5f5f5', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  searchInput:       { flex: 1, fontSize: 14, color: colors.text },
  cartBtn:           { backgroundColor: colors.primary, borderRadius: radius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartBadge:         { position: 'absolute', top: -4, right: -4, backgroundColor: colors.yellow, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText:     { fontSize: 10, fontWeight: font.black, color: colors.text },

  // Category tabs
  catScroll:         { maxHeight: 56, backgroundColor: '#fff' },
  catContent:        { paddingHorizontal: 10, paddingVertical: 6, gap: 6, alignItems: 'center' },
  catTab:            { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: '#f5f5f5', marginRight: 6, minWidth: 64 },
  catTabActive:      { backgroundColor: colors.primary },
  catEmoji:          { marginBottom: 2, height: 22, alignItems: 'center', justifyContent: 'center' },
  catTabText:        { fontSize: 10, fontWeight: font.bold, color: colors.muted },
  catTabTextActive:  { color: '#fff' },

  // Product tiles
  tilesGrid:         { padding: 8, paddingBottom: 100 },
  tile:              {
    width: TILE_SIZE, height: TILE_SIZE + 8,
    margin: 3, backgroundColor: '#fff',
    borderRadius: 12, padding: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#efefef',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
    position: 'relative',
  },
  tileOut:           { opacity: 0.4 },
  tileInCart:        { borderColor: colors.green, backgroundColor: '#f0fff7' },
  tileBadge:         { position: 'absolute', top: -6, right: -6, backgroundColor: colors.green, borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tileBadgeText:     { color: '#fff', fontSize: 11, fontWeight: font.black },
  tileIcon:          { marginBottom: 4, height: 20, alignItems: 'center', justifyContent: 'center' },
  tileName:          { fontSize: 13, fontWeight: font.bold, color: colors.text, textAlign: 'center', lineHeight: 13, marginBottom: 2, marginTop: 5 },
  tileBrand:         { fontSize: 11, color: colors.muted, textAlign: 'center', marginBottom: 3 },
  tilePrice:         { fontSize: 15, fontWeight: font.black, color: colors.primary, textAlign: 'center' },
  tileStock:         { fontSSize: 7, color: colors.green, fontWeight: font.semibold, marginTop: 1 },
  emptyWrap:         { padding: 60, alignItems: 'center' },
  emptyText:         { color: colors.muted, fontSize: 14 },

  // Floating cart bar
  floatingCartBar:   { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  floatingLeft:      { gap: 2 },
  floatingCount:     { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: font.semibold },
  floatingTotal:     { color: '#fff', fontSize: 18, fontWeight: font.black },
  floatingCta:       { color: '#fff', fontSize: 14, fontWeight: font.black },

  // Cart sheet
  cartSheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  cartHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cartTitle:         { fontSize: 18, fontWeight: font.black, color: colors.text },
  cartClose:         { fontSize: 18, color: colors.muted, padding: 4 },
  cartItems:         { maxHeight: 220, paddingHorizontal: 16 },
  cartRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  cartItemName:      { fontSize: 13, fontWeight: font.bold, color: colors.text },
  cartItemPrice:     { fontSize: 11, color: colors.muted, marginTop: 2 },
  qtyControls:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:            { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:        { fontSize: 16, fontWeight: font.black, color: colors.text, lineHeight: 18 },
  qtyNum:            { fontSize: 15, fontWeight: font.black, color: colors.text, minWidth: 24, textAlign: 'center' },
  cartLineTotal:     { fontSize: 13, fontWeight: font.black, color: colors.text, minWidth: 70, textAlign: 'right' },

  // Payment section
  paySection:        { padding: 16, paddingTop: 12 },
  payRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  payLabel:          { fontSize: 13, color: colors.muted },
  payValue:          { fontSize: 13, fontWeight: font.bold, color: colors.text },
  payInputRow:       { flexDirection: 'row', gap: 10, marginBottom: 10 },
  payInputWrap:      { flex: 1 },
  payInputLabel:     { fontSize: 11, fontWeight: font.bold, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  payInput:          { borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, color: colors.text, textAlign: 'right', backgroundColor: '#fff' },
  totalRow:          { borderTopWidth: 2, borderTopColor: colors.border, paddingTop: 10, marginTop: 4, marginBottom: 4 },
  totalLabel:        { fontSize: 16, fontWeight: font.black, color: colors.text },
  totalAmt:          { fontSize: 22, fontWeight: font.black, color: colors.primary },
  changeRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fff7', borderRadius: radius.md, padding: 10, marginBottom: 10 },
  changeLabel:       { fontSize: 14, fontWeight: font.bold, color: colors.green },
  changeAmt:         { fontSize: 20, fontWeight: font.black, color: colors.green },
  checkoutBtn:       { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 15, alignItems: 'center', marginBottom: 8, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  checkoutBtnDisabled:{ backgroundColor: '#ccc', shadowOpacity: 0 },
  checkoutBtnText:   { color: '#fff', fontWeight: font.black, fontSize: 16 },
  clearBtn:          { alignItems: 'center', paddingVertical: 8 },
  clearBtnText:      { color: colors.muted, fontSize: 13, fontWeight: font.semibold },

  // Receipt
  receiptContent:    { padding: 16, paddingBottom: 40 },
  receiptBanner:     { backgroundColor: '#f0fff7', borderWidth: 1.5, borderColor: '#b6f5d0', borderRadius: radius.lg, padding: 20, marginBottom: 16, alignItems: 'center' },
  receiptBannerTitle:{ fontSize: 18, fontWeight: font.black, color: colors.green },
  receiptRef:        { fontSize: 12, color: colors.muted, marginTop: 4 },
  receiptCard:       { backgroundColor: '#fff', borderRadius: radius.lg, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  receiptShop:       { fontSize: 24, fontWeight: font.black, textAlign: 'center', color: colors.primary },
  receiptSubtitle:   { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 12 },
  receiptDivider:    { borderTopWidth: 1.5, borderTopColor: colors.border, borderStyle: 'dashed', marginVertical: 12 },
  receiptRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  receiptItemName:   { fontSize: 13, fontWeight: font.bold, color: colors.text },
  receiptItemSub:    { fontSize: 11, color: colors.muted, marginTop: 2 },
  receiptItemAmt:    { fontSize: 13, fontWeight: font.bold, color: colors.text },
  receiptTotalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  receiptTotalLabel: { fontSize: 16, fontWeight: font.black, color: colors.text },
  receiptTotalAmt:   { fontSize: 22, fontWeight: font.black, color: colors.primary },
  newTxnBtn:         { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 15, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  newTxnBtnText:     { color: '#fff', fontWeight: font.black, fontSize: 16 },
  printBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 13, borderRadius: radius.full, borderWidth: 2, borderColor: colors.primary, backgroundColor: '#fff' },
  printBtnText:      { color: colors.primary, fontWeight: font.bold, fontSize: 15 },
});
