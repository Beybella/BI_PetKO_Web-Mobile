import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconAnalytics, IconWarning, IconCheck } from './IconsAll';

export default function Login() {
  const { login }       = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.png" alt="PetKO" style={{ height: 72, objectFit: 'contain', marginBottom: 8 }} />
          <p className="login-sub">Everything Your Pets Need, All in One Place.</p>
        </div>

        <form onSubmit={submit} className="login-form">
          <div className="add-form-field">
            <label>Email</label>
            <input
              className="modal-input"
              type="email"
              placeholder="admin@petko.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required autoFocus
            />
          </div>
          <div className="add-form-field">
            <label>Password</label>
            <input
              className="modal-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error"><IconWarning size={16} style={{marginRight:4}} /> {error}</p>}

          <button className="checkout-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : (<><IconCheck size={16} style={{marginRight:4}} />Sign In</>)}
          </button>
        </form>

      </div>
    </div>
  );
}
