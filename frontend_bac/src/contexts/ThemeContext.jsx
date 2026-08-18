import React, { createContext, useState, useContext, useEffect } from 'react';

// Theme options available to the user (same as in ThemeManager.jsx)
export const themeOptions = [
  {
    id: 'royal',
    label: 'Royal Blue',
    color: '#0a0a23',
    textColor: '#ffffff',
    accentColor: '#3d3dbd',
    secondaryColor: '#11112a'
  },
  {
    id: 'emerald',
    label: 'Emerald',
    color: '#064e3b',
    textColor: '#ffffff',
    accentColor: '#10b981',
    secondaryColor: '#065f46'
  },
  {
    id: 'amber',
    label: 'Gold Rush',
    color: '#78350f',
    textColor: '#ffffff',
    accentColor: '#f59e0b',
    secondaryColor: '#92400e'
  },
  {
    id: 'rose',
    label: 'Rose Gold',
    color: '#881337',
    textColor: '#ffffff',
    accentColor: '#fb7185',
    secondaryColor: '#9f1239'
  },
  {
    id: 'slate',
    label: 'Modern Dark',
    color: '#0f172a',
    textColor: '#ffffff',
    accentColor: '#64748b',
    secondaryColor: '#1e293b'
  }
];

// Create the context with default values
export const ThemeContext = createContext({
  theme: 'royal',
  setTheme: () => {},
  themeData: themeOptions[0],
  enableAnimations: true,
  setEnableAnimations: () => {},
  darkMode: true,
  setDarkMode: () => {}
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load from localStorage if available
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { theme: savedTheme } = JSON.parse(savedSettings);
        return savedTheme || 'royal';
      } catch (e) {
        return 'royal';
      }
    }
    return 'royal';
  });
  
  const [enableAnimations, setEnableAnimations] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { enableAnimations } = JSON.parse(savedSettings);
        return enableAnimations !== undefined ? enableAnimations : true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { darkMode } = JSON.parse(savedSettings);
        return darkMode !== undefined ? darkMode : true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  
  // Get the current theme data
  const themeData = themeOptions.find(t => t.id === theme) || themeOptions[0];
  
  // Apply theme whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', themeData.color);
    root.style.setProperty('--text-color', themeData.textColor);
    root.style.setProperty('--accent-color', themeData.accentColor);
    root.style.setProperty('--secondary-color', themeData.secondaryColor);
    root.style.setProperty('--highlight-glow', `0 0 15px ${themeData.accentColor}40`);
    
    // Update transitions based on animation setting
    if (enableAnimations) {
      root.style.setProperty('--transition-speed', '0.3s');
    } else {
      root.style.setProperty('--transition-speed', '0s');
    }
    
    // Add or remove dark mode class
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Log theme application
    console.log('Theme applied:', themeData.label, `(Animations: ${enableAnimations ? 'On' : 'Off'}, Dark Mode: ${darkMode ? 'On' : 'Off'})`);
  }, [themeData, enableAnimations, darkMode]);
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      themeData,
      enableAnimations,
      setEnableAnimations,
      darkMode,
      setDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 