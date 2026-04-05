import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('petko_token'));
  const [loading, setLoading] = useState(true);

  const doLogout = useCallback(() => {
    localStorage.removeItem('petko_token');
    localStorage.removeItem('petko_last_active');
    setToken(null);
    setUser(null);
  }, []);

  // Check session timeout on activity
  useEffect(() => {
    const checkTimeout = () => {
      const last = parseInt(localStorage.getItem('petko_last_active') || '0');
      if (last && Date.now() - last > SESSION_TIMEOUT) {
        doLogout();
      } else {
        localStorage.setItem('petko_last_active', Date.now());
      }
    };
    const events = ['click', 'keydown', 'mousemove'];
    events.forEach(e => window.addEventListener(e, checkTimeout, { passive: true }));
    const interval = setInterval(checkTimeout, 60000);
    return () => {
      events.forEach(e => window.removeEventListener(e, checkTimeout));
      clearInterval(interval);
    };
  }, [doLogout]);

  // Verify token on load
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })
      .then(r => {
        if (r.status === 401) { doLogout(); return null; }
        return r.ok ? r.json() : null;
      })
      .then(u => { setUser(u); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [token]);

  // Global 401 interceptor
  useEffect(() => {
    const _fetch = window.fetch;
    window.fetch = async (url, opts = {}) => {
      const t = localStorage.getItem('petko_token');
      if (typeof url === 'string' && url.startsWith('/api') && t) {
        opts.headers = { ...opts.headers, Authorization: `Bearer ${t}` };
      }
      const res = await _fetch(url, opts);
      if (res.status === 401 && url !== '/api/login') {
        doLogout();
      }
      return res;
    };
    return () => { window.fetch = _fetch; };
  }, [doLogout]);

  const login = async (email, password) => {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || Object.values(json.errors || {})[0]?.[0] || 'Login failed.');
    localStorage.setItem('petko_token', json.token);
    localStorage.setItem('petko_last_active', Date.now());
    setToken(json.token);
    setUser(json.user);
    return json.user;
  };

  const logout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    }).catch(() => {});
    doLogout();
  };

  const changePassword = async (current, next) => {
    const res  = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to change password.');
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
