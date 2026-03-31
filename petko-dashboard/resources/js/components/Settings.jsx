import React from 'react';

export default function Settings({ darkMode, setDarkMode }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card">
        <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>⚙️ Settings</h3>

        <div className="setting-row">
          <div>
            <div className="setting-label">Dark Mode</div>
            <div className="setting-sub">Switch between light and dark theme</div>
          </div>
          <button
            className={`toggle-btn ${darkMode ? 'on' : ''}`}
            onClick={() => setDarkMode(d => !d)}
            aria-label="Toggle dark mode"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="setting-divider" />

        <div className="setting-row muted-row">
          <div>
            <div className="setting-label">App Version</div>
            <div className="setting-sub">PetKO Dashboard v1.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
