import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Check, Eye, EyeOff, Settings, Sparkles } from 'lucide-react';
import LiveBackground from './LiveBackground';
import { useWallpaper } from '../contexts/WallpaperContext';

// Memoize wallpaper presets to prevent recreation on each render
const wallpaperPresets = [
  {
    id: 'revenue-dashboard',
    label: 'Revenue Dashboard',
    backgroundColor: '#0E0E28',
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

// Memoized ToggleSwitch component
const ToggleSwitch = React.memo(({ enabled, onChange, label }) => (
  <div className="flex items-center justify-between mb-4">
    <label className="text-gray-300">{label}</label>
    <button 
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${enabled ? 'bg-blue-600' : 'bg-gray-700'} transition-colors duration-200`}
    >
      <span 
        className={`inline-block h-4 w-4 transform rounded-full bg-white ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } transition-transform duration-200`} 
      />
    </button>
  </div>
));

// Memoized Sparkle component
const Sparkle = React.memo(({ delay, size, left, top, duration, color }) => (
  <motion.div
    className="absolute rounded-full bg-white z-0 pointer-events-none"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 0], 
      scale: [0, 1, 0],
      x: [0, Math.random() * 20 - 10],
      y: [0, Math.random() * 20 - 10]
    }}
    transition={{ 
      repeat: Infinity, 
      duration, 
      delay 
    }}
    style={{ 
      width: size, 
      height: size, 
      left, 
      top,
      backgroundColor: color || 'white',
      boxShadow: `0 0 ${size * 0.8}px ${size * 0.4}px ${color || 'rgba(255, 255, 255, 0.8)'}`,
      filter: 'blur(0.5px)'
    }}
  />
));

const LiveWallpaperManager = ({ onSaveSettings }) => {
  const { 
    wallpaper: currentWallpaper, 
    setWallpaper,
    enableInteractivity, 
    setEnableInteractivity,
    showGradient, 
    setShowGradient,
    enableAnimations, 
    setEnableAnimations 
  } = useWallpaper();
  
  // Local state for form values
  const [selectedWallpaper, setSelectedWallpaper] = useState(currentWallpaper);
  const [localEnableInteractivity, setLocalEnableInteractivity] = useState(enableInteractivity);
  const [localShowGradient, setLocalShowGradient] = useState(showGradient);
  const [localEnableAnimations, setLocalEnableAnimations] = useState(enableAnimations);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewWallpaper, setPreviewWallpaper] = useState(null);
  
  // Keep local state in sync with context
  useEffect(() => {
    setSelectedWallpaper(currentWallpaper);
    setLocalEnableInteractivity(enableInteractivity);
    setLocalShowGradient(showGradient);
    setLocalEnableAnimations(enableAnimations);
  }, [currentWallpaper, enableInteractivity, showGradient, enableAnimations]);
  
  // Memoize wallpaper details lookup
  const getWallpaperDetails = useCallback((id) => {
    return wallpaperPresets.find(wp => wp.id === id) || wallpaperPresets[0];
  }, []);
  
  // Current wallpaper details
  const currentWallpaperDetails = useMemo(() => 
    getWallpaperDetails(selectedWallpaper),
    [selectedWallpaper, getWallpaperDetails]
  );
  
  // Memoize handlers
  const handleSaveWallpaper = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Apply all settings to context first
      setWallpaper(selectedWallpaper);
      setEnableInteractivity(localEnableInteractivity);
      setShowGradient(localShowGradient);
      setEnableAnimations(localEnableAnimations);
      
      // Prepare settings data for callback
      const wallpaperSettings = {
        wallpaper: selectedWallpaper,
        enableInteractivity: localEnableInteractivity,
        showGradient: localShowGradient,
        enableAnimations: localEnableAnimations
      };
      
      // Call the provided callback
      if (onSaveSettings) {
        onSaveSettings({
          type: 'wallpaper',
          data: wallpaperSettings
        });
      }
      
      // Trigger immediate update
      document.dispatchEvent(new Event('wallpaperChanged'));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving wallpaper settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedWallpaper,
    localEnableInteractivity,
    localShowGradient,
    localEnableAnimations,
    setWallpaper,
    setEnableInteractivity,
    setShowGradient,
    setEnableAnimations,
    onSaveSettings
  ]);

  // Memoize wallpaper selection handler
  const handleWallpaperSelect = useCallback((wallpaperId) => {
    setSelectedWallpaper(wallpaperId);
    
    // Apply immediately
    setWallpaper(wallpaperId);
    
    // Call the callback to persist
    if (onSaveSettings) {
      onSaveSettings({
        type: 'wallpaper',
        data: {
          wallpaper: wallpaperId,
          enableInteractivity: localEnableInteractivity,
          showGradient: localShowGradient,
          enableAnimations: localEnableAnimations
        }
      });
    }
    
    // Trigger immediate update
    document.dispatchEvent(new Event('wallpaperChanged'));
  }, [
    setWallpaper,
    onSaveSettings,
    localEnableInteractivity,
    localShowGradient,
    localEnableAnimations
  ]);

  // Memoize wallpaper grid items
  const wallpaperGridItems = useMemo(() => (
    wallpaperPresets.map((wallpaper) => (
      <motion.div 
        key={wallpaper.id}
        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
        onClick={() => handleWallpaperSelect(wallpaper.id)}
        onMouseEnter={() => setPreviewWallpaper(wallpaper.id)}
        onMouseLeave={() => setPreviewWallpaper(null)}
        className={`relative overflow-hidden rounded-lg cursor-pointer border h-36 ${
          selectedWallpaper === wallpaper.id 
            ? 'border-[#ffd700]' 
            : 'border-[#3d3dbd]/30'
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <LiveBackground
            backgroundColor={wallpaper.backgroundColor}
            particleColor={wallpaper.particleColor}
            particleEffect={wallpaper.particleEffect}
            particleDensity={wallpaper.particleDensity}
            enableInteractivity={false}
            particleCount={20}
          />
        </div>
        
        <div className="absolute inset-x-0 bottom-0 p-3 bg-black/50 backdrop-blur-sm">
          <h5 className="text-sm font-medium text-white">{wallpaper.label}</h5>
          <p className="text-xs text-gray-300 truncate">{wallpaper.description}</p>
        </div>
        
        {selectedWallpaper === wallpaper.id && (
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#ffd700] flex items-center justify-center">
            <Check size={12} className="text-black" />
          </div>
        )}
        
        {(selectedWallpaper === wallpaper.id || previewWallpaper === wallpaper.id) && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <Sparkle
                key={i}
                delay={Math.random() * 2}
                duration={1 + Math.random() * 2}
                size={1 + Math.random() * 2}
                left={`${Math.random() * 100}%`}
                top={`${Math.random() * 100}%`}
                color={wallpaper.particleColor}
              />
            ))}
          </div>
        )}
      </motion.div>
    ))
  ), [selectedWallpaper, previewWallpaper, handleWallpaperSelect]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Live Wallpaper</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveWallpaper}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            saveSuccess ? 'bg-green-600 text-white' : 'bg-[#3d3dbd] hover:bg-[#4d4dcd] text-white'
          }`}
        >
          {saveSuccess ? <Check size={18} /> : <Save size={18} />}
          <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}</span>
        </motion.button>
      </div>
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-[#ffd700]" />
          <h4 className="text-white font-medium">Wallpaper Selection</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallpaperGridItems}
        </div>
      </div>
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-[#ffd700]" />
          <h4 className="text-white font-medium">Wallpaper Settings</h4>
        </div>
        
        <div className="space-y-2 max-w-md mb-6">
          <ToggleSwitch 
            label="Enable mouse interactivity" 
            enabled={localEnableInteractivity} 
            onChange={setLocalEnableInteractivity} 
          />
          
          <ToggleSwitch 
            label="Show gradient effects" 
            enabled={localShowGradient} 
            onChange={setLocalShowGradient} 
          />
          
          <ToggleSwitch 
            label="Enable animations" 
            enabled={localEnableAnimations} 
            onChange={setLocalEnableAnimations} 
          />
        </div>
        
        <div className="mt-8">
          <h5 className="text-sm text-gray-400 mb-2">Current selection: <span className="text-white">{currentWallpaperDetails.label}</span></h5>
          <p className="text-xs text-gray-400">{currentWallpaperDetails.description}</p>
        </div>
      </div>
      
      {/* Wallpaper Preview */}
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={18} className="text-[#ffd700]" />
          <h4 className="text-white font-medium">Live Preview</h4>
        </div>
        
        <div className="relative h-64 rounded-lg overflow-hidden border border-[#3d3dbd]/30">
          <LiveBackground
            backgroundColor={currentWallpaperDetails.backgroundColor}
            particleColor={currentWallpaperDetails.particleColor}
            particleEffect={currentWallpaperDetails.particleEffect}
            particleDensity={currentWallpaperDetails.particleDensity}
            enableInteractivity={localEnableInteractivity}
            showGradient={localShowGradient}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/40 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/10">
              <h5 className="text-white text-lg mb-2">Wallpaper Preview</h5>
              <p className="text-gray-300 text-sm">Your selected wallpaper with current settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LiveWallpaperManager); 