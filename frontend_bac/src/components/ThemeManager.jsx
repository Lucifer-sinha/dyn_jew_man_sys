import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Check, PaintBucket, Moon, Sun } from 'lucide-react';
import { useTheme, themeOptions } from '../contexts/ThemeContext';
import ThemeDemo from './ThemeDemo';

const ThemeManager = ({ onSaveSettings }) => {
  // Get theme state from context
  const { 
    theme: currentTheme, 
    themeData,
    enableAnimations,
    darkMode
  } = useTheme();
  
  // Local state for form values
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [localEnableAnimations, setLocalEnableAnimations] = useState(enableAnimations);
  const [showPricesWithTax, setShowPricesWithTax] = useState(false);
  const [localEnableDarkMode, setLocalEnableDarkMode] = useState(darkMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, label }) => (
    <div className="flex items-center justify-between">
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
  );
  
  // Handle saving theme settings
  const handleSaveAppearance = async () => {
    setIsSaving(true);
    
    try {
      // Prepare settings data
      const appearanceSettings = {
        theme: selectedTheme,
        enableAnimations: localEnableAnimations,
        showPricesWithTax,
        enableDarkMode: localEnableDarkMode
      };
      
      // Call the provided callback
      if (onSaveSettings) {
        onSaveSettings({
          type: 'appearance',
          data: appearanceSettings
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('Theme settings saved:', appearanceSettings);
    } catch (error) {
      console.error('Error saving theme settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Appearance</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveAppearance}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            saveSuccess ? 'bg-green-600 text-white' : 'bg-[#3d3dbd] hover:bg-[#4d4dcd] text-white'
          }`}
        >
          {saveSuccess ? <Check size={18} /> : <Save size={18} />}
          <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Changes'}</span>
        </motion.button>
      </div>
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <h4 className="text-white font-medium mb-4">Theme Selection</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeOptions.map((theme) => (
            <div 
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`p-4 rounded-lg cursor-pointer border ${
                selectedTheme === theme.id 
                  ? 'border-[#ffd700]' 
                  : 'border-[#3d3dbd]/30'
              }`}
              style={{ 
                background: theme.color,
                color: theme.textColor 
              }}
            >
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium">{theme.label}</h5>
                {selectedTheme === theme.id && (
                  <div className="h-5 w-5 rounded-full bg-[#ffd700] flex items-center justify-center">
                    <Check size={12} className="text-black" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="h-6 w-6 rounded-full" style={{ background: theme.color }}></div>
                <div className="h-6 w-6 rounded-full" style={{ background: theme.secondaryColor }}></div>
                <div className="h-6 w-6 rounded-full" style={{ background: theme.accentColor }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <h4 className="text-white font-medium mb-4">Interface Settings</h4>
        
        <div className="space-y-4">
          <ToggleSwitch 
            label="Enable animations" 
            enabled={localEnableAnimations} 
            onChange={setLocalEnableAnimations} 
          />
          
          <ToggleSwitch 
            label="Show item prices with tax" 
            enabled={showPricesWithTax} 
            onChange={setShowPricesWithTax} 
          />
          
          <ToggleSwitch 
            label="Enable dark mode" 
            enabled={localEnableDarkMode} 
            onChange={setLocalEnableDarkMode} 
          />
        </div>
      </div>
      
      {/* Theme Demo */}
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <ThemeDemo />
      </div>
    </div>
  );
};

export default ThemeManager; 