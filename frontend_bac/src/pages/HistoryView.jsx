// src/pages/HistoryView.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiCalendar, FiPhone, FiFileText } from 'react-icons/fi';

function HistoryView({ orderHistory = [] }) {
  console.log("[HistoryView] Component rendered.");
  console.log("[HistoryView] Received orderHistory prop:", orderHistory);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('phone'); // 'phone', 'bill', 'date'
  const [showSearchOptions, setShowSearchOptions] = useState(false);

  // Ensure orderHistory is an array
  const safeOrderHistory = Array.isArray(orderHistory) ? orderHistory : [];
  console.log("[HistoryView] safeOrderHistory:", safeOrderHistory);

  // Filter orders based on search
  const filteredOrders = safeOrderHistory.filter(order => {
    console.log("[HistoryView] Filtering order:", order);
    try {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase().trim();
      
      switch (searchType) {
        case 'phone':
          return order.customer_contact && order.customer_contact.toLowerCase().includes(query);
        case 'bill':
          return order.order_id != null && order.order_id.toString().includes(query);
        case 'date':
          // Convert both to date strings for comparison
          try {
            const searchDate = new Date(query).toLocaleDateString();
            const orderDate = new Date(order.order_date).toLocaleDateString();
            return orderDate.includes(searchDate);
          } catch (e) {
            console.error("[HistoryView] Error parsing date for order:", order.order_date, e);
            return false;
          }
        default:
          return true;
      }
    } catch (filterError) {
      console.error("[HistoryView] Error during filtering for order:", order, filterError);
      return false;
    }
  });

  console.log("[HistoryView] filteredOrders count:", filteredOrders.length);

  const downloadBill = (orderId) => {
    fetch(`http://127.0.0.1:5000/download_bill?order_id=${orderId}`)
      .then(res => {
        if (res.ok) return res.blob();
        throw new Error("Failed to download bill");
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bill_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error(err));
  };

  // Get icon based on search type
  const getSearchIcon = () => {
    switch (searchType) {
      case 'phone': return <FiPhone className="text-gray-400" />;
      case 'bill': return <FiFileText className="text-gray-400" />;
      case 'date': return <FiCalendar className="text-gray-400" />;
      default: return <FiSearch className="text-gray-400" />;
    }
  };

  // Get placeholder text based on search type
  const getPlaceholder = () => {
    switch (searchType) {
      case 'phone': return 'Search by phone number...';
      case 'bill': return 'Search by bill number...';
      case 'date': return 'Search by date (YYYY-MM-DD)...';
      default: return 'Search orders...';
    }
  };

  // Helper function to format currency with Rupee symbol
  const formatCurrency = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold text-[#f3ba19] mb-4 md:mb-0">
        Order History
      </h2>
        
        {/* Search Bar */}
        <div className="w-full md:w-auto relative">
          <div className="flex">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getSearchIcon()}
              </div>
              <input
                type={searchType === 'date' ? 'date' : 'text'}
                className="w-full pl-10 pr-4 py-2 bg-[#11112a]/90 border border-[#1a1a3a] rounded-l-lg text-white focus:outline-none focus:border-[#3d3dbd]"
                placeholder={getPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              onClick={() => setShowSearchOptions(!showSearchOptions)}
              className="px-4 bg-[#1a1a3a] border-y border-r border-[#1a1a3a] rounded-r-lg text-white hover:bg-[#252550] transition-colors"
            >
              {searchType === 'phone' ? 'Phone' : searchType === 'bill' ? 'Bill #' : 'Date'}
            </button>
          </div>
          
          {/* Search Options Dropdown */}
          {showSearchOptions && (
            <motion.div 
              className="absolute right-0 mt-1 w-32 bg-[#11112a]/95 backdrop-blur-lg border border-[#1a1a3a] rounded-lg shadow-lg z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ul>
                <li 
                  className={`px-4 py-2 cursor-pointer hover:bg-[#1a1a3a] ${searchType === 'phone' ? 'text-[#f3ba19]' : 'text-white'} flex items-center gap-2`}
                  onClick={() => {
                    setSearchType('phone');
                    setShowSearchOptions(false);
                  }}
                >
                  <FiPhone /> Phone
                </li>
                <li 
                  className={`px-4 py-2 cursor-pointer hover:bg-[#1a1a3a] ${searchType === 'bill' ? 'text-[#f3ba19]' : 'text-white'} flex items-center gap-2`}
                  onClick={() => {
                    setSearchType('bill');
                    setShowSearchOptions(false);
                  }}
                >
                  <FiFileText /> Bill #
                </li>
                <li 
                  className={`px-4 py-2 cursor-pointer hover:bg-[#1a1a3a] ${searchType === 'date' ? 'text-[#f3ba19]' : 'text-white'} flex items-center gap-2`}
                  onClick={() => {
                    setSearchType('date');
                    setShowSearchOptions(false);
                  }}
                >
                  <FiCalendar /> Date
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="bg-[#11112a]/90 backdrop-blur-md border border-[#111]/50 rounded-lg p-8 text-center">
          <p className="text-gray-300 text-lg">No matching orders found</p>
          <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <motion.div 
          className="bg-[#11112a]/90 backdrop-blur-md border border-[#111]/50 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
                <tr className="bg-[#0a0a23]/50 text-left">
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Bill No.</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Customer</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Contact</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Total</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Date</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Payment</th>
                  <th className="py-3 px-4 text-[#f3ba19] font-medium">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-[#1a1a3a]">
                {filteredOrders.map((order, index) => (
                  <motion.tr 
                    key={order.order_id} 
                    className="hover:bg-[#1a1a3a]/40 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="py-3 px-4 text-white">{order.order_id}</td>
                    <td className="py-3 px-4 text-white">{order.customer_name}</td>
                    <td className="py-3 px-4 text-gray-300">{order.customer_contact}</td>
                    <td className="py-3 px-4 text-[#00ccff] font-semibold">{formatCurrency(order.total_price)}</td>
                    <td className="py-3 px-4 text-gray-300">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-300">{order.payment_method}</td>
                    <td className="py-3 px-4">
                      <motion.button 
                        onClick={() => downloadBill(order.order_id)} 
                        className="px-3 py-1.5 bg-[#3d3dbd] text-white rounded-full hover:bg-[#3030a0] text-sm font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                      Download Bill
                      </motion.button>
                  </td>
                  </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        </motion.div>
      )}
    </div>
  );
}

export default HistoryView;
