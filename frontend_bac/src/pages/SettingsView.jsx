import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Store,
  Users,
  Palette,
  Lock,
  Bell,
  Database,
  Globe,
  Save,
  X
} from 'lucide-react';
import api from '../services/api';
import { authenticatedFetch } from '../utils/auth';

// Import components
import ShopBrandingComponent from '../components/ShopBranding';
import UserManagement from '../components/UserManagement';
import LiveWallpaperManager from '../components/LiveWallpaperManager';
import SecuritySettings from '../components/SecuritySettings';
import NotificationSettings from '../components/NotificationSettings';
import DataManagement from '../components/DataManagement';
import Integrations from '../components/Integrations';

function SettingsView() {
  // State for the active settings section
  const [activeSection, setActiveSection] = useState('general');
  // Shop Info state
  const [shopInfo, setShopInfo] = useState({
    shop_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo: null
  });
  
  // User Settings state
  const [userSettings, setUserSettings] = useState({
    darkMode: true,
    notifications: true,
    language: 'en',
    currency: 'INR'
  });

  // User role for permissions
  const [userRole, setUserRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sections configuration
  const sections = [
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'branding', name: 'Shop Branding', icon: Store },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'data', name: 'Data Management', icon: Database },
    { id: 'integrations', name: 'Integrations', icon: Globe }
  ];

  // Load user role and settings from localStorage or session on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
    
    // Load user settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setUserSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
      } catch (error) {
        console.error('Error parsing user settings:', error);
      }
    }
  }, []);

  // Load shop settings on mount
  useEffect(() => {
    const loadShopSettings = async () => {
      try {
        const settings = await api.getShopSettings();
        if (settings) {
          setShopInfo(settings);
        }
      } catch (err) {
        console.error('Error loading shop settings:', err);
        setError('Failed to load shop settings');
      }
    };

    loadShopSettings();
  }, []);

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings logic would go here
    console.log('Saving settings:', {
      activeSection,
      shopInfo,
      userSettings
    });
  };

  // Handle file change for logo upload
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setShopInfo({
        ...shopInfo,
        logo: URL.createObjectURL(file)
      });
    }
  };

  // Handle save settings from ShopBranding component
  const handleSaveSettings = async (data) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
    if (data.type === 'branding') {
        await api.saveShopSettings({
          shop_name: data.data.shopName,
          contact_email: data.data.contactEmail,
          contact_phone: data.data.contactPhone,
          address: data.data.address
        });

      setShopInfo({
        ...shopInfo,
          shop_name: data.data.shopName,
          contact_email: data.data.contactEmail,
          contact_phone: data.data.contactPhone,
        address: data.data.address
      });
      
        setSuccess('Shop branding updated successfully!');
    } 
    else if (data.type === 'wallpaper') {
        const settings = {
        ...userSettings,
        wallpaper: data.data.wallpaper,
        enableInteractivity: data.data.enableInteractivity,
        showGradient: data.data.showGradient,
        enableAnimations: data.data.enableAnimations
        };

        await api.saveNotificationSettings(settings);
        setUserSettings(settings);
        setSuccess('Appearance settings updated successfully!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // General Settings Section
  const GeneralSettings = () => {
    const [settings, setSettings] = useState({
      language: userSettings.language || 'en',
      currency: userSettings.currency || 'INR',
      timezone: userSettings.timezone || 'Asia/Kolkata',
      dateFormat: userSettings.dateFormat || 'DD/MM/YYYY',
      price_at_add_item: true,
      price_at_billing: false,
      show_weight_input: true,
    });

    useEffect(() => {
      const fetchUserPreferences = async () => {
        try {
          const data = await authenticatedFetch('/api/user/preferences');
          if (data) {
            setSettings(prev => ({
              ...prev,
              price_at_add_item: data.price_at_add_item,
              price_at_billing: data.price_at_billing,
              show_weight_input: data.show_weight_input,
            }));
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      };

      fetchUserPreferences();
    }, []);

    const handleSaveSettings = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');
      setSuccess('');

      try {
        // Send all user-specific preferences to the user preferences endpoint
        await authenticatedFetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language: settings.language,
            currency: settings.currency,
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
            price_at_add_item: settings.price_at_add_item,
            price_at_billing: settings.price_at_billing,
            show_weight_input: settings.show_weight_input,
          })
        });

        // Update the userSettings state in the parent component (optional, but good practice)
        // Consider adding a prop to GeneralSettings to pass this update back
        // For now, we'll just update the local state and show success
        setUserSettings(prev => ({ ...prev, ...settings }));

        setSuccess('Settings saved successfully!');
      } catch (err) {
        console.error('Error saving settings:', err);
        setError(err.message || 'Failed to save settings');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
              <select 
                className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
                value={settings.language}
                onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
              <select 
                className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Zone</label>
              <select 
                className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                <option value="America/New_York">America/New_York (GMT-4)</option>
                <option value="Europe/London">Europe/London (GMT+1)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date Format</label>
              <select 
                className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
                value={settings.dateFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Price Input Preferences</h3>
          <div className="bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Enter price when adding item</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.price_at_add_item}
                    onChange={(e) => setSettings(prev => ({ ...prev, price_at_add_item: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Enter price at billing</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.price_at_billing}
                    onChange={(e) => setSettings(prev => ({ ...prev, price_at_billing: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* New Section for Item Input Preferences */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Item Input Preferences</h3>
          <div className="bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Show Weight Input in Add Item View</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.show_weight_input}
                    onChange={(e) => setSettings(prev => ({ ...prev, show_weight_input: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>
              {/* Add other item input toggles here later */}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-lg">
            {success}
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-4 border-t border-[#3d3dbd]/30">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </form>
    );
  };

  // Placeholder for other sections
  const SectionPlaceholder = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-[#1a1a3a]/50 rounded-lg border border-[#3d3dbd]/30">
      <h3 className="text-xl font-medium text-[#ffd700]">{title} Settings</h3>
      <p className="text-gray-400 mt-2">This section is under development</p>
    </div>
  );

  // Render the appropriate content based on the active section
  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettings />;
      case 'branding':
        return <ShopBrandingComponent 
          shopName={shopInfo.shop_name} 
          shopLogo={shopInfo.logo}
          onSaveSettings={handleSaveSettings}
        />;
      case 'users':
        return <UserManagement userRole={userRole} />;
      case 'appearance':
        return <LiveWallpaperManager 
          currentWallpaper={userSettings.wallpaper || 'cosmic-purple'} 
          onSaveSettings={handleSaveSettings}
        />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'data':
        return <DataManagement />;
      case 'integrations':
        return <Integrations />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff9d00] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
        Settings
      </h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg overflow-hidden">
            <ul>
              {sections.map((section) => (
                <motion.li 
                  key={section.id}
                  whileHover={{ backgroundColor: 'rgba(61, 61, 189, 0.2)', x: 3 }}
                >
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeSection === section.id 
                        ? 'bg-[#1a1a3a] text-[#ffd700] border-l-4 border-[#ffd700]' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <section.icon size={18} className={activeSection === section.id ? 'text-[#ffd700]' : 'text-gray-400'} />
                    <span>{section.name}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-black/30 backdrop-blur-lg p-6 rounded-xl border border-white/10 shadow-lg">
            <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
              {sections.find(s => s.id === activeSection)?.icon && 
                React.createElement(sections.find(s => s.id === activeSection).icon, {
                  size: 20,
                  className: "text-[#ffd700]"
                })
              }
              {sections.find(s => s.id === activeSection)?.name || 'General'} Settings
            </h3>
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsView; 