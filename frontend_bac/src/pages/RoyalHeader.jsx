// src/pages/RoyalHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Search,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  Package,
  History,
  ShoppingCart,
  Cat,
  BarChart,
  Home,
  X,
  GripVertical,
  PlusSquare,
  Save,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Tag,
  Zap
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable category item component
function SortableCategoryItem({ category, level = 0, onEdit, onDelete, expanded, toggleExpand }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, data: category });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${level * 16}px`,
  };

  const hasChildren = category.subcategories && category.subcategories.length > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-1 cursor-pointer ${isDragging ? 'z-50' : ''}`}
    >
      <div 
        className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a3a]/80 hover:bg-[#1e1e45] border border-[#ffd700]/20 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Drag handle */}
          <span {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-white">
            <GripVertical size={16} />
          </span>
          
          {/* Expand/collapse icon for categories with children */}
          {hasChildren ? (
            <button 
              onClick={() => toggleExpand(category.id)}
              className="text-[#ffd700] hover:text-[#ffaa00] p-1"
            >
              {expanded.includes(category.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            // Spacer to align items
            <span className="w-6"></span>
          )}
          
          <span className="text-white truncate">{category.name}</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(category)}
            className="p-1 text-blue-400 hover:text-blue-300 rounded"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={() => onDelete(category.id)}
            className="p-1 text-red-400 hover:text-red-300 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function RoyalHeader({
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  sortOption,
  setSortOption,
  isLoggedIn,
  userRole,
  handleLogout,
  jewelryItems = [], // Pass jewelryItems for notifications
  orderHistory = [], // Pass orderHistory for notifications
  goldPrice,
  silverPrice,
  shopName = 'AURUMBILL', // Default shop name
  shopLogo = null // Default shop logo
}) {
  // State for toggling various drop-downs/inputs
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [lastPriceCheck, setLastPriceCheck] = useState(Date.now());
  const [priceNotificationAdded, setPriceNotificationAdded] = useState(false);
  const [notificationsHistory, setNotificationsHistory] = useState({
    priceChanges: [],
    lowStock: {},
    orders: {}
  });
  
  // State for shop branding from localStorage
  const [localShopName, setLocalShopName] = useState(shopName);
  const [localShopLogo, setLocalShopLogo] = useState(shopLogo);
  
  // Load shop branding from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('shopName');
    const savedLogo = localStorage.getItem('shopLogo');
    
    if (savedName) {
      setLocalShopName(savedName);
    }
    
    if (savedLogo) {
      setLocalShopLogo(savedLogo);
    }
  }, []);
  
  // Reference for clicking outside elements to close them
  const searchRef = useRef(null);
  const sortRef = useRef(null);
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Navigation to Categories page instead of showing overlay
  const navigateToCategories = () => {
    setActiveView('categories');
  };

  // Function to get low stock items for notifications
  const getLowStockItems = () => {
    if (!jewelryItems || !Array.isArray(jewelryItems)) return [];
    return jewelryItems.filter(item => item.stock < 5);
  };

  // Function to get recent orders for notifications
  const getRecentOrders = () => {
    if (!orderHistory || !Array.isArray(orderHistory)) return [];
    
    // Get orders from the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    return orderHistory
      .filter(order => new Date(order.order_date) > oneDayAgo)
      .filter(order => !notificationsHistory.orders[order.id])
      .slice(0, 5); // Limit to 5 most recent
  };

  // Price change notifications - separate from main notifications
  useEffect(() => {
    const currentTime = Date.now();
    // Only check for price changes every 15 minutes (900000 ms)
    if (goldPrice && !priceNotificationAdded && (currentTime - lastPriceCheck > 900000)) {
      setLastPriceCheck(currentTime);
      
      // Check if there are previous price records to compare
      if (notificationsHistory.priceChanges.length > 0) {
        const lastPriceRecord = notificationsHistory.priceChanges[notificationsHistory.priceChanges.length - 1];
        const priceDifference = goldPrice - lastPriceRecord.price;
        
        // Only create notification if price change is significant (more than 1%)
        if (Math.abs(priceDifference / lastPriceRecord.price) > 0.01) {
          const isPriceUp = priceDifference > 0;
          const percentChange = Math.abs(priceDifference / lastPriceRecord.price * 100).toFixed(1);
          
          const priceNotification = {
            id: `price-${currentTime}`,
            type: 'price-change',
            title: 'Gold Price Update',
            message: `Gold price has ${isPriceUp ? 'increased' : 'decreased'} by ${percentChange}%`,
            time: new Date(),
            icon: isPriceUp ? TrendingUp : TrendingDown,
            color: isPriceUp ? 'text-green-400' : 'text-red-400',
            bgColor: isPriceUp ? 'bg-green-400/20' : 'bg-red-400/20',
            action: () => setActiveView('statistics'),
            price: goldPrice
          };
          
          setNotifications(prev => [priceNotification, ...prev]);
          setNotificationsHistory(prev => ({
            ...prev,
            priceChanges: [...prev.priceChanges, { price: goldPrice, time: currentTime }]
          }));
          setHasNewNotifications(true);
          setPriceNotificationAdded(true);
          
          // Reset the price notification flag after 15 minutes
          setTimeout(() => {
            setPriceNotificationAdded(false);
          }, 900000);
        }
      } else {
        // First time seeing price, just record it
        setNotificationsHistory(prev => ({
          ...prev, 
          priceChanges: [{ price: goldPrice, time: currentTime }]
        }));
      }
    }
  }, [goldPrice, lastPriceCheck, priceNotificationAdded, notificationsHistory.priceChanges]);

  // Generate notifications based on jewelry items and orders
  useEffect(() => {
    let newNotifications = [...notifications];
    let hasAdded = false;
    
    // Add low stock notifications
    const lowStockItems = getLowStockItems();
    lowStockItems.forEach(item => {
      // Skip if we already have a notification for this item
      if (notificationsHistory.lowStock[item.id] && 
          notificationsHistory.lowStock[item.id].stock === item.stock) {
        return;
      }
      
      const lowStockNotification = {
        id: `stock-${item.id}-${Date.now()}`,
        type: 'low-stock',
        title: 'Low Stock Alert',
        message: `${item.name} has only ${item.stock} units left.`,
        time: new Date(),
        icon: AlertTriangle,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/20',
        action: () => setActiveView('add'),
        itemId: item.id
      };
      
      newNotifications.unshift(lowStockNotification);
      setNotificationsHistory(prev => ({
        ...prev,
        lowStock: {
          ...prev.lowStock,
          [item.id]: { stock: item.stock, time: Date.now() }
        }
      }));
      hasAdded = true;
    });
    
    // Add recent order notifications
    const recentOrders = getRecentOrders();
    recentOrders.forEach(order => {
      const orderDate = new Date(order.order_date);
      
      const orderNotification = {
        id: `order-${order.id}`,
        type: 'new-order',
        title: 'New Order',
        message: `New order of ${order.total_items} items for ₹${order.total_price}`,
        time: orderDate,
        icon: ShoppingCart,
        color: 'text-green-400',
        bgColor: 'bg-green-400/20',
        action: () => setActiveView('history'),
        orderId: order.id
      };
      
      newNotifications.unshift(orderNotification);
      setNotificationsHistory(prev => ({
        ...prev,
        orders: {
          ...prev.orders,
          [order.id]: { time: orderDate }
        }
      }));
      hasAdded = true;
    });
    
    // Only update state if we've added new notifications
    if (hasAdded) {
      // Keep most recent 50 notifications to prevent unlimited growth
      newNotifications = newNotifications.slice(0, 50);
      
      // Sort notifications by time (newest first)
      newNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setNotifications(newNotifications);
      setHasNewNotifications(true);
    }
  }, [jewelryItems, orderHistory]);
  
  // Handle search suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Generate search suggestions from jewelry items
      const matchingItems = jewelryItems
        .filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5); // Limit to 5 suggestions
      
      // Create suggestion items
      const suggestions = matchingItems.map(item => ({
        id: item.id,
        label: item.name,
        value: item.name,
        type: 'item',
        image: item.image_url || null,
        price: item.price
      }));
      
      // Add category suggestions if query matches some categories
      const categorySuggestions = [
        { id: 'cat-1', label: 'Men\'s Collection', value: 'Men\'s Collection', type: 'category' },
        { id: 'cat-2', label: 'Women\'s Jewelry', value: 'Women\'s Jewelry', type: 'category' },
        { id: 'cat-3', label: 'Diamond Rings', value: 'Diamond Rings', type: 'category' }
      ].filter(cat => cat.label.toLowerCase().includes(searchQuery.toLowerCase()));
      
      setSearchSuggestions([...suggestions, ...categorySuggestions.slice(0, 2)]);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, jewelryItems]);

  // Logout handler that redirects to login page
  const handleLogoutClick = () => {
    // First close the profile dropdown
    setIsProfileOpen(false);
    
    // Call the provided logout handler
    if (handleLogout) {
      handleLogout();
    }
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Sample navigation items matching the Bolt design
  const navItems = [
    { icon: Home, label: 'Home', onClick: () => setActiveView('live') },
    { icon: Package, label: 'Manage', onClick: () => setActiveView('add') },
    { icon: History, label: 'Order History', onClick: () => setActiveView('history') },
    { icon: ShoppingCart, label: 'Cart', onClick: () => setActiveView('cart') },
    { icon: Cat, label: 'Categories', onClick: navigateToCategories },
    { icon: BarChart, label: 'Statistics', onClick: () => setActiveView('statistics') }
  ];

  // Sorting options drop-down items
  const sortingOptions = [
    { value: '', label: 'No Sort', icon: X },
    { value: 'price_asc', label: 'Price (Low → High)', icon: TrendingUp },
    { value: 'price_desc', label: 'Price (High → Low)', icon: TrendingDown },
    { value: 'most_sold', label: 'Most Sold', icon: Zap },
    { value: 'new', label: 'New Arrivals', icon: Clock }
  ];

  // Helper to format relative time for notifications
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
  
  // Function to handle notification click
  const handleNotificationClick = (notification) => {
    // Execute the notification's action if it exists
    if (notification.action) {
      notification.action();
    }
    
    // Close the notifications panel
    setIsNotificationsOpen(false);
    
    // Update notifications to mark this one as read
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id 
          ? { ...n, read: true } 
          : n
      )
    );
  };

  // Clear specific notification
  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear notifications by type
  const clearNotificationsByType = (type) => {
    setNotifications(prev => prev.filter(n => n.type !== type));
    
    // Also clear from history if it's a specific type
    if (type === 'low-stock') {
      setNotificationsHistory(prev => ({...prev, lowStock: {}}));
    } else if (type === 'new-order') {
      setNotificationsHistory(prev => ({...prev, orders: {}}));
    } else if (type === 'price-change') {
      // Keep the last price record but remove notifications
      const lastPriceRecord = notificationsHistory.priceChanges.length > 0 
        ? notificationsHistory.priceChanges[notificationsHistory.priceChanges.length - 1]
        : null;
        
      setNotificationsHistory(prev => ({
        ...prev, 
        priceChanges: lastPriceRecord ? [lastPriceRecord] : []
      }));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasNewNotifications(false);
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setHasNewNotifications(false);
  };
  
  // Function to handle notification hover
  const [hoveredNotificationId, setHoveredNotificationId] = useState(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef, sortRef, profileRef, notificationsRef]);

  // Group notifications by type
  const groupedNotifications = {
    'low-stock': notifications.filter(n => n.type === 'low-stock'),
    'new-order': notifications.filter(n => n.type === 'new-order'),
    'price-change': notifications.filter(n => n.type === 'price-change')
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center">
              {localShopLogo ? (
                <img 
                  src={localShopLogo} 
                  alt={localShopName} 
                  className="h-8 w-8 object-contain" 
                />
              ) : (
                <Crown className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
              )}
              <span className="ml-2 text-xl font-semibold text-white">{localShopName}</span>
            </motion.div>
            <div className="hidden md:flex ml-10 space-x-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.05 }}
                  onClick={item.onClick}
                  className={`flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeView === item.label.toLowerCase() 
                      ? 'text-[#ffd700]' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Enhanced Search icon and input with suggestions */}
            <div className="relative" ref={searchRef}>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 360 }}
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </motion.button>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, width: '200px' }}
                    animate={{ opacity: 1, y: 0, width: '280px' }}
                    exit={{ opacity: 0, y: 10, width: '200px' }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 z-20"
                  >
                    <div className="relative">
                    <input
                      type="text"
                        placeholder="Search items, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a3a]/90 backdrop-blur-lg text-white text-sm focus:outline-none border border-[#3d3dbd]/30 focus:border-[#ffd700]/50 transition-all shadow-lg"
                        autoFocus
                      />
                      <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      
                      {/* Search suggestions dropdown */}
                      {searchSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute mt-1 w-full bg-[#1a1a3a]/95 backdrop-blur-xl border border-[#3d3dbd]/30 rounded-lg shadow-lg overflow-hidden"
                        >
                          {searchSuggestions.map((suggestion) => (
                            <motion.div
                              key={suggestion.id}
                              whileHover={{ 
                                backgroundColor: 'rgba(61, 61, 189, 0.2)',
                                x: 3
                              }}
                              onClick={() => {
                                setSearchQuery(suggestion.value);
                                setIsSearchOpen(false);
                              }}
                              className="px-4 py-2.5 cursor-pointer flex items-center gap-3 border-b border-[#3d3dbd]/10 last:border-0"
                            >
                              {suggestion.type === 'item' ? (
                                <>
                                  <div className="w-8 h-8 bg-[#1E3A5A] rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {suggestion.image ? (
                                      <img src={suggestion.image} alt={suggestion.label} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package size={14} className="text-[#ffd700]/70" />
                                    )}
                                  </div>
                                  <div className="flex-grow overflow-hidden">
                                    <p className="text-sm text-white truncate">{suggestion.label}</p>
                                    <p className="text-xs text-gray-400">₹{suggestion.price}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-8 h-8 bg-[#3d3dbd]/20 rounded-md flex items-center justify-center flex-shrink-0">
                                    <Tag size={14} className="text-[#ffd700]" />
                                  </div>
                                  <div className="flex-grow">
                                    <p className="text-sm text-white">{suggestion.label}</p>
                                    <p className="text-xs text-gray-400">Category</p>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Sort icon and drop-down */}
            <div className="relative" ref={sortRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsSortOpen((prev) => !prev)}
                className={`p-2 rounded-full ${
                  sortOption ? 'text-[#ffd700]' : 'text-gray-300'
                } hover:bg-white/10 hover:text-white`}
              >
                <BarChart className="h-5 w-5" />
              </motion.button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-[#1a1a3a]/95 to-[#0a0a23]/95 backdrop-blur-lg text-white rounded-lg shadow-xl p-2 z-10 border border-[#3d3dbd]/30 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[#3d3dbd]/20">
                      <h3 className="text-sm font-medium text-[#ffd700]">Sort Items</h3>
                    </div>
                    <div className="py-1">
                    {sortingOptions.map((option) => (
                        <motion.button
                        key={option.value}
                          whileHover={{ 
                            backgroundColor: 'rgba(61, 61, 189, 0.2)',
                            x: 3
                          }}
                        onClick={() => {
                          setSortOption(option.value);
                          setIsSortOpen(false);
                        }}
                          className={`flex w-full items-center text-left px-3 py-2.5 rounded-md transition-all duration-200 gap-3 ${
                            sortOption === option.value
                              ? 'bg-[#3d3dbd]/30 text-[#ffd700]'
                              : 'text-gray-200'
                          }`}
                        >
                          <div className={`p-1.5 rounded-md ${sortOption === option.value ? 'bg-[#ffd700]/20' : 'bg-[#3d3dbd]/10'}`}>
                            <option.icon size={14} className={sortOption === option.value ? 'text-[#ffd700]' : 'text-gray-400'} />
                          </div>
                          <span className="text-sm font-medium">{option.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Notification button and dropdown */}
            <div className="relative" ref={notificationsRef}>
            <motion.button
              whileHover={{ scale: 1.1 }}
                onClick={() => {
                  setIsNotificationsOpen(prev => !prev);
                  if (!isNotificationsOpen && hasNewNotifications) {
                    setHasNewNotifications(false);
                  }
                }}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white relative"
            >
              <Bell className="h-5 w-5" />
                {hasNewNotifications && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                  />
                )}
              </motion.button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 max-h-[75vh] bg-gradient-to-b from-[#1a1a3a]/95 to-[#0a0a23]/95 backdrop-blur-lg rounded-xl py-3 shadow-2xl border border-[#3d3dbd]/30 z-10 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-[#3d3dbd]/20 flex justify-between items-center">
                      <h3 className="text-base font-medium text-white">Notifications</h3>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={markAllAsRead}
                          className="text-xs text-[#3d3dbd] hover:text-[#ffd700] transition-colors"
                        >
                          Mark all as read
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={clearAllNotifications}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear all
            </motion.button>
                      </div>
                    </div>
                    
                    <div className="py-2 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-[#3d3dbd] scrollbar-track-[#0a0a23]">
                      {notifications.length > 0 ? (
                        <>
                          {/* Low stock notifications section */}
                          {groupedNotifications['low-stock'].length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 flex justify-between items-center border-b border-[#3d3dbd]/10">
                                <h4 className="text-xs uppercase text-[#ffd700] font-medium">Stock Alerts</h4>
                                <button 
                                  onClick={() => clearNotificationsByType('low-stock')}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  Clear
                                </button>
                              </div>
                              {groupedNotifications['low-stock'].map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  whileHover={{ backgroundColor: 'rgba(26, 26, 58, 0.6)' }}
                                  onMouseEnter={() => setHoveredNotificationId(notification.id)}
                                  onMouseLeave={() => setHoveredNotificationId(null)}
                                  className={`px-4 py-3 border-b border-[#3d3dbd]/10 last:border-0 relative cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                                >
                                  <div 
                                    className="flex gap-3"
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <div className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0 self-start`}>
                                      <notification.icon size={16} className={notification.color} />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                                        <span className="text-xs text-gray-400 ml-2">{getRelativeTime(notification.time)}</span>
                                      </div>
                                      <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                                    </div>
                                  </div>
                                  {hoveredNotificationId === notification.id && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearNotification(notification.id);
                                      }}
                                      className="absolute top-2 right-2 p-1 rounded-full bg-[#3d3dbd]/20 hover:bg-[#3d3dbd]/40 text-gray-400 hover:text-white"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                          
                          {/* Price change notifications section */}
                          {groupedNotifications['price-change'].length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 flex justify-between items-center border-b border-[#3d3dbd]/10">
                                <h4 className="text-xs uppercase text-[#ffd700] font-medium">Price Updates</h4>
                                <button 
                                  onClick={() => clearNotificationsByType('price-change')}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  Clear
                                </button>
                              </div>
                              {groupedNotifications['price-change'].map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  whileHover={{ backgroundColor: 'rgba(26, 26, 58, 0.6)' }}
                                  onMouseEnter={() => setHoveredNotificationId(notification.id)}
                                  onMouseLeave={() => setHoveredNotificationId(null)}
                                  className={`px-4 py-3 border-b border-[#3d3dbd]/10 last:border-0 relative cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                                >
                                  <div 
                                    className="flex gap-3"
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <div className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0 self-start`}>
                                      <notification.icon size={16} className={notification.color} />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                                        <span className="text-xs text-gray-400 ml-2">{getRelativeTime(notification.time)}</span>
                                      </div>
                                      <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                                    </div>
                                  </div>
                                  {hoveredNotificationId === notification.id && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearNotification(notification.id);
                                      }}
                                      className="absolute top-2 right-2 p-1 rounded-full bg-[#3d3dbd]/20 hover:bg-[#3d3dbd]/40 text-gray-400 hover:text-white"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                          
                          {/* Order notifications section */}
                          {groupedNotifications['new-order'].length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 flex justify-between items-center border-b border-[#3d3dbd]/10">
                                <h4 className="text-xs uppercase text-[#ffd700] font-medium">Recent Orders</h4>
                                <button 
                                  onClick={() => clearNotificationsByType('new-order')}
                                  className="text-xs text-gray-400 hover:text-gray-300"
                                >
                                  Clear
                                </button>
                              </div>
                              {groupedNotifications['new-order'].map((notification) => (
                                <motion.div
                                  key={notification.id}
                                  whileHover={{ backgroundColor: 'rgba(26, 26, 58, 0.6)' }}
                                  onMouseEnter={() => setHoveredNotificationId(notification.id)}
                                  onMouseLeave={() => setHoveredNotificationId(null)}
                                  className={`px-4 py-3 border-b border-[#3d3dbd]/10 last:border-0 relative cursor-pointer ${notification.read ? 'opacity-60' : ''}`}
                                >
                                  <div 
                                    className="flex gap-3"
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <div className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0 self-start`}>
                                      <notification.icon size={16} className={notification.color} />
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                                        <span className="text-xs text-gray-400 ml-2">{getRelativeTime(notification.time)}</span>
                                      </div>
                                      <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                                    </div>
                                  </div>
                                  {hoveredNotificationId === notification.id && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        clearNotification(notification.id);
                                      }}
                                      className="absolute top-2 right-2 p-1 rounded-full bg-[#3d3dbd]/20 hover:bg-[#3d3dbd]/40 text-gray-400 hover:text-white"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <p className="text-gray-400 text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile dropdown - Enhanced styling */}
            <div className="relative" ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className={`p-2 rounded-full ${isProfileOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-300 hover:text-white'} transition-all duration-200`}
              >
                <User className="h-5 w-5" />
              </motion.button>
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-64 bg-gradient-to-b from-[#1a1a3a]/95 to-[#0a0a23]/95 backdrop-blur-lg rounded-xl py-3 shadow-2xl border border-[#3d3dbd]/30 z-10 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#3d3dbd]/20">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-[#3d3dbd]/20">
                          <User className="h-6 w-6 text-[#ffd700]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{userRole || "User"}</p>
                      <p className="text-xs text-gray-400">admin@luxetrack.com</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-2 py-2">
                      <motion.button 
                        whileHover={{ 
                          backgroundColor: 'rgba(61, 61, 189, 0.2)',
                          x: 3
                        }}
                        onClick={() => {
                          setIsProfileOpen(false);
                          setActiveView('settings');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4 text-[#3d3dbd]" />
                        <span>Settings</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ 
                          backgroundColor: 'rgba(239, 83, 80, 0.2)',
                          x: 3
                        }}
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 rounded-lg flex items-center space-x-2 mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </motion.button>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t border-[#3d3dbd]/20 px-4 py-2">
                      <p className="text-xs text-gray-500">Version 1.0.0</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 z-50 w-64 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="p-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="mt-8 space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default RoyalHeader;
