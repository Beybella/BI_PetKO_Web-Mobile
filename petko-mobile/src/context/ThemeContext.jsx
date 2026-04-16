import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('petko_dark').then(v => { if (v === 'true') setDark(true); });
  }, []);

  const toggle = () => {
    setDark(d => {
      AsyncStorage.setItem('petko_dark', String(!d));
      return !d;
    });
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
