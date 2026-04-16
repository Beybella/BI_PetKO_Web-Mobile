import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, radius, font } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.paw}>🐾</Text>
        <Text style={s.title}>Pet<Text style={{ color: colors.yellow }}>KO</Text></Text>
        <Text style={s.sub}>Everything Your Pets Need, All in One Place.</Text>

        <Text style={s.label}>EMAIL</Text>
        <TextInput
          style={s.input} placeholder="admin@petko.com" placeholderTextColor={colors.muted}
          value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" autoCorrect={false}
        />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input} placeholder="••••••••" placeholderTextColor={colors.muted}
          value={password} onChangeText={setPassword} secureTextEntry={true}
        />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Sign In</Text>
          }
        </TouchableOpacity>

        <Text style={s.hint}>admin@petko.com · staff@petko.com</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page:    { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:    { backgroundColor: colors.card, borderRadius: radius.lg, padding: 32, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  paw:     { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  title:   { fontSize: 32, fontWeight: font.black, color: colors.primary, textAlign: 'center', letterSpacing: -1 },
  sub:     { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 28, marginTop: 4 },
  label:   { fontSize: 11, fontWeight: font.bold, color: colors.muted, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  input:   { borderWidth: 2, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: colors.text, marginBottom: 16, backgroundColor: '#fff' },
  btn:     { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: 8, shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  btnText: { color: '#fff', fontWeight: font.black, fontSize: 16 },
  hint:    { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 20 },
});
