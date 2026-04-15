import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import { IconAnalytics } from './IconsAll';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg)' }}>
      <div style={{ textAlign:'center', color:'var(--muted)' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>🐾</div>
        <p>Loading PetKO...</p>
      </div>
    </div>
  );

  return user ? <Dashboard /> : <Login />;
}
