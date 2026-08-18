import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Save, AlertCircle, Mail } from 'lucide-react';

// Backend API URL
const API_URL = 'http://localhost:5000';

function SecuritySettings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Test API connection on component mount
  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connection...');
        const response = await fetch(`${API_URL}/api/security/test`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('Test response status:', response.status);
        console.log('Test response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Test response data:', data);
      } catch (err) {
        console.error('API test failed:', err);
      }
    };
    
    testAPI();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match if changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate email format if changing email
    if (formData.newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending request to update account...');  // Debug log
      const response = await fetch(`${API_URL}/api/security/update-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newUsername: formData.newUsername,
          newEmail: formData.newEmail,
          newPassword: formData.newPassword
        })
      });

      console.log('Response status:', response.status);  // Debug log
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));  // Debug log

      let data;
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);  // Debug log

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);  // Debug log
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);  // Debug log
        throw new Error('Server response was not JSON');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      setSuccess('Account updated successfully');
      setFormData({
        currentPassword: '',
        newUsername: '',
        newEmail: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.message || 'An error occurred while updating your account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a3a]/50 p-6 rounded-lg border border-[#3d3dbd]/30">
        <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
          <Lock size={20} className="text-[#ffd700]" />
          Account Security
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
              placeholder="Enter your current password"
            />
          </div>

          {/* New Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Username (Optional)
            </label>
            <input
              type="text"
              name="newUsername"
              value={formData.newUsername}
              onChange={handleChange}
              className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
              placeholder="Enter new username"
            />
          </div>

          {/* New Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Email (Optional)
            </label>
            <div className="relative">
              <input
                type="email"
                name="newEmail"
                value={formData.newEmail}
                onChange={handleChange}
                className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 pl-10 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
                placeholder="Enter new email address"
              />
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Password (Optional)
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
              placeholder="Enter new password"
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-[#1a1a3a] border border-[#3d3dbd]/30 rounded-lg p-2.5 text-white focus:ring-[#ffd700]/50 focus:border-[#ffd700]/50"
              placeholder="Confirm new password"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 p-3 rounded-lg">
              <AlertCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? 'Updating...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SecuritySettings; 