import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Upload, Trash2, Save } from 'lucide-react';

function DataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleExport = async () => {
    setIsExporting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:5000/api/data/export', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jewelry-management-data.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setStatus({
        type: 'success',
        message: 'Data exported successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to export data: ' + error.message
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/api/data/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import data');
      }
      
      setStatus({
        type: 'success',
        message: 'Data imported successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to import data: ' + error.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:5000/api/data/backup', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create backup');
      }
      
      const data = await response.json();
      setStatus({
        type: 'success',
        message: 'Backup created successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to create backup: ' + error.message
      });
    } finally {
      setIsBackingUp(false);
    }
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
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#ffd700]">Data Export</h4>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <p className="text-gray-400 mb-4">
              Export your data in JSON format. This includes all your inventory, sales, and settings data.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              disabled={isExporting}
              className="w-full px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export Data'}
            </motion.button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#ffd700]">Data Import</h4>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <p className="text-gray-400 mb-4">
              Import data from a previously exported JSON file. This will overwrite your current data.
            </p>
            <label className="w-full px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
              <Upload size={16} />
              {isImporting ? 'Importing...' : 'Import Data'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#ffd700]">Database Backup</h4>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <p className="text-gray-400 mb-4">
              Create a backup of your database. This will save all your data to a secure location.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full px-4 py-2 bg-[#ffd700] text-[#1a1a3a] font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
            </motion.button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-medium text-[#ffd700]">Data Cleanup</h4>
          
          <div className="p-4 bg-[#1a1a3a] rounded-lg border border-[#3d3dbd]/30">
            <p className="text-gray-400 mb-4">
              Clean up old or unused data. This will permanently delete selected data.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
            >
              <Trash2 size={16} />
              Clean Up Data
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataManagement; 