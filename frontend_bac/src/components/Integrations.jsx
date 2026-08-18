import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, DollarSign, CreditCard, Mail, Save } from 'lucide-react';

function Integrations() {
  const [integrations, setIntegrations] = useState({
    shopify: {
      enabled: false,
      shopName: '',
      apiKey: '',
      apiSecret: ''
    },
    quickbooks: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      companyId: ''
    },
    stripe: {
      enabled: false,
      publishableKey: '',
      secretKey: ''
    },
    mailchimp: {
      enabled: false,
      apiKey: '',
      listId: ''
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    // Load saved integrations from localStorage
    const savedIntegrations = localStorage.getItem('integrations');
    if (savedIntegrations) {
      try {
        setIntegrations(JSON.parse(savedIntegrations));
      } catch (error) {
        console.error('Error loading integrations:', error);
      }
    }
  }, []);

  const handleToggle = (integration) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        enabled: !prev[integration].enabled
      }
    }));
  };

  const handleInputChange = (integration, field, value) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: {
        ...prev[integration],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:5000/api/integrations/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(integrations)
      });

      if (!response.ok) {
        throw new Error('Failed to save integration settings');
      }

      // Save to localStorage as backup
      localStorage.setItem('integrations', JSON.stringify(integrations));
      
      setStatus({
        type: 'success',
        message: 'Integration settings saved successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to save settings: ' + error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderIntegrationFields = (integration) => {
    const fields = {
      shopify: [
        { name: 'shopName', label: 'Shop Name', type: 'text' },
        { name: 'apiKey', label: 'API Key', type: 'password' },
        { name: 'apiSecret', label: 'API Secret', type: 'password' }
      ],
      quickbooks: [
        { name: 'clientId', label: 'Client ID', type: 'text' },
        { name: 'clientSecret', label: 'Client Secret', type: 'password' },
        { name: 'companyId', label: 'Company ID', type: 'text' }
      ],
      stripe: [
        { name: 'publishableKey', label: 'Publishable Key', type: 'text' },
        { name: 'secretKey', label: 'Secret Key', type: 'password' }
      ],
      mailchimp: [
        { name: 'apiKey', label: 'API Key', type: 'password' },
        { name: 'listId', label: 'List ID', type: 'text' }
      ]
    };

    return fields[integration].map(field => (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          {field.label}
        </label>
        <input
          type={field.type}
          value={integrations[integration][field.name]}
          onChange={(e) => handleInputChange(integration, field.name, e.target.value)}
          className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {status.message && (
        <div className={`p-4 rounded-lg ${
          status.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shopify Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#ffd700]" size={20} />
            <h4 className="text-lg font-medium text-[#ffd700]">Shopify</h4>
          </div>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable Shopify Integration</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrations.shopify.enabled}
                    onChange={() => handleToggle('shopify')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>

              {integrations.shopify.enabled && (
                <div className="space-y-4 pt-4">
                  {renderIntegrationFields('shopify')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QuickBooks Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-[#ffd700]" size={20} />
            <h4 className="text-lg font-medium text-[#ffd700]">QuickBooks</h4>
          </div>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable QuickBooks Integration</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrations.quickbooks.enabled}
                    onChange={() => handleToggle('quickbooks')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>

              {integrations.quickbooks.enabled && (
                <div className="space-y-4 pt-4">
                  {renderIntegrationFields('quickbooks')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stripe Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="text-[#ffd700]" size={20} />
            <h4 className="text-lg font-medium text-[#ffd700]">Stripe</h4>
          </div>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable Stripe Integration</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrations.stripe.enabled}
                    onChange={() => handleToggle('stripe')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>

              {integrations.stripe.enabled && (
                <div className="space-y-4 pt-4">
                  {renderIntegrationFields('stripe')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mailchimp Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="text-[#ffd700]" size={20} />
            <h4 className="text-lg font-medium text-[#ffd700]">Mailchimp</h4>
          </div>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable Mailchimp Integration</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integrations.mailchimp.enabled}
                    onChange={() => handleToggle('mailchimp')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ffd700]"></div>
                </label>
              </div>

              {integrations.mailchimp.enabled && (
                <div className="space-y-4 pt-4">
                  {renderIntegrationFields('mailchimp')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </div>
    </div>
  );
}

export default Integrations; 