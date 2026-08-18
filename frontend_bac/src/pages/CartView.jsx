// src/pages/CartView.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, Edit2, Save, X } from 'lucide-react';
// Import authenticatedFetch
import { authenticatedFetch } from '../utils/auth';

// Helper function to format currency with Rupee symbol
const formatCurrency = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

function CartView({ cart, removeFromCart, handlePlaceOrder, orderDetails, setOrderDetails }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');

  // --- New State for User Preferences ---
  const [userPreferences, setUserPreferences] = useState({
    price_at_add_item: true, // Default
    price_at_billing: false, // Default
  });
  // --------------------------------------

  // Fetch cart items on mount (keeping existing)
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('http://localhost:5000/get_cart');
        if (!response.ok) {
          throw new Error('Failed to fetch cart items');
        }
        const data = await response.json();
        setCartItems(data);
      } catch (err) {
        console.error('Error fetching cart items:', err);
        setError('Failed to load cart items');
      }
    };

    fetchCartItems();
  }, []);

  // --- Fetch User Preferences ---
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const data = await authenticatedFetch('/api/user/preferences');
        if (data) {
          setUserPreferences(data);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // Optionally set an error state or handle the error
      }
    };

    fetchUserPreferences();
  }, []);
  // ------------------------------

  // Handle quantity change (keeping existing)
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/update_cart_item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId, quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove item (keeping existing)
  const handleRemoveItem = async (itemId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/remove_from_cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error removing item:', err);
      setError('Failed to remove item');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start editing price (keeping existing)
  const handleStartEditingPrice = (item) => {
    setEditingItemId(item.id);
    setEditedPrice(item.price.toString());
  };

  // Handle save edited price (keeping existing)
  const handleSaveEditedPrice = async (itemId) => {
    if (!editedPrice || isNaN(editedPrice) || parseFloat(editedPrice) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/update_cart_item_price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId, new_price: parseFloat(editedPrice) }),
      });

      if (!response.ok) {
        throw new Error('Failed to update price');
      }

      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, price: parseFloat(editedPrice) } : item
        )
      );
      setEditingItemId(null);
      setEditedPrice('');
    } catch (err) {
      console.error('Error updating price:', err);
      setError('Failed to update price');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel editing price (keeping existing)
  const handleCancelEditingPrice = () => {
    setEditingItemId(null);
    setEditedPrice('');
  };

  // Calculate total (keeping existing)
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[#f3ba19] mb-6">Your Cart</h2>
      
      {cartItems.length === 0 ? (
        <div className="bg-[#11112a]/90 backdrop-blur-md border border-[#111]/50 rounded-lg p-8 text-center">
          <p className="text-gray-300 text-lg">Your cart is empty</p>
          <p className="text-gray-400 mt-2">Add some beautiful jewelry to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-[#11112a]/90 backdrop-blur-md border border-[#111]/50 rounded-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-[#1a1a3a]">
              <h3 className="text-lg font-semibold text-white">Cart Items</h3>
            </div>
            
            <div className="divide-y divide-[#1a1a3a]">
              {cartItems.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="flex justify-between items-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div>
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-sm text-gray-400 ml-2">x {item.quantity}</span>
                    <div className="text-[#00ccff] font-semibold">
                      {/* Conditionally render price editing based on user preference */}
                      {userPreferences.price_at_billing ? (
                        editingItemId === item.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={editedPrice}
                              onChange={(e) => setEditedPrice(e.target.value)}
                              className="w-24 bg-[#0a0a23] border border-[#3d3dbd]/30 rounded-lg p-2 text-white"
                              min="0"
                              step="0.01"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSaveEditedPrice(item.id)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                            >
                              <Save size={16} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleCancelEditingPrice}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
                            >
                              <X size={16} />
                            </motion.button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-white">₹{item.price}</span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStartEditingPrice(item)}
                              className="p-2 bg-[#3d3dbd] text-white rounded-lg hover:bg-[#2a2a4a]"
                            >
                              <Edit2 size={16} />
                            </motion.button>
                          </div>
                        )
                      ) : (
                        <span className="text-white">₹{item.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 bg-[#3d3dbd] text-white rounded-lg hover:bg-[#2a2a4a] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </motion.button>
                    <span className="text-white">{item.quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="p-2 bg-[#3d3dbd] text-white rounded-lg hover:bg-[#2a2a4a]"
                    >
                      <Plus size={16} />
                    </motion.button>
                  </div>
                  <motion.button 
                    onClick={() => handleRemoveItem(item.id)} 
                    className="px-3 py-1 bg-red-600/80 text-white font-bold rounded-full hover:bg-red-500 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ))}
            </div>
            
            <div className="p-4 border-t border-[#1a1a3a] bg-[#0a0a23]/40">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-300">Total:</span>
                <span className="text-xl font-bold text-[#f3ba19]">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <motion.div 
            className="bg-[#11112a]/90 backdrop-blur-md border border-[#111]/50 rounded-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="p-4 border-b border-[#1a1a3a]">
              <h3 className="text-lg font-semibold text-white">Complete Your Order</h3>
            </div>
            
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={orderDetails.customer_name}
                  onChange={(e) => setOrderDetails({ ...orderDetails, customer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1a1a3a] text-white border border-[#2a2a4a] focus:border-[#3d3dbd] focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Contact Number</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={orderDetails.customer_contact}
                  onChange={(e) => setOrderDetails({ ...orderDetails, customer_contact: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1a1a3a] text-white border border-[#2a2a4a] focus:border-[#3d3dbd] focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={orderDetails.payment_method}
                  onChange={(e) => setOrderDetails({ ...orderDetails, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1a1a3a] text-white border border-[#2a2a4a] focus:border-[#3d3dbd] focus:outline-none"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Making Charges</label>
                <input
                  type="number"
                  placeholder="Enter making charges"
                  value={orderDetails.making_charges}
                  onChange={(e) => setOrderDetails({ ...orderDetails, making_charges: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#1a1a3a] text-white border border-[#2a2a4a] focus:border-[#3d3dbd] focus:outline-none"
                  required
                />
              </div>
              
              <motion.button 
                type="submit" 
                className="w-full px-4 py-3 mt-4 bg-gradient-to-r from-[#f3ba19] to-[#e09600] text-[#000014] font-bold rounded hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Place Order & Generate PDF Bill
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default CartView;
