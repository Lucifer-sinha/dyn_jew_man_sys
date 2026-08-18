import React, { createContext, useState, useContext, useEffect } from 'react';

// Wallpaper presets from LiveWallpaperManager component with vibrant colors
export const wallpaperPresets = [
  {
    id: 'revenue-dashboard',
    label: 'Revenue Dashboard',
    backgroundColor: '#0B0A2E',
    particleColor: '#FFD700',
    particleDensity: 'medium',
    particleEffect: 'stars',
    description: 'Financial dashboard theme with gold accents'
  },
  {
    id: 'cosmic-purple',
    label: 'Cosmic Purple',
    backgroundColor: '#2A0066',
    particleColor: '#C277FF',
    particleDensity: 'medium',
    particleEffect: 'default',
    description: 'Deep purple space with floating particles'
  },
  {
    id: 'midnight-blue',
    label: 'Midnight Blue',
    backgroundColor: '#00204F',
    particleColor: '#00E1FF',
    particleDensity: 'high',
    particleEffect: 'bubbles',
    description: 'Elegant deep blue with floating bubble particles'
  },
  {
    id: 'emerald-dream',
    label: 'Emerald Dream',
    backgroundColor: '#00502D',
    particleColor: '#0FFF95',
    particleDensity: 'medium',
    particleEffect: 'lines',
    description: 'Serene green environment with connected particles'
  },
  {
    id: 'ruby-fusion',
    label: 'Ruby Fusion',
    backgroundColor: '#700025',
    particleColor: '#FF5678',
    particleDensity: 'medium',
    particleEffect: 'default',
    description: 'Rich ruby red with dynamic floating particles'
  },
  {
    id: 'golden-luxury',
    label: 'Golden Luxury',
    backgroundColor: '#1A1000',
    particleColor: '#FFBB00',
    particleDensity: 'high',
    particleEffect: 'stars',
    description: 'Dark background with floating gold star particles'
  },
  {
    id: 'ocean-depths',
    label: 'Ocean Depths',
    backgroundColor: '#003848',
    particleColor: '#00E7FF',
    particleDensity: 'high',
    particleEffect: 'bubbles',
    description: 'Deep ocean theme with bubble particles'
  },
  {
    id: 'nebula-burst',
    label: 'Nebula Burst',
    backgroundColor: '#1A0033',
    particleColor: '#FF51A8',
    particleDensity: 'high',
    particleEffect: 'default',
    description: 'Cosmic nebula with pink particle elements'
  },
  {
    id: 'aurora-borealis',
    label: 'Aurora Borealis',
    backgroundColor: '#0F2C42',
    particleColor: '#38FFB3',
    particleDensity: 'medium',
    particleEffect: 'lines',
    description: 'Northern lights inspired theme with flowing lines'
  }
];

// Create the context with default values
export const WallpaperContext = createContext({
  wallpaper: 'revenue-dashboard',
  setWallpaper: () => {},
  wallpaperData: wallpaperPresets[0],
  enableInteractivity: true,
  setEnableInteractivity: () => {},
  showGradient: true,
  setShowGradient: () => {},
  enableAnimations: true,
  setEnableAnimations: () => {}
});

// Wallpaper provider component
export const WallpaperProvider = ({ children }) => {
  const [wallpaper, setWallpaper] = useState(() => {
    // Load from localStorage if available
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { wallpaper: savedWallpaper } = JSON.parse(savedSettings);
        return savedWallpaper || 'revenue-dashboard';
      } catch (e) {
        return 'revenue-dashboard';
      }
    }
    return 'revenue-dashboard';
  });
  
  const [enableInteractivity, setEnableInteractivity] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { enableInteractivity } = JSON.parse(savedSettings);
        return enableInteractivity !== undefined ? enableInteractivity : true;
      } catch (e) {
        return true;
      }
    }
    return true;
  });
  
  const [showGradient, setShowGradient] = useState(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const { showGradient } = JSON.parse(savedSettings);
        return showGradient !== undefined ? showGradient : true;
      } catch (e) {
        return true;
      }
    }
    return true;
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
  
  // Get the current wallpaper data
  const wallpaperData = wallpaperPresets.find(w => w.id === wallpaper) || wallpaperPresets[0];
  
  // Custom state setter that both updates state and triggers the change event
  const setWallpaperWithEvent = (newWallpaper) => {
    setWallpaper(newWallpaper);
    // Small delay to ensure state is updated before event is dispatched
    setTimeout(() => {
      document.dispatchEvent(new Event('wallpaperChanged'));
    }, 10);
  };
  
  const setEnableInteractivityWithEvent = (newValue) => {
    setEnableInteractivity(newValue);
    setTimeout(() => {
      document.dispatchEvent(new Event('wallpaperChanged'));
    }, 10);
  };
  
  const setShowGradientWithEvent = (newValue) => {
    setShowGradient(newValue);
    setTimeout(() => {
      document.dispatchEvent(new Event('wallpaperChanged'));
    }, 10);
  };
  
  const setEnableAnimationsWithEvent = (newValue) => {
    setEnableAnimations(newValue);
    setTimeout(() => {
      document.dispatchEvent(new Event('wallpaperChanged'));
    }, 10);
  };
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      // Get existing settings first
      const savedSettings = localStorage.getItem('userSettings');
      const existingSettings = savedSettings ? JSON.parse(savedSettings) : {};
      
      // Update with new wallpaper settings
      const updatedSettings = {
        ...existingSettings,
        wallpaper,
        enableInteractivity,
        showGradient,
        enableAnimations
      };
      
      // Save back to localStorage
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      console.log('Wallpaper settings saved and applied:', wallpaper);
      
      // Force a refresh to update the UI immediately
      document.dispatchEvent(new Event('wallpaperChanged'));
    } catch (error) {
      console.error('Error saving wallpaper settings to localStorage:', error);
    }
  }, [wallpaper, enableInteractivity, showGradient, enableAnimations]);
  
  return (
    <WallpaperContext.Provider value={{ 
      wallpaper, 
      setWallpaper: setWallpaperWithEvent, 
      wallpaperData,
      enableInteractivity,
      setEnableInteractivity: setEnableInteractivityWithEvent,
      showGradient,
      setShowGradient: setShowGradientWithEvent,
      enableAnimations,
      setEnableAnimations: setEnableAnimationsWithEvent
    }}>
      {children}
    </WallpaperContext.Provider>
  );
};

// Custom hook to use the wallpaper context
export const useWallpaper = () => useContext(WallpaperContext); 