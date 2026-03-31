import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './components/Dashboard';
import './app.css';

createRoot(document.getElementById('app')).render(<Dashboard />);
