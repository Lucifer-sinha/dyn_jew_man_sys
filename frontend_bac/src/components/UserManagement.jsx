import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Eye, EyeOff, Check, Save, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '../utils/auth';

const UserManagement = ({ userRole }) => {
  // State management
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // New user form
  const [newUser, setNewUser] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'staff' 
  });

  // Base API URL - change this to match your backend server
  const API_BASE_URL = 'http://127.0.0.1:5000';

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users from backend
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[fetchUsers] Calling authenticatedFetch for users..."); // Debug log
      // Use the authenticated fetch utility
      const data = await authenticatedFetch('/get_users');
      
      setUsers(data);
      
      // Save to localStorage for offline resilience
      saveUsersToLocalStorage(data);
      console.log('Users loaded from API:', data.length);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users from server');
      
      // Load from localStorage fallback
      try {
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
          setUsers(JSON.parse(savedUsers));
          console.log('Loaded users from localStorage');
        } else {
          setUsers([]);
        }
      } catch (localStorageErr) {
        console.error('Error loading from localStorage:', localStorageErr);
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save users to localStorage
  const saveUsersToLocalStorage = (updatedUsers) => {
    try {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  };

  // Handle adding a new user
  const handleAddUser = async () => {
    // Validate form
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      console.log("[handleAddUser] Calling authenticatedFetch to add user..."); // Debug log
      // Use the authenticated fetch utility
      const data = await authenticatedFetch('/add_user', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      
      // Check for specific success message from backend if needed
      // if (data.message?.includes('User created successfully')) {
      //   console.log('Backend confirmed user creation.');
      // }

      // Add the new user to the list (assuming backend returns the new user or its ID)
      // Note: The backend currently returns {'message': 'User created successfully', 'id': ...}
      // We should adjust the backend or adapt frontend to handle the response structure.
      // For now, assuming success if authenticatedFetch doesn't throw.

      // We might need to re-fetch the user list or update state based on the response.
      // For simplicity, let's assume we can update state with minimal info returned.
      // A more robust approach would re-fetch or get full user data from response.

      // Based on backend log showing {'id': response.data[0]['id']}, let's construct a temporary user object.
      const addedUserMinimal = { 
        id: data.id, // Assuming backend returns id in data
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        lastLogin: 'Never' // Or fetch/derive this if backend returns it
      };

      const updatedUsers = [...users, addedUserMinimal];
      setUsers(updatedUsers);
      
      // Save to localStorage for resilience
      saveUsersToLocalStorage(updatedUsers);
      
      // Reset form
      setNewUser({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'staff' 
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('User added successfully (frontend state updated). User ID:', data.id); // Log ID from backend response
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to add user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/delete_user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      // Remove user from the list
      const updatedUsers = users.filter(user => user._id !== userId);
      setUsers(updatedUsers);
      
      // Save to localStorage for resilience
      saveUsersToLocalStorage(updatedUsers);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('User deleted successfully:', userId);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date string or return 'Never' if null
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString || 'Never';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">User Management</h3>
        {saveSuccess && (
          <div className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center">
            <Check size={18} className="mr-2" />
            <span>Changes Saved!</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <h4 className="text-white font-medium mb-4">User List</h4>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner w-8 h-8 border-2 border-[#3d3dbd] border-t-[#ffd700] rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 bg-[#0a0a23]/50 rounded-lg border border-dashed border-[#3d3dbd]/30">
            <p className="text-gray-400">No users found. Add your first user below.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#3d3dbd]/30">
                  <th className="py-3 px-2 text-left text-gray-300 font-medium">Username</th>
                  <th className="py-3 px-2 text-left text-gray-300 font-medium">Email</th>
                  <th className="py-3 px-2 text-left text-gray-300 font-medium">Role</th>
                  <th className="py-3 px-2 text-left text-gray-300 font-medium">Last Login</th>
                  <th className="py-3 px-2 text-right text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[#3d3dbd]/10">
                    <td className="py-3 px-2 text-white">{user.username}</td>
                    <td className="py-3 px-2 text-white">{user.email}</td>
                    <td className="py-3 px-2 text-white">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-300">{formatDate(user.lastLogin || user.last_login)}</td>
                    <td className="py-3 px-2 text-right">
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300 ml-2 p-1 rounded-full hover:bg-red-500/10"
                        disabled={user.role === 'admin' && userRole !== 'admin'}
                        title={user.role === 'admin' && userRole !== 'admin' ? "Cannot delete admin user" : "Delete user"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Add a new user */}
      <div className="bg-[#11112a] rounded-lg p-6 border border-[#3d3dbd]/30">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-white font-medium">Add New User</h4>
          <button
            onClick={handleAddUser}
            disabled={isSaving}
            className="px-3 py-1.5 bg-[#ffd700] hover:bg-[#ffaa00] text-black rounded-lg flex items-center text-sm"
          >
            <UserPlus size={14} className="mr-1" />
            <span>{isSaving ? 'Adding...' : 'Add User'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Username</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
              placeholder="username"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
              placeholder="user@example.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full px-4 py-2 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg text-white"
            >
              <option value="staff">Staff</option>
              {userRole === 'admin' && (
                <option value="admin">Admin</option>
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 