import React, { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Bell, AlertTriangle, Bell as BellIcon, DollarSign, ShoppingBag, X, Check, Save } from 'lucide-react';

// Create a context for notification management
export const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearAllNotifications: () => {},
  markAllAsRead: () => {},
  hasUnread: false,
  settings: {},
  updateSettings: () => {}
});

// Custom hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

// NotificationProvider component to wrap around the app
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState({
    lowStock: {},
    priceChanges: [],
    orders: {}
  });
  const [settings, setSettings] = useState({
    lowStockThreshold: 5,
    emailNotifications: false,
    pushNotifications: true,
    minPriceChange: 1,
    checkFrequency: '15',
    newOrders: true,
    soundAlerts: true,
    smsNotifications: false
  });

  // Check for unread notifications
  const hasUnread = notifications.some(notification => !notification.read);

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
    
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    
    // Update notification history based on type
    if (notification.type === 'low-stock') {
      setNotificationHistory(prev => ({
        ...prev,
        lowStock: {
          ...prev.lowStock,
          [notification.itemId]: notification
        }
      }));
    } else if (notification.type === 'price-change') {
      setNotificationHistory(prev => ({
        ...prev,
        priceChanges: [...prev.priceChanges, notification]
      }));
    } else if (notification.type === 'new-order') {
      setNotificationHistory(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          [notification.orderId]: notification
        }
      }));
    }
    
    // Play sound if enabled
    if (settings.soundAlerts) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Notification sound could not be played', e));
    }
    
    return newNotification.id;
  };

  // Remove a notification
  const removeNotification = (notificationId) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };

  // Update notification settings
  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Check for low stock items periodically
  useEffect(() => {
    // This would be connected to your inventory management system
    const checkLowStockItems = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/get_items');
        const items = response.data;
        
        for (const item of items) {
          // Check if item is low on stock and not already notified
          if (
            item.stock <= settings.lowStockThreshold && 
            !notificationHistory.lowStock[item.id]
          ) {
            addNotification({
              type: 'low-stock',
              title: 'Low Stock Alert',
              message: `${item.name} is running low on stock (${item.stock} remaining)`,
              itemId: item.id,
              itemName: item.name,
              currentStock: item.stock
            });
          }
        }
      } catch (error) {
        console.error('Failed to check for low stock items:', error);
      }
    };

    // Initial check
    checkLowStockItems();
    
    // Set up interval for checking (based on settings)
    const intervalId = setInterval(
      checkLowStockItems, 
      parseInt(settings.checkFrequency) * 60 * 1000
    );
    
    return () => clearInterval(intervalId);
  }, [settings.lowStockThreshold, settings.checkFrequency]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        addNotification, 
        removeNotification, 
        clearAllNotifications, 
        markAllAsRead, 
        hasUnread,
        settings,
        updateSettings
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// NotificationManager component for settings
const NotificationManager = ({ onSaveSettings }) => {
  const { settings, updateSettings } = useNotifications();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when context settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange }) => (
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
  );

  // Handle saving notification settings
  const saveNotificationSettings = async () => {
    setIsSaving(true);
    
    try {
      // Update global context
      updateSettings(localSettings);
      
      // Call the provided callback for parent component
      if (onSaveSettings) {
        onSaveSettings({ 
          type: 'notifications', 
          data: localSettings 
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('Notification settings saved:', localSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Notifications Settings</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={saveNotificationSettings}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            saveSuccess 
              ? 'bg-green-600 text-white' 
              : 'bg-[#3d3dbd] hover:bg-[#4d4dcd] text-white'
          }`}
        >
          {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>
      
      {/* Stock Alerts Section */}
      <div className="bg-[#11112a] border border-[#3d3dbd]/30 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-3">Stock Alerts</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Low stock threshold</label>
            <div className="flex items-center">
              <input 
                type="number" 
                min="1" 
                max="100"
                value={localSettings.lowStockThreshold}
                onChange={(e) => setLocalSettings({
                  ...localSettings, 
                  lowStockThreshold: parseInt(e.target.value)
                })}
                className="w-16 px-2 py-1 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white text-center"
              />
              <span className="ml-2 text-gray-400">items</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Email notifications</label>
            <ToggleSwitch 
              enabled={localSettings.emailNotifications} 
              onChange={(value) => setLocalSettings({
                ...localSettings,
                emailNotifications: value
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Push notifications</label>
            <ToggleSwitch 
              enabled={localSettings.pushNotifications} 
              onChange={(value) => setLocalSettings({
                ...localSettings,
                pushNotifications: value
              })}
            />
          </div>
        </div>
      </div>
      
      {/* Price Change Alerts Section */}
      <div className="bg-[#11112a] border border-[#3d3dbd]/30 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-3">Price Change Alerts</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Minimum price change</label>
            <div className="flex items-center">
              <input 
                type="number" 
                min="0.1" 
                max="10"
                step="0.1"
                value={localSettings.minPriceChange}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  minPriceChange: parseFloat(e.target.value)
                })}
                className="w-16 px-2 py-1 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white text-center"
              />
              <span className="ml-2 text-gray-400">%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Check frequency</label>
            <select 
              value={localSettings.checkFrequency}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                checkFrequency: e.target.value
              })}
              className="px-2 py-1 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
            >
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Order Notifications Section */}
      <div className="bg-[#11112a] border border-[#3d3dbd]/30 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-3">Order Notifications</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-300">New orders</label>
            <ToggleSwitch 
              enabled={localSettings.newOrders} 
              onChange={(value) => setLocalSettings({
                ...localSettings,
                newOrders: value
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Sound alerts</label>
            <ToggleSwitch 
              enabled={localSettings.soundAlerts} 
              onChange={(value) => setLocalSettings({
                ...localSettings,
                soundAlerts: value
              })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-gray-300">SMS notifications</label>
            <ToggleSwitch 
              enabled={localSettings.smsNotifications} 
              onChange={(value) => setLocalSettings({
                ...localSettings,
                smsNotifications: value
              })}
            />
          </div>
        </div>
      </div>
      
      {/* Testing/Preview Section */}
      <div className="bg-[#11112a] border border-[#3d3dbd]/30 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-3">Notification Preview</h4>
        <div className="space-y-3">
          <div className="bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg p-3 flex items-start">
            <AlertTriangle className="text-amber-500 mt-1 mr-3 flex-shrink-0" size={18} />
            <div>
              <h5 className="text-white text-sm font-medium">Low Stock Alert</h5>
              <p className="text-gray-400 text-xs mt-1">Diamond Ring is running low on stock (3 remaining)</p>
            </div>
          </div>
          
          <div className="bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg p-3 flex items-start">
            <DollarSign className="text-green-500 mt-1 mr-3 flex-shrink-0" size={18} />
            <div>
              <h5 className="text-white text-sm font-medium">Price Change</h5>
              <p className="text-gray-400 text-xs mt-1">Gold price increased by 2.5% to ₹5,125 per gram</p>
            </div>
          </div>
          
          <div className="bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg p-3 flex items-start">
            <ShoppingBag className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={18} />
            <div>
              <h5 className="text-white text-sm font-medium">New Order Received</h5>
              <p className="text-gray-400 text-xs mt-1">Order #1234 placed by Ansh Gaur for ₹25,000</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button 
            onClick={() => {
              // Test notification
              const { addNotification } = useNotifications();
              addNotification({
                type: 'test',
                title: 'Test Notification',
                message: 'This is a test notification',
                icon: <Bell size={18} />
              });
            }}
            className="px-4 py-2 bg-[#3d3dbd] hover:bg-[#4d4dcd] text-white rounded-lg inline-flex items-center gap-2 text-sm"
          >
            <Bell size={16} />
            <span>Send Test Notification</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// NotificationDisplay component for showing the current notifications
export const NotificationDisplay = () => {
  const { 
    notifications, 
    removeNotification, 
    clearAllNotifications, 
    markAllAsRead,
    hasUnread
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Group notifications by type
  const groupedNotifications = {
    'low-stock': notifications.filter(n => n.type === 'low-stock'),
    'price-change': notifications.filter(n => n.type === 'price-change'),
    'new-order': notifications.filter(n => n.type === 'new-order'),
    'test': notifications.filter(n => n.type === 'test')
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Execute the notification's action if it exists
    if (notification.action) {
      notification.action();
    }
    
    // Mark as read
    notification.read = true;
    
    // Close the panel
    setIsOpen(false);
  };

  // Get relative time for notification
  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white"
      >
        <BellIcon size={20} />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#11112a] border border-[#3d3dbd]/30 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-[#3d3dbd]/30 flex justify-between items-center">
            <h3 className="font-medium text-white">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-gray-400 hover:text-white"
              >
                Mark all as read
              </button>
              <button
                onClick={clearAllNotifications}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <BellIcon size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div>
                {Object.entries(groupedNotifications).map(([type, typeNotifications]) => {
                  if (typeNotifications.length === 0) return null;
                  
                  return (
                    <div key={type}>
                      <div className="px-3 py-2 bg-[#0a0a23] text-xs text-gray-300 uppercase flex justify-between">
                        <span>
                          {type === 'low-stock' && 'Low Stock Alerts'}
                          {type === 'price-change' && 'Price Changes'}
                          {type === 'new-order' && 'New Orders'}
                          {type === 'test' && 'Test Notifications'}
                        </span>
                        <span>{typeNotifications.length}</span>
                      </div>
                      
                      {typeNotifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-[#3d3dbd]/10 hover:bg-[#1a1a3a] cursor-pointer ${
                            notification.read ? 'opacity-70' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex">
                              <div className="mt-1 mr-3">
                                {type === 'low-stock' && <AlertTriangle size={16} className="text-amber-500" />}
                                {type === 'price-change' && <DollarSign size={16} className="text-green-500" />}
                                {type === 'new-order' && <ShoppingBag size={16} className="text-blue-500" />}
                                {type === 'test' && <Bell size={16} className="text-purple-500" />}
                              </div>
                              <div>
                                <h5 className="text-sm text-white">{notification.title}</h5>
                                <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {getRelativeTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="text-xs text-blue-400">New</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManager; 