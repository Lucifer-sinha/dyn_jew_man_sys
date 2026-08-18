import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers, FiCalendar, FiBox, FiArrowUp, FiArrowDown, FiCircle } from 'react-icons/fi';

function StatisticsView({ orderHistory = [], jewelryItems = [], categories = [] }) {
  // States for calculated statistics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all'); // 'week', 'month', 'year', 'all'
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [hoverMonth, setHoverMonth] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Calculate statistics based on data
  useEffect(() => {
    calculateStatistics();
  }, [orderHistory, jewelryItems, categories, selectedTimeRange]);

  const calculateStatistics = () => {
    // Filter orders based on time range
    const filteredOrders = filterOrdersByTimeRange(orderHistory);
    
    // Calculate total revenue
    const revenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
    setTotalRevenue(revenue);
    
    // Calculate average order value
    const avg = filteredOrders.length ? revenue / filteredOrders.length : 0;
    setAverageOrderValue(avg);
    
    // Calculate top selling items based on sold_count
    const sortedItems = [...jewelryItems].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5);
    setTopSellingItems(sortedItems);
    
    // Calculate low stock items (less than 5 in stock)
    const lowStock = jewelryItems.filter(item => item.stock < 5);
    setLowStockItems(lowStock);
    
    // Calculate inventory value
    const invValue = jewelryItems.reduce((sum, item) => sum + (item.price * item.stock), 0);
    setInventoryValue(invValue);
    
    // Calculate monthly sales for the past 6 months
    const monthlyData = calculateMonthlySales(filteredOrders);
    setMonthlySales(monthlyData);
    
    // Calculate category distribution
    const catDistribution = calculateCategoryDistribution(jewelryItems, categories);
    setCategoryDistribution(catDistribution);
    
    // Calculate category performance
    const catPerformance = calculateCategoryPerformance(filteredOrders, jewelryItems, categories);
    setCategoryPerformance(catPerformance);
  };

  const filterOrdersByTimeRange = (orders) => {
    if (selectedTimeRange === 'all') return orders;
    
    const now = new Date();
    let cutoffDate;
    
    if (selectedTimeRange === 'week') {
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
    } else if (selectedTimeRange === 'month') {
      cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (selectedTimeRange === 'year') {
      cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }
    
    return orders.filter(order => new Date(order.order_date) >= cutoffDate);
  };

  const calculateMonthlySales = (orders) => {
    const months = [];
    const now = new Date();
    
    // Create array of past 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        value: 0,
        orderCount: 0,
        totalItems: 0
      });
    }
    
    // Populate with sales data
    orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      
      const monthIndex = months.findIndex(m => {
        const monthDate = new Date(`${m.month} 1, ${m.year}`);
        return monthDate.getMonth() === orderMonth && monthDate.getFullYear() === orderYear;
      });
      
      if (monthIndex !== -1) {
        months[monthIndex].value += order.total_price;
        months[monthIndex].orderCount += 1;
        months[monthIndex].totalItems += 1; // Ideally we'd count the items in each order
      }
    });
    
    return months;
  };

  const calculateCategoryDistribution = (items, cats) => {
    console.log("DEBUG: Categories received:", cats);
    console.log("DEBUG: Items received:", items.length, items[0]);
    
    // Early check for empty categories
    if (!cats || cats.length === 0) {
      console.log("DEBUG: No categories found, marking all as uncategorized");
      return [{ name: 'Uncategorized', count: items.length, percentage: 100, color: getRandomColor('Uncategorized') }];
    }
    
    const catCounts = {};
    
    // Create mapping of category ids to names and build hierarchy relationships
    const categoryMap = {};
    const parentMap = {}; // Maps child id to parent id
    const childrenMap = {}; // Maps parent id to array of child ids
    
    // Function to get all child category IDs for a parent ID (same as LiveView)
    const getAllChildCategoryIds = (parentId) => {
      if (!parentId) return [];
      
      // Ensure parentId is a number
      const numericParentId = Number(parentId);
      
      // Start with the parent ID itself
      let result = [numericParentId];
      
      // Function to recursively find all children
      const findChildren = (id) => {
        // Convert id to number for consistent comparison
        const numId = Number(id);
        
        // Find all direct children of this ID
        const children = cats.filter(category => {
          // Ensure we're comparing numbers with numbers
          const categoryParentId = category.parent_id ? Number(category.parent_id) : null;
          return categoryParentId === numId;
        });
        
        // Process each child
        children.forEach(child => {
          const childId = Number(child.id);
          result.push(childId); // Add this child
          findChildren(childId); // Find its children
        });
      };
      
      // Start the recursive search
      findChildren(numericParentId);
      
      // Return unique IDs (removing duplicates)
      return [...new Set(result)];
    };
    
    // Map subcategory IDs to their parent categories (same as LiveView)
    const getEffectiveCategoryId = (categoryId) => {
      if (!categoryId) return null;
      
      // Force category ID to be a number
      const numericId = Number(categoryId);
      
      // Check if this category exists in our categories array
      const categoryExists = cats.some(cat => Number(cat.id) === numericId);
      
      if (categoryExists) {
        return numericId; // Category exists, use it as is
      }
      
      // Known mappings of subcategory IDs to their parent categories
      const subcategoryMapping = {
        // Men's subcategories
        17: 12, // rings -> men
        25: 12, // watches -> men
        26: 12, // bracelets -> men
        
        // Women's subcategories  
        18: 13, // earrings -> women
        19: 13, // pendants -> women
        20: 13, // necklace -> women
        21: 13, // bangles -> women
        22: 13, // rings -> women
        23: 13, // bracelets -> women
        
        // Kids subcategories
        24: 14  // brackets -> kids
      };
      
      // If we know this is a subcategory, return its parent category
      if (subcategoryMapping[numericId]) {
        console.log(`DEBUG: Mapping subcategory ${numericId} to parent category ${subcategoryMapping[numericId]}`);
        return subcategoryMapping[numericId];
      }
      
      // Otherwise just return the original ID
      return numericId;
    };
    
    // First pass - create mappings
    cats.forEach(cat => {
      if (cat && cat.id !== undefined) {
        // Store category info by ID (as both string and number for safety)
        const numericId = Number(cat.id);
        categoryMap[numericId] = cat.name || 'Unknown';
        categoryMap[cat.id] = cat.name || 'Unknown'; // Also store as string key
        
        console.log(`DEBUG: Mapped category ID ${cat.id} to name ${cat.name}`);
        
        // Store parent relationship
        if (cat.parent_id) {
          const numericParentId = Number(cat.parent_id);
          parentMap[numericId] = numericParentId;
          parentMap[cat.id] = cat.parent_id; // Also store as string key
          
          // Track children for each parent
          if (!childrenMap[numericParentId]) {
            childrenMap[numericParentId] = [];
          }
          childrenMap[numericParentId].push(numericId);
          
          console.log(`DEBUG: Category ${cat.id} (${cat.name}) has parent ${cat.parent_id}`);
        }
      }
    });
    
    console.log("DEBUG: Category map created:", categoryMap);
    console.log("DEBUG: Parent map created:", parentMap);
    
    // Function to get consistent category display name
    const getCategoryDisplayName = (catId) => {
      if (!catId) {
        console.log("DEBUG: No category ID provided, returning Uncategorized");
        return 'Uncategorized';
      }
      
      // Try both string and number lookups for maximum compatibility
      const numericCatId = Number(catId);
      
      // First try direct lookup
      let catName = categoryMap[numericCatId] || categoryMap[catId];
      
      // If not found directly, check if it's a child of another category
      if (!catName) {
        // Try all potential parent categories to see if this is a child
        for (const potential_parent_id in childrenMap) {
          const childIds = childrenMap[potential_parent_id];
          if (childIds.includes(numericCatId)) {
            // We found that this category is a child of another category
            const parentName = categoryMap[Number(potential_parent_id)];
            if (parentName) {
              console.log(`DEBUG: Category ${catId} is child of ${potential_parent_id} (${parentName})`);
              return parentName; // Use parent category name
            }
          }
        }
        
        // Try using effective category ID mapping
        const effectiveCategoryId = getEffectiveCategoryId(catId);
        if (effectiveCategoryId !== numericCatId) {
          catName = categoryMap[effectiveCategoryId];
          if (catName) {
            console.log(`DEBUG: Using mapped category ${effectiveCategoryId} (${catName}) for ID ${catId}`);
            return catName;
          }
        }
        
        console.log(`DEBUG: No category name found for ID ${catId}, returning Uncategorized`);
        return 'Uncategorized';
      }
      
      // Check if this is a subcategory with a parent
      const parentId = parentMap[numericCatId] || parentMap[catId];
      if (parentId) {
        const parentName = categoryMap[Number(parentId)] || categoryMap[parentId];
        if (parentName) {
          console.log(`DEBUG: Found parent ${parentName} for category ${catName}`);
          return `${parentName} / ${catName}`; // Format as "Parent / Child"
        }
      }
      
      console.log(`DEBUG: Using category name ${catName} for ID ${catId}`);
      return catName;
    };
    
    // Generate category counts with improved naming
    items.forEach(item => {
      if (!item.category_id) {
        // Handle uncategorized items
        catCounts['Uncategorized'] = (catCounts['Uncategorized'] || 0) + 1;
        console.log(`DEBUG: Item ${item.id || item.name} has no category_id, counting as Uncategorized`);
        return;
      }
      
      // First try direct lookup
      const numericCategoryId = Number(item.category_id);
      const categoryName = categoryMap[numericCategoryId];
      
      // Get proper category display name
      const displayName = getCategoryDisplayName(item.category_id);
      console.log(`DEBUG: Item ${item.id || item.name} has category_id ${item.category_id}, mapped to ${displayName}`);
      
      // Count items for this category
      catCounts[displayName] = (catCounts[displayName] || 0) + 1;
    });
    
    console.log("DEBUG: Category counts:", catCounts);
    
    // If we have no data (shouldn't happen with the above safeguards), return uncategorized
    if (Object.keys(catCounts).length === 0) {
      console.log("DEBUG: No category counts found, returning all as Uncategorized");
      return [{ name: 'Uncategorized', count: items.length, percentage: 100, color: getRandomColor('Uncategorized') }];
    }
    
    // Convert to array format for visualization
    const result = Object.entries(catCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / items.length) * 100) || 1, // Ensure at least 1%
        color: getRandomColor(name)
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    console.log("DEBUG: Final category distribution:", result);
    return result;
  };
  
  const calculateCategoryPerformance = (orders, items, cats) => {
    // Create mapping of category ids to names with the same approach as category distribution
    const categoryMap = {};
    const parentMap = {}; // Maps child id to parent id
    
    // Build mappings
    cats.forEach(cat => {
      if (cat && cat.id) {
        categoryMap[cat.id] = cat.name || 'Unknown';
        if (cat.parent_id) {
          parentMap[cat.id] = cat.parent_id;
        }
      }
    });
    
    // Function to get consistent category display name (same as in distribution)
    const getCategoryDisplayName = (catId) => {
      // Skip if no category ID
      if (!catId) return 'Uncategorized';
      
      // Convert to number for consistent comparison
      const numericCatId = Number(catId);
      
      // First check for direct match
      const catName = categoryMap[numericCatId];
      if (!catName) return 'Uncategorized';
      
      // Check if this is a subcategory
      const parentId = parentMap[numericCatId];
      if (parentId) {
        const parentName = categoryMap[parentId];
        if (parentName) {
          return `${parentName} / ${catName}`;
        }
      }
      
      // Just return the category name
      return catName;
    };
    
    // Group items by category with improved naming
    const categorySales = {};
    
    // Calculate total sales per category
    items.forEach(item => {
      const catName = getCategoryDisplayName(item.category_id);
      const salesValue = (item.sold_count || 0) * item.price;
      
      if (!categorySales[catName]) {
        categorySales[catName] = {
          name: catName,
          totalSales: 0,
          itemCount: 0,
          avgPrice: 0,
          growth: Math.random() * 30 - 15, // Mock growth rate (-15% to +15%)
          color: getRandomColor(catName)
        };
      }
      
      categorySales[catName].totalSales += salesValue;
      categorySales[catName].itemCount += 1;
    });
    
    // Calculate average price per category
    Object.values(categorySales).forEach(cat => {
      cat.avgPrice = cat.itemCount > 0 ? cat.totalSales / cat.itemCount : 0;
    });
    
    return Object.values(categorySales)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 6);
  };
  
  // Helper function to generate consistent colors based on category name
  const getRandomColor = (name) => {
    // Generate a color based on the string
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    // Array of brand-matching colors
    const colors = [
      'rgb(61, 61, 189)', // Blue
      'rgb(0, 204, 255)',  // Cyan
      'rgb(243, 186, 25)',  // Gold
      'rgb(239, 83, 80)',   // Red
      'rgb(129, 199, 132)', // Green
      'rgb(121, 134, 203)', // Purple
      'rgb(255, 167, 38)'   // Orange
    ];
    
    return colors[hash % colors.length];
  };

  // Helper to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Time range filter buttons
  const timeRangeButtons = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' }
  ];
  
  // Donut chart calculation
  const calculateDonutSegments = (data) => {
    let cumulativePercentage = 0;
    return data.map(item => {
      const startPercentage = cumulativePercentage;
      cumulativePercentage += item.percentage;
      return {
        ...item,
        startAngle: startPercentage * 3.6, // 3.6 degrees = 1% of 360 degrees
        endAngle: cumulativePercentage * 3.6
      };
    });
  };
  
  const donutSegments = calculateDonutSegments(categoryDistribution);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#f3ba19] mb-4 md:mb-0">Business Analytics</h2>
        
        <div className="flex flex-wrap gap-2">
          {timeRangeButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setSelectedTimeRange(btn.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                selectedTimeRange === btn.value
                  ? 'bg-[#FFD700]/20 text-[#FFD700] font-medium' 
                  : 'bg-[#1E1E45]/40 text-gray-300 hover:bg-[#1E1E45]/60'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Total Revenue</h3>
            <div className="p-2 bg-[#3d3dbd]/20 rounded-lg">
              <FiDollarSign className="text-[#3d3dbd] h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          <div className="mt-2 flex items-center text-xs">
            <FiTrendingUp className="text-green-400 mr-1" />
            <span className="text-green-400">+12.5%</span>
            <span className="text-gray-500 ml-1">vs previous period</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Avg. Order Value</h3>
            <div className="p-2 bg-[#f3ba19]/20 rounded-lg">
              <FiShoppingBag className="text-[#f3ba19] h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(averageOrderValue)}</p>
          <div className="mt-2 flex items-center text-xs">
            <FiTrendingUp className="text-green-400 mr-1" />
            <span className="text-green-400">+5.2%</span>
            <span className="text-gray-500 ml-1">vs previous period</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Total Orders</h3>
            <div className="p-2 bg-[#00ccff]/20 rounded-lg">
              <FiUsers className="text-[#00ccff] h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{orderHistory.length}</p>
          <div className="mt-2 flex items-center text-xs">
            <FiTrendingUp className="text-green-400 mr-1" />
            <span className="text-green-400">+8.7%</span>
            <span className="text-gray-500 ml-1">vs previous period</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Inventory Value</h3>
            <div className="p-2 bg-[#ef5350]/20 rounded-lg">
              <FiBox className="text-[#ef5350] h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(inventoryValue)}</p>
          <div className="mt-2 flex items-center text-xs">
            <FiTrendingUp className="text-[#ef5350] mr-1" />
            <span className="text-[#ef5350]">+2.3%</span>
            <span className="text-gray-500 ml-1">total stock value</span>
          </div>
        </motion.div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Sales Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Monthly Revenue</h3>
            <div className="p-2 bg-[#111153] rounded-lg">
              <FiBarChart2 className="text-[#00ccff] h-5 w-5" />
            </div>
          </div>
          
          <div className="relative">
            {/* Chart Tooltip */}
            <AnimatePresence>
              {hoverMonth !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-0 left-0 bg-[#0a0a23]/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-[#1a1a3a] z-10 transform -translate-y-full"
                  style={{ 
                    left: `${(hoverMonth / monthlySales.length) * 100}%`,
                    transform: `translateX(-50%) translateY(-110%)`
                  }}
                >
                  <div className="text-xs font-semibold text-white">
                    {monthlySales[hoverMonth]?.month} {monthlySales[hoverMonth]?.year}
                  </div>
                  <div className="text-base font-bold text-[#00ccff]">
                    {formatCurrency(monthlySales[hoverMonth]?.value || 0)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Orders: {monthlySales[hoverMonth]?.orderCount || 0}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Chart */}
            <div className="mt-2 h-60 relative">
              {/* Line chart overlay */}
              <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${100 * monthlySales.length} 100`} preserveAspectRatio="none">
                {/* Line connecting points */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  d={monthlySales.map((data, i) => {
                    const maxValue = Math.max(...monthlySales.map(m => m.value || 0));
                    const x = i * 100 + 50; // Center of each month column
                    const y = maxValue > 0 ? 100 - ((data.value || 0) / maxValue) * 95 : 100;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#f3ba19"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_2px_5px_rgba(255,215,0,0.4)]"
                />
                
                {/* Data points */}
                {monthlySales.map((data, i) => {
                  const maxValue = Math.max(...monthlySales.map(m => m.value || 0));
                  const x = i * 100 + 50;
                  const y = maxValue > 0 ? 100 - ((data.value || 0) / maxValue) * 95 : 100;
                  
                  return (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={4}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                      fill={hoverMonth === i ? "#f3ba19" : "#00ccff"}
                      className={`drop-shadow-[0_0_3px_rgba(255,255,255,0.7)] ${
                        hoverMonth === i ? "stroke-white stroke-2" : ""
                      }`}
                    />
                  );
                })}
              </svg>
              
              {/* Bar chart (existing) */}
              <div className="h-60 flex items-end justify-between relative z-10">
                {monthlySales.map((data, index) => {
                  // Calculate relative height (max 100%)
                  const maxValue = Math.max(...monthlySales.map(m => m.value));
                  const heightPercentage = maxValue ? (data.value / maxValue) * 100 : 0;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex flex-col items-center w-1/6"
                      onMouseEnter={() => setHoverMonth(index)}
                      onMouseLeave={() => setHoverMonth(null)}
                    >
                      <div className="w-full flex justify-center mb-2">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`w-8 rounded-t-md cursor-pointer ${
                            hoverMonth === index
                              ? 'bg-gradient-to-t from-[#00ccff] to-[#3d3dbd] shadow-lg shadow-[#00ccff]/20'
                              : 'bg-gradient-to-t from-[#3d3dbd]/60 to-[#00ccff]/60'
                          }`}
                        />
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap">{data.month}</div>
                      <div className="text-xs font-semibold text-white">${Math.round(data.value)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Category Distribution Chart - Donut Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Category Distribution</h3>
            <div className="p-2 bg-[#111153] rounded-lg">
              <FiPieChart className="text-[#f3ba19] h-5 w-5" />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-44 h-44">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Center circle */}
                <circle cx="50" cy="50" r="35" fill="#11112a" />
                
                {/* Donut segments */}
                {donutSegments.map((segment, i) => {
                  // Calculate SVG arc path
                  const isSelected = selectedCategory === i;
                  const startAngle = segment.startAngle * (Math.PI / 180);
                  const endAngle = segment.endAngle * (Math.PI / 180);
                  
                  const x1 = 50 + 25 * Math.sin(startAngle);
                  const y1 = 50 - 25 * Math.cos(startAngle);
                  const x2 = 50 + 25 * Math.sin(endAngle);
                  const y2 = 50 - 25 * Math.cos(endAngle);
                  
                  const largeArcFlag = segment.percentage > 50 ? 1 : 0;
                  
                  // Add a slight offset for hover effect
                  const offset = isSelected ? 2 : 0;
                  const xOffset = offset * Math.sin((startAngle + endAngle) / 2);
                  const yOffset = -offset * Math.cos((startAngle + endAngle) / 2);
                  
                  return (
                    <motion.path
                      key={i}
                      d={`M ${50 + xOffset} ${50 + yOffset} L ${x1 + xOffset} ${y1 + yOffset} A 25 25 0 ${largeArcFlag} 1 ${x2 + xOffset} ${y2 + yOffset} Z`}
                      fill={segment.color}
                      stroke="#11112a"
                      strokeWidth="1"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: isSelected ? 1 : 0.8,
                        scale: isSelected ? 1.05 : 1
                      }}
                      transition={{ duration: 0.3 }}
                      onMouseEnter={() => setSelectedCategory(i)}
                      onMouseLeave={() => setSelectedCategory(null)}
                      className="cursor-pointer"
                    />
                  );
                })}
                
                {/* Center text */}
                <text x="50" y="47" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  Total Items
                </text>
                <text x="50" y="59" textAnchor="middle" fill="#00ccff" fontSize="14" fontWeight="bold">
                  {jewelryItems.length}
                </text>
              </svg>
            </div>
            
            {/* Legend */}
            <div className="flex-grow grid grid-cols-1 gap-2 mt-2">
              {categoryDistribution.map((cat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    selectedCategory === i ? 'bg-[#1a1a3a]' : 'hover:bg-[#1a1a3a]/50'
                  }`}
                  onMouseEnter={() => setSelectedCategory(i)}
                  onMouseLeave={() => setSelectedCategory(null)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-grow text-sm font-medium text-white">
                    {cat.name}
                  </div>
                  <div className="text-sm font-medium text-gray-400">
                    {cat.count} <span className="text-xs">({cat.percentage}%)</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Category Performance Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Category Performance</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryPerformance.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-[#0a0a23]/50 backdrop-blur-sm rounded-lg p-4 border border-[#1a1a3a]"
            >
              <div className="flex items-center mb-3">
                <div 
                  className="w-3 h-10 rounded-l-full mr-3" 
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <h4 className="text-white font-medium">{cat.name}</h4>
                  <p className="text-[#00ccff] text-sm">{cat.itemCount} items</p>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Revenue</span>
                  <span className="text-white font-medium">{formatCurrency(cat.totalSales)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg. Price</span>
                  <span className="text-white font-medium">{formatCurrency(cat.avgPrice)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Growth</span>
                <div className={`flex items-center ${
                  cat.growth > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {cat.growth > 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
                  <span className="font-medium">{Math.abs(cat.growth).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="px-6 py-4 border-b border-[#FFD700]/10">
            <h3 className="text-xl font-semibold text-white">Top Selling Products</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#080820]/70 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Product</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Price</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Sold</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD700]/10">
                {topSellingItems.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-[#FFD700]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={`http://127.0.0.1:5000/product_img/${item.unique_id}.jpg`}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                            }}
                          />
                        </div>
                        <div className="text-sm font-medium text-white">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#FFD700]">${item.price}</td>
                    <td className="px-6 py-4 text-sm text-white">{item.sold_count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.stock > 10 
                          ? 'bg-green-400/20 text-green-400' 
                          : item.stock > 5 
                            ? 'bg-yellow-400/20 text-yellow-400' 
                            : 'bg-red-400/20 text-red-400'
                      }`}>
                        {item.stock}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                
                {topSellingItems.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                      No product data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* Low Stock Alert */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#0E0E28]/80 backdrop-blur-xl rounded-xl border border-[#FFD700]/20 overflow-hidden shadow-lg"
        >
          <div className="px-6 py-4 border-b border-[#FFD700]/10">
            <h3 className="text-xl font-semibold text-white">Low Stock Alert</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#080820]/70 text-left">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Product</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Price</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Stock</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFD700]/10">
                {lowStockItems.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-[#FFD700]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={`http://127.0.0.1:5000/product_img/${item.unique_id}.jpg`}
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                            }}
                          />
                        </div>
                        <div className="text-sm font-medium text-white">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#FFD700]">${item.price}</td>
                    <td className="px-6 py-4 text-sm text-white">{item.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.stock === 0 
                          ? 'bg-red-500/20 text-red-500' 
                          : item.stock < 3 
                            ? 'bg-red-400/20 text-red-400' 
                            : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-400">
                      No low stock items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default StatisticsView; 