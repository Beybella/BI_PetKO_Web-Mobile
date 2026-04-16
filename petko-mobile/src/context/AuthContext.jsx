import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  const doLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync('petko_token').catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  // Restore token on app launch
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('petko_token');
        if (!saved) { setLoading(false); return; }
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${saved}`, Accept: 'application/json' },
        });
        if (res.status === 401) { await doLogout(); setLoading(false); return; }
        const u = await res.json();
        setToken(saved);
        setUser(u);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const res  = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed.');
    await SecureStore.setItemAsync('petko_token', json.token);
    setToken(json.token);
    setUser(json.user);
    return json.user;
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).catch(() => {});
    await doLogout();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
