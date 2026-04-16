import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '../config';

export default async function authFetch(path, options = {}) {
  const token = await SecureStore.getItemAsync('petko_token');
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
