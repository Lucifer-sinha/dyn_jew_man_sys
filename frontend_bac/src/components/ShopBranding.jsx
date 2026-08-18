import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Camera, Trash2, Save } from 'lucide-react';

const API_URL = 'http://localhost:5000';

const ShopBranding = ({ shopName, shopLogo, onSaveSettings }) => {
  const [localShopName, setLocalShopName] = useState(shopName || localStorage.getItem('shopName') || 'AURUMBILL');
  const [localShopLogo, setLocalShopLogo] = useState(shopLogo || localStorage.getItem('shopLogo'));
  const [contactEmail, setContactEmail] = useState(localStorage.getItem('contactEmail') || '');
  const [contactPhone, setContactPhone] = useState(localStorage.getItem('contactPhone') || '');
  const [address, setAddress] = useState(localStorage.getItem('address') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shop/settings`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setLocalShopName(data.name || '');
          setContactEmail(data.email || '');
          setContactPhone(data.contact || '');
          setAddress(data.address || '');
        }
      } catch (err) {
        console.error('Error loading shop settings:', err);
      }
    };

    loadSavedData();
  }, []);

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLocalShopLogo(base64String);
        localStorage.setItem('shopLogo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle saving shop branding
  const handleSaveBranding = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      if (!localShopName.trim()) {
        setError('Shop name is required');
        return;
      }

      if (!contactEmail.trim()) {
        setError('Contact email is required');
        return;
      }

      if (!contactPhone.trim()) {
        setError('Contact phone is required');
        return;
      }

      if (!address.trim()) {
        setError('Address is required');
        return;
      }

      // Save to backend
      const response = await fetch(`${API_URL}/api/shop/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: localShopName,
          email: contactEmail,
          contact: contactPhone,
          address: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save shop settings');
      }

      // Save to localStorage
      localStorage.setItem('shopName', localShopName);
      localStorage.setItem('contactEmail', contactEmail);
      localStorage.setItem('contactPhone', contactPhone);
      localStorage.setItem('address', address);
      
      // Call the provided callback
      if (onSaveSettings) {
        onSaveSettings({ 
          type: 'branding', 
          data: { 
            shopName: localShopName, 
            shopLogo: localShopLogo,
            contactEmail,
            contactPhone,
            address
          } 
        });
      }
      
      setSuccess('Shop branding saved successfully!');
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error saving branding:', error);
      setError(error.message || 'Error saving branding');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Shop Branding Settings</h3>
      </div>
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h4 className="text-white font-medium mb-4">Shop Name</h4>
                <input
                  type="text"
                  value={localShopName}
                  onChange={(e) => setLocalShopName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
                  placeholder="Enter shop name"
                />
              </div>
              
              <div>
            <h4 className="text-white font-medium mb-4">Shop Address</h4>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
              placeholder="Enter shop address"
              rows={3}
                />
              </div>
              
              <div>
            <h4 className="text-white font-medium mb-4">Contact Number</h4>
                <input
              type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
                  placeholder="+91 1234567890"
                />
              </div>
              
              <div>
            <h4 className="text-white font-medium mb-4">Email</h4>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
              placeholder="contact@example.com"
                />
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-4">Shop Logo</h4>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg flex items-center justify-center overflow-hidden">
                {localShopLogo ? (
                  <img 
                    src={localShopLogo} 
                    alt="Shop logo" 
                    className="max-w-full max-h-full object-contain" 
                  />
                ) : (
                  <div className="text-center">
                    <Crown size={48} className="mx-auto text-[#ffd700] mb-2" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center justify-center px-4 py-2 bg-[#1a1a3a] hover:bg-[#242452] border border-[#3d3dbd]/30 rounded-lg text-white cursor-pointer">
                  <Camera size={18} className="mr-2" />
                  <span>Choose File</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange} 
                    className="hidden" 
                  />
                </label>
                
                <div className="text-gray-400 text-sm">
                  {localShopLogo ? "File chosen" : "No file chosen"}
              </div>
              
              {localShopLogo && (
                <button
                    onClick={() => {
                      setLocalShopLogo(null);
                      localStorage.removeItem('shopLogo');
                    }}
                    className="flex items-center justify-center px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded-lg text-red-400"
                >
                  <Trash2 size={18} className="mr-2" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
          </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-900/30 border border-green-500/30 text-green-400 p-4 rounded-lg">
          {success}
        </div>
      )}
          
      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveBranding}
          disabled={isSaving}
          className="px-6 py-3 bg-[#ffd700] hover:bg-[#ffaa00] text-black font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Branding'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ShopBranding; 