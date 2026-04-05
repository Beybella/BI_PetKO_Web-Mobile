import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './components/App';
import './app.css';

createRoot(document.getElementById('app')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
