import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../config';

export default function useApi(path) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('petko_token');
      const res   = await fetch(`${API_BASE}${path}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Request failed');
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, [path]);

  return { data, loading, error, refetch };
}
