import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconKey, Users } from './IconsAll';

const EMPTY = { name: '', email: '', password: '', role: 'staff' };

export default function UserManagement() {
  const { token, user: me, changePassword } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showPwChange, setShowPwChange] = useState(false);
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg]     = useState('');
  const [pwErr, setPwErr]     = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const load = () => {
    fetch('/api/users', { headers })
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    if (!form.name || !form.email || !form.password) { setError('Fill in all fields.'); return; }
    setError(''); setSaving(true);
    try {
      const res  = await fetch('/api/users', { method: 'POST', headers, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) { setError(json.message || 'Failed.'); return; }
      setShowAdd(false); setForm(EMPTY); load();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  };

  const submitDelete = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE', headers });
    setDeleteId(null); load();
  };

  const submitPwChange = async () => {
    if (!pwForm.current || !pwForm.next) { setPwErr('Fill in all fields.'); return; }
    if (pwForm.next !== pwForm.confirm)  { setPwErr('New passwords do not match.'); return; }
    setPwErr('');
    try {
      await changePassword(pwForm.current, pwForm.next);
      setPwMsg('Password changed successfully!');
      setPwForm({ current:'', next:'', confirm:'' });
      setTimeout(() => { setPwMsg(''); setShowPwChange(false); }, 2000);
    } catch (e) { setPwErr(e.message); }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <>
      <div className="card">
        <div className="inv-toolbar" style={{ marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="chart-card-title"><Users size={18} style={{marginRight:6}} /> User Management</div>
            <div className="chart-card-sub">{users.length} account{users.length !== 1 ? 's' : ''}</div>
          </div>
          <button className="add-item-btn" onClick={() => { setShowAdd(true); setForm(EMPTY); setAddError(''); }}>
            + Add User
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'low' : 'ok'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '.8rem' }}>
                    {new Date(u.created_at).toLocaleDateString('en-PH')}
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button className="delete-btn" onClick={() => setDeleteId(u.id)}>🗑️ Remove</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4 }}><Users size={18} style={{marginRight:6}} /> Add User</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginBottom: 16 }}>Create a new staff or admin account.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'name',     label: 'Full Name',  type: 'text',     placeholder: 'e.g. Maria Santos' },
                { key: 'email',    label: 'Email',      type: 'email',    placeholder: 'e.g. maria@petko.com' },
                { key: 'password', label: 'Password',   type: 'password', placeholder: 'Min. 6 characters' },
              ].map(f => (
                <div key={f.key} className="add-form-field">
                  <label>{f.label}</label>
                  <input className="modal-input" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="add-form-field">
                <label>Role</label>
                <select className="modal-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p style={{ color: 'var(--primary)', fontSize: '.82rem', marginTop: 8 }}>⚠️ {error}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="checkout-btn" style={{ flex: 1 }} onClick={submitAdd} disabled={saving}>
                {saving ? 'Saving...' : '✓ Create User'}
              </button>
              <button className="inv-close-btn" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Remove User</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 20 }}>
              Are you sure you want to remove this user? They will lose access immediately.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="checkout-btn" style={{ flex: 1 }} onClick={() => submitDelete(deleteId)}>Yes, Remove</button>
              <button className="inv-close-btn" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="chart-card-header">
          <div className="chart-card-title"><IconKey size={18} style={{marginRight:6}} /> Change My Password</div>
          <button className="edit-btn" onClick={() => setShowPwChange(v => !v)}>
            {showPwChange ? 'Cancel' : 'Change'}
          </button>
        </div>
        {showPwChange && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:14 }}>
            {[
              { key:'current', label:'Current Password',  type:'password' },
              { key:'next',    label:'New Password',      type:'password' },
              { key:'confirm', label:'Confirm New Password', type:'password' },
            ].map(f => (
              <div key={f.key} className="add-form-field">
                <label>{f.label}</label>
                <input className="modal-input" type={f.type} value={pwForm[f.key]}
                  onChange={e => setPwForm(p => ({...p, [f.key]: e.target.value}))} />
              </div>
            ))}
            {pwErr && <p style={{ color:'var(--primary)', fontSize:'.82rem' }}>⚠️ {pwErr}</p>}
            {pwMsg && <p style={{ color:'var(--green)',   fontSize:'.82rem' }}>✓ {pwMsg}</p>}
            <button className="checkout-btn" onClick={submitPwChange}>Update Password</button>
          </div>
        )}
      </div>
    </>
  );
}
