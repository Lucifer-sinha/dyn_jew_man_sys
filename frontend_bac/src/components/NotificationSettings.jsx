import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBell, FiMail, FiShield, FiAlertTriangle, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { authenticatedFetch } from '../utils/auth';

function NotificationSettings() {
    const [settings, setSettings] = useState({
        push: {
            enabled: true,
            lowStock: true,
            orderUpdates: true,
            priceUpdates: true,
            securityAlerts: true
        },
        email: {
            enabled: true,
            lowStock: true,
            orderUpdates: true,
            priceUpdates: true,
            securityAlerts: true
        }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch('/api/notifications/settings');
            if (response.settings) {
                setSettings(response.settings);
            }
        } catch (err) {
            console.error('Error fetching notification settings:', err);
            setError('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (type, key, value) => {
        try {
            const newSettings = {
                ...settings,
                [type]: {
                    ...settings[type],
                    [key]: value
                }
            };
            
            const response = await authenticatedFetch('/api/notifications/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: {
                        push: newSettings.push,
                        email: newSettings.email
                    }
                })
            });
            
            if (response.settings) {
                setSettings(response.settings);
            } else {
                setSettings(newSettings);
            }
        } catch (err) {
            console.error('Error updating notification settings:', err);
            setError('Failed to update settings');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f3ba19]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-[#f3ba19]">Notification Settings</h3>
                <FiBell className="text-[#f3ba19] h-6 w-6" />
            </div>

            {/* Push Notifications */}
            <div className="bg-[#11112a]/90 backdrop-blur-md border border-[#1a1a3a] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <FiBell className="text-[#f3ba19] h-5 w-5" />
                        <h4 className="text-white font-medium">Push Notifications</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.push.enabled}
                            onChange={(e) => updateSettings('push', 'enabled', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f3ba19]"></div>
                    </label>
                        </div>

                {settings.push.enabled && (
                    <div className="space-y-3">
                        <NotificationToggle
                            icon={<FiAlertTriangle />}
                            label="Low Stock Alerts"
                            checked={settings.push.lowStock}
                            onChange={(checked) => updateSettings('push', 'lowStock', checked)}
                        />
                        <NotificationToggle
                            icon={<FiShoppingBag />}
                            label="Order Updates"
                            checked={settings.push.orderUpdates}
                            onChange={(checked) => updateSettings('push', 'orderUpdates', checked)}
                        />
                        <NotificationToggle
                            icon={<FiDollarSign />}
                            label="Price Updates"
                            checked={settings.push.priceUpdates}
                            onChange={(checked) => updateSettings('push', 'priceUpdates', checked)}
                        />
                        <NotificationToggle
                            icon={<FiShield />}
                            label="Security Alerts"
                            checked={settings.push.securityAlerts}
                            onChange={(checked) => updateSettings('push', 'securityAlerts', checked)}
                        />
                            </div>
                        )}
                    </div>

            {/* Email Notifications */}
            <div className="bg-[#11112a]/90 backdrop-blur-md border border-[#1a1a3a] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <FiMail className="text-[#f3ba19] h-5 w-5" />
                        <h4 className="text-white font-medium">Email Notifications</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settings.email.enabled}
                            onChange={(e) => updateSettings('email', 'enabled', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f3ba19]"></div>
                    </label>
                        </div>

                {settings.email.enabled && (
                    <div className="space-y-3">
                        <NotificationToggle
                            icon={<FiAlertTriangle />}
                            label="Low Stock Alerts"
                            checked={settings.email.lowStock}
                            onChange={(checked) => updateSettings('email', 'lowStock', checked)}
                        />
                        <NotificationToggle
                            icon={<FiShoppingBag />}
                            label="Order Updates"
                            checked={settings.email.orderUpdates}
                            onChange={(checked) => updateSettings('email', 'orderUpdates', checked)}
                        />
                        <NotificationToggle
                            icon={<FiDollarSign />}
                            label="Price Updates"
                            checked={settings.email.priceUpdates}
                            onChange={(checked) => updateSettings('email', 'priceUpdates', checked)}
                        />
                        <NotificationToggle
                            icon={<FiShield />}
                            label="Security Alerts"
                            checked={settings.email.securityAlerts}
                            onChange={(checked) => updateSettings('email', 'securityAlerts', checked)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper component for notification toggles
function NotificationToggle({ icon, label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className="text-gray-400">{icon}</div>
                <span className="text-gray-300">{label}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f3ba19]"></div>
            </label>
        </div>
    );
}

export default NotificationSettings; 