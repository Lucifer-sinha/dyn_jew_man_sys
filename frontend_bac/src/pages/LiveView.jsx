// src/pages/LiveView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronUp, FiChevronDown, FiGrid, FiList, FiStar, FiShoppingBag, FiTrendingUp, FiTrendingDown, FiDollarSign, FiSearch, FiSliders, FiActivity, FiDroplet, FiClock, FiCheck, FiTag, FiPercent } from 'react-icons/fi';

// Single default export
function LiveView({ 
  items, 
  addToCart, 
  goldPrice, 
  silverPrice, 
  onItemClick, 
  categories = [], 
  topLevelCategories = [], 
  selectedCategoryId, 
  setSelectedCategoryId 
}) {
  console.log("LiveView: Received items", items?.length);
  
  // State for UI controls
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [debugRerenderFlag, setDebugRerenderFlag] = useState(false); // For forcing re-renders in debug mode
  
  // For debugging
  const [categoryDebug, setCategoryDebug] = useState({
    rendered: false,
    topLevelCount: topLevelCategories?.length || 0,
    allCategoriesCount: categories?.length || 0,
    selectedId: selectedCategoryId
  });
  
  // Update debug info when props change
  useEffect(() => {
    console.log("LiveView: Categories updated", {
      topLevel: topLevelCategories?.map(c => `${c.name}(${c.id})`),
      selected: selectedCategoryId,
      itemCount: items?.length
    });
    
    // Additional debugging for category consistency
    if (selectedCategoryId) {
      console.log(`🔍 Checking selected category: ${selectedCategoryId}`);
      
      // Convert to parent category if needed
      const effectiveCategoryId = getEffectiveCategoryId(selectedCategoryId);
      
      if (effectiveCategoryId !== selectedCategoryId) {
        console.log(`🔄 Using parent category ${effectiveCategoryId} instead of ${selectedCategoryId}`);
      }
      
      // Verify the category exists in our data
      const selectedCatExists = categories.some(cat => 
        Number(cat.id) === Number(effectiveCategoryId)
      );
      
      if (!selectedCatExists) {
        console.warn(`⚠️ WARNING: Selected category ID ${selectedCategoryId} not found in categories data!`);
      } else {
        // Log the category name and details
        const selectedCat = categories.find(cat => Number(cat.id) === Number(effectiveCategoryId));
        console.log(`✓ Selected category exists: ${selectedCat.name} (ID: ${selectedCat.id})`);
        
        // Verify if the category has children
        const children = categories.filter(cat => 
          cat.parent_id && Number(cat.parent_id) === Number(effectiveCategoryId)
        );
        
        if (children.length > 0) {
          console.log(`✓ Category has ${children.length} direct children:`, 
            children.map(c => `${c.name}(${c.id})`));
        } else {
          console.log(`ℹ️ Category has no direct children`);
        }
      }
      
      // Check if any items have this category
      if (items && items.length > 0) {
        const itemsWithCategory = items.filter(item => {
          if (!item.category_id) return false;
          
          const itemCategoryId = Number(item.category_id);
          const selectedCatId = Number(selectedCategoryId);
          
          // Direct match
          if (itemCategoryId === selectedCatId) return true;
          
          // Check if item's category is a child of selected category
          const childCategories = getAllChildCategoryIds(selectedCategoryId);
          if (childCategories.includes(itemCategoryId)) return true;
          
          // Check if they map to the same parent
          if (getEffectiveCategoryId(itemCategoryId) === getEffectiveCategoryId(selectedCategoryId)) return true;
          
          return false;
        });
        
        if (itemsWithCategory.length > 0) {
          console.log(`✓ Found ${itemsWithCategory.length} items with matching category`);
        } else {
          console.warn(`⚠️ No items found with category ID ${selectedCategoryId} or its children`);
        }
      }
    }
    
    setCategoryDebug({
      rendered: true,
      topLevelCount: topLevelCategories?.length || 0,
      allCategoriesCount: categories?.length || 0,
      selectedId: selectedCategoryId
    });
  }, [topLevelCategories, categories, selectedCategoryId, items]);

  // Add this new useEffect after your existing ones
  useEffect(() => {
    // Only run this when categories are first loaded or change
    if (categories && categories.length > 0) {
      console.log(`🔍 LiveView: Verifying ${categories.length} categories data`);

      // Check if categories have the expected structure
      const validCategories = categories.filter(cat => 
        cat && typeof cat.id !== 'undefined' && cat.name
      );
      
      if (validCategories.length !== categories.length) {
        console.warn(`⚠️ Found ${categories.length - validCategories.length} invalid categories!`);
      }
      
      // Check for top-level categories
      const topLevel = categories.filter(cat => !cat.parent_id);
      console.log(`📂 Found ${topLevel.length} top-level categories:`, 
        topLevel.map(c => `${c.name}(${c.id})`));
      
      // Check if items match with categories
      if (items && items.length > 0) {
        const itemCategoryIds = [...new Set(items.map(item => 
          item.category_id ? Number(item.category_id) : null
        ))];
        
        console.log(`🏷️ Items use ${itemCategoryIds.length} unique category IDs:`, itemCategoryIds);
        
        // Check for category IDs in items that don't exist in categories
        const missingCategories = itemCategoryIds.filter(id => 
          id !== null && !categories.some(cat => Number(cat.id) === id)
        );
        
        if (missingCategories.length > 0) {
          console.warn(`⚠️ Found ${missingCategories.length} category IDs used in items but missing from categories:`, missingCategories);
        }
      }
    }
  }, [categories, items]);

  // Advanced filtering state
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'lowStock', 'outOfStock'
  const [searchTerm, setSearchTerm] = useState('');
  
  // For the purpose of the demo, we'll add a platinum price
  const platinumPrice = 912.40;

  // Create price display values with fallbacks
  const prices = {
    gold: goldPrice || 5000,
    silver: silverPrice || 70,
    platinum: platinumPrice
  };

  // Trend indicators
  const trends = {
    gold: { change: '+1.2%', direction: 'up' },
    silver: { change: '-0.3%', direction: 'down' },
    platinum: { change: '+0.8%', direction: 'up' }
  };

  // Get just the name of a category by ID
  const getCategoryName = (categoryId) => {
    // Convert to number for consistent comparison
    const numericCategoryId = Number(categoryId);
    
    // First attempt direct match
    const category = categories.find(cat => Number(cat.id) === numericCategoryId);
    
    if (category) {
      console.log(`Found direct category match: ${category.name} (ID: ${category.id})`);
      return category.name;
    }
    
    // If no direct match, try to find a parent category
    // This handles cases where subcategory IDs might not be in our categories array
    for (const cat of categories) {
      if (cat.subcategories && cat.subcategories.some(sub => Number(sub.id) === numericCategoryId)) {
        const subcategory = cat.subcategories.find(sub => Number(sub.id) === numericCategoryId);
        console.log(`Found subcategory ${subcategory.name} under parent ${cat.name}`);
        return `${cat.name} / ${subcategory.name}`;
      }
    }
    
    console.warn(`No category found with ID: ${categoryId}`);
    return "Uncategorized";
  };

  // Get category path for an item
  // This will help show the full category path instead of "Uncategorized"
  const getCategoryPath = (catId) => {
    // Debug to check received category ID
    console.log(`Getting path for category ID: ${catId}, type: ${typeof catId}`);
    
    // If there's no category ID or categories aren't loaded yet, return "Uncategorized"
    if (!catId || !categories || categories.length === 0) {
      console.log(`No category ID or categories not loaded for ID: ${catId}`);
      return 'Uncategorized';
    }
    
    // Convert to number for consistent comparison
    const originalCategoryId = Number(catId);
    
    // Apply the subcategory mapping if needed
    const categoryId = getEffectiveCategoryId(originalCategoryId);
    
    // Find the category in our list
    const category = categories.find(c => Number(c.id) === categoryId);
    
    // If category not found, return "Uncategorized"
    if (!category) {
      console.log(`Category not found for ID: ${categoryId}. Available categories:`, 
        categories.map(c => `${c.id}:${c.name}`).join(', '));
      return 'Uncategorized';
    }
    
    console.log(`Found category ${category.name} (ID: ${category.id}) with parent: ${category.parent_id}`);
    
    let path = [];
    let currentCategory = category;
    let maxDepth = 10; // Prevent infinite loops
    
    // Build the path from the current category to the root
    while (currentCategory && maxDepth > 0) {
      path.unshift(currentCategory.name);
      
      // If this category has a parent, find it
      if (currentCategory.parent_id) {
        const parentCategory = categories.find(c => Number(c.id) === Number(currentCategory.parent_id));
        
        if (parentCategory) {
          currentCategory = parentCategory;
        } else {
          console.log(`Parent category ${currentCategory.parent_id} not found for ${currentCategory.name}`);
          break;
        }
      } else {
        currentCategory = null;
      }
      
      maxDepth--;
    }
    
    // If this is a subcategory that was mapped, add the original subcategory name
    if (originalCategoryId !== categoryId) {
      // Find the original category to add its name
      const originalCategory = items.find(item => Number(item.category_id) === originalCategoryId);
      if (originalCategory && originalCategory.category_name) {
        path.push(originalCategory.category_name);
      }
    }
    
    const result = path.join(' → ');
    console.log(`Final category path: ${result}`);
    return result;
  };
  
  // Checks if a category is active or a parent of the active category
  const isCategoryActive = (categoryId) => {
    if (selectedCategoryId === categoryId) return true;
    
    // Check if this category is a parent of the selected category
    if (selectedCategoryId) {
      let currentCat = categories.find(c => c.id === selectedCategoryId);
      while (currentCat && currentCat.parent_id) {
        if (currentCat.parent_id === categoryId) return true;
        currentCat = categories.find(c => c.id === currentCat.parent_id);
      }
    }
    
    return false;
  };

  // Helper to format price with animation - change $ to ₹
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Price card components - Optimized with reduced animations
  const PriceCard = ({ metal, price, trend }) => (
    <div className="bg-[#11112a] rounded-lg border border-[#1a1a3a] p-4 h-full relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-neutral-300 uppercase mb-2">
            {metal}
          </h3>
          
          <p className="text-2xl font-bold text-white">
            {formatPrice(price)}
          </p>
        </div>
        
        <div className={`flex items-center gap-1 ${
          trend.direction === 'up' ? 'text-emerald-400' : 'text-rose-400'
        } text-xs`}>
          {trend.direction === 'up' ? 
            <FiTrendingUp className="stroke-2" /> : 
            <FiTrendingDown className="stroke-2" />
          }
          <span>{trend.change}</span>
        </div>
      </div>
      
      <div className="mt-3 relative">
        <div className="h-1 w-full bg-[#1a1a3a] rounded-full overflow-hidden">
          <div 
            className={`h-full ${
              metal === 'gold' ? 'bg-amber-400' : 
              metal === 'silver' ? 'bg-neutral-300' : 
              'bg-neutral-200'
            }`}
            style={{ width: trend.direction === 'up' ? '65%' : '35%' }}
          />
        </div>
      </div>
    </div>
  );
  
  // Get all subcategories for a given category (for proper filtering)
  const getAllChildCategoryIds = (parentId) => {
    if (!parentId) return [];
    
    console.log(`Finding child categories for parent ID: ${parentId} (type: ${typeof parentId})`);
    
    // Ensure parentId is a number
    const numericParentId = Number(parentId);
    
    // Start with the parent ID itself
    let result = [numericParentId];
    
    // Function to recursively find all children
    const findChildren = (id) => {
      // Convert id to number for consistent comparison
      const numId = Number(id);
      
      console.log(`Looking for children of category ${numId}`);
      
      // Find all direct children of this ID
      const children = categories.filter(category => {
        // Ensure we're comparing numbers with numbers
        const categoryParentId = category.parent_id ? Number(category.parent_id) : null;
        const isChild = categoryParentId === numId;
        
        if (isChild) {
          console.log(`Found child: category ${category.id} (${category.name}) is child of ${numId}`);
        }
        
        return isChild;
      });
      
      if (children.length === 0) {
        console.log(`No children found for category ${numId}`);
      }
      
      // Process each child
      children.forEach(child => {
        const childId = Number(child.id);
        result.push(childId); // Add this child
        findChildren(childId); // Find its children
      });
    };
    
    // Start the recursive search
    findChildren(numericParentId);
    
    // Log for debugging
    console.log(`Category ${numericParentId} has children:`, result);
    
    // Return unique IDs (removing duplicates)
    return [...new Set(result)];
  };
  
  // Get available materials from items for the filter
  const availableMaterials = useMemo(() => {
    if (!items) return [];
    const materials = new Set();
    items.forEach(item => {
      if (item.material_id) {
        materials.add(item.material_id);
      }
    });
    return Array.from(materials);
  }, [items]);
  
  // Get material name by ID
  const getMaterialName = (materialId) => {
    // This would normally come from a materials array passed as props
    // For now using simple mapping
    const materialMap = {
      1: 'Gold',
      2: 'Silver',
      3: 'Platinum',
      4: 'Diamond',
      5: 'Mixed'
    };
    return materialMap[materialId] || 'Unknown';
  };
  
  // Add this function to handle missing category IDs by mapping subcategories to their parents
  const getEffectiveCategoryId = (categoryId) => {
    if (!categoryId) return null;
    
    // Force category ID to be a number
    const numericId = Number(categoryId);
    
    // Check if this category exists in our categories array
    const categoryExists = categories.some(cat => Number(cat.id) === numericId);
    
    if (categoryExists) {
      return numericId; // Category exists, use it as is
    }
    
    // Known mappings of subcategory IDs to their parent categories
    // Based on backend logs showing the actual relationships
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
      console.log(`🔄 Mapping subcategory ${numericId} to parent category ${subcategoryMapping[numericId]}`);
      return subcategoryMapping[numericId];
    }
    
    // Otherwise just return the original ID
    return numericId;
  };
  
  // Apply all filters to items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    // Add detailed debugging for items received
    console.log(`🔍 LiveView filtering ${items.length} items with selectedCategoryId: ${selectedCategoryId} (type: ${typeof selectedCategoryId})`);
    
    return items.filter(item => {
      // Special case - no category filter
      if (selectedCategoryId === null) {
        return true; // When no category selected, include all items
      }
      
      // Skip category filtering if item has no category ID (should show in all categories)
      if (!item.category_id) {
        console.log(`Item ${item.name} has no category_id, showing in all categories`);
        return true;
      }
      
      // Convert to numbers for consistent comparison
      const itemCategoryId = Number(item.category_id);
      const selectedCatId = Number(selectedCategoryId);
      
      // Map to parent categories if needed
      const effectiveItemCategoryId = getEffectiveCategoryId(itemCategoryId);
      const effectiveSelectedCatId = getEffectiveCategoryId(selectedCatId);
      
      console.log(`Comparing item "${item.name}" category ${itemCategoryId} (effective: ${effectiveItemCategoryId}) with selected ${selectedCatId} (effective: ${effectiveSelectedCatId})`);
      
      // Direct match - item is exactly in selected category
      if (itemCategoryId === selectedCatId) {
        console.log(`✅ MATCH: Item ${item.name} directly matches selected category ${selectedCategoryId}`);
        return true;
      }
      
      // Mapped category match
      if (effectiveItemCategoryId === effectiveSelectedCatId) {
        console.log(`✅ MATCH: Item ${item.name} matches selected category ${selectedCategoryId} via parent mapping`);
        return true;
      }
      
      // Child match - item is in a child category of selected category
      const childCategories = getAllChildCategoryIds(selectedCategoryId);
      
      // Ensure we're comparing numbers with numbers in the includes check
      if (childCategories.some(id => Number(id) === itemCategoryId)) {
        console.log(`✅ MATCH: Item ${item.name} is in child category ${itemCategoryId} of ${selectedCategoryId}`);
        return true;
      }
      
      // Try string comparison as a fallback (for edge cases)
      if (String(itemCategoryId) === String(selectedCategoryId)) {
        console.log(`✅ MATCH: Item ${item.name} matches category ${selectedCategoryId} using string comparison`);
        return true;
      }
      
      // Category mismatch
      console.log(`❌ EXCLUDE: Item ${item.name} (category ${itemCategoryId}) not in category ${selectedCategoryId} or its children`);
      return false;
    }).filter(item => {
      // Other filters continue normally
      
      // Add debugging for non-category filters
      let includeItem = true;
      
      // Price range filter
      if (item.price < priceRange[0] || item.price > priceRange[1]) {
        console.log(`Price filter excluded: ${item.name} (${item.price} not in range ${priceRange[0]}-${priceRange[1]})`);
        includeItem = false;
      }
      
      // Material filter
      if (selectedMaterials.length > 0 && !selectedMaterials.includes(item.material_id)) {
        console.log(`Material filter excluded: ${item.name} (material ${item.material_id} not in ${selectedMaterials})`);
        includeItem = false;
      }
      
      // Stock filter
      if (stockFilter === 'inStock' && item.stock <= 0) {
        console.log(`Stock filter excluded: ${item.name} (not in stock)`);
        includeItem = false;
      }
      if (stockFilter === 'lowStock' && (item.stock <= 0 || item.stock > 3)) {
        console.log(`Stock filter excluded: ${item.name} (not low stock)`);
        includeItem = false;
      }
      if (stockFilter === 'outOfStock' && item.stock > 0) {
        console.log(`Stock filter excluded: ${item.name} (not out of stock)`);
        includeItem = false;
      }
      
      // Search term
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        console.log(`Search filter excluded: ${item.name} (doesn't match "${searchTerm}")`);
        includeItem = false;
      }
      
      return includeItem;
    });
  }, [items, selectedCategoryId, priceRange, selectedMaterials, stockFilter, searchTerm, categories, debugRerenderFlag]);
  
  // Add more detailed logging after filtering  
  useEffect(() => {
    if (items && items.length > 0) {
      console.log(`Filtering results: ${items.length} items → ${filteredItems.length} displayed`);
      if (filteredItems.length === 0 && items.length > 0) {
        console.log('❗ WARNING: All items were filtered out!');
        console.log('Original items:', items);
        console.log('Filter settings:', { 
          selectedCategoryId, 
          priceRange, 
          selectedMaterials, 
          stockFilter,
          searchTerm 
        });
      }
    }
  }, [filteredItems, items, selectedCategoryId, priceRange, selectedMaterials, stockFilter, searchTerm, debugRerenderFlag]);
  
  // Reset all filters
  const resetFilters = () => {
    setPriceRange([0, 100000]);
    setSelectedMaterials([]);
    setStockFilter('all');
    setSearchTerm('');
  };
  
  // Toggle material selection
  const toggleMaterial = (materialId) => {
    if (selectedMaterials.includes(materialId)) {
      setSelectedMaterials(selectedMaterials.filter(id => id !== materialId));
    } else {
      setSelectedMaterials([...selectedMaterials, materialId]);
    }
  };
  
  // Handle category click with proper type conversion
  const handleCategoryClick = (categoryIdOrName) => {
    console.log(`Clicking category: ${categoryIdOrName} (type: ${typeof categoryIdOrName})`);
    
    // If categoryId is null, undefined, or empty string, set it to null
    if (categoryIdOrName == null || categoryIdOrName === '') {
      setSelectedCategoryId(null);
      return;
    }
    
    let categoryIdToUse = null;
    
    // If it's already a number, use it directly
    if (typeof categoryIdOrName === 'number') {
      categoryIdToUse = categoryIdOrName;
    }
    // If it's a numeric string, convert to number
    else if (typeof categoryIdOrName === 'string' && !isNaN(Number(categoryIdOrName))) {
      categoryIdToUse = Number(categoryIdOrName);
    }
    // If it's a string (category name), find the corresponding ID by case-insensitive matching
    else if (typeof categoryIdOrName === 'string') {
      // Find the category by name (case-insensitive)
      const category = categories.find(
        c => c.name && c.name.toLowerCase() === categoryIdOrName.toLowerCase()
      );
      
      if (category) {
        console.log(`Found category ID ${category.id} for name "${categoryIdOrName}"`);
        categoryIdToUse = Number(category.id);
      } else {
        console.warn(`No category found with name: ${categoryIdOrName}`);
      }
    }
    
    // Verify the category exists in our data
    if (categoryIdToUse !== null) {
      const categoryExists = categories.some(cat => Number(cat.id) === categoryIdToUse);
      if (!categoryExists) {
        console.warn(`Category with ID ${categoryIdToUse} not found in data`);
        categoryIdToUse = null;
      }
    }
    
    console.log("Setting selected category ID to:", categoryIdToUse);
    setSelectedCategoryId(categoryIdToUse);
  };
  
  console.log("Displaying", filteredItems.length, "items");
  
  return (
    <div className="text-white max-w-7xl mx-auto">
      {/* Metal Prices Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
        <span className="text-[#3d3dbd] h-6 w-4" style={{ fontSize: '23px' }}>₹</span>

          <h2 className="text-base font-medium text-white">Today's Market Rate/gm</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <PriceCard metal="gold" price={prices.gold} trend={trends.gold} />
          <PriceCard metal="silver" price={prices.silver} trend={trends.silver} />
          <PriceCard metal="platinum" price={prices.platinum} trend={trends.platinum} />
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-[#11112a]/80 backdrop-blur-lg rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-white">Premium Collection</h2>
            
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jewelry..."
                className="bg-[#0a0a23] border border-[#1a1a3a] rounded-md text-xs py-1.5 pl-7 pr-3 w-40 text-white focus:outline-none focus:ring-1 focus:ring-[#3d3dbd] focus:border-[#3d3dbd]"
              />
              <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#3d3dbd] h-3 w-3" />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <FiX className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filter toggle */}
            <button 
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0a23] text-white rounded-md text-xs"
            >
              <FiFilter size={14} />
              <span>Filter</span>
              {(priceRange[0] > 0 || priceRange[1] < 1000000000 || selectedMaterials.length > 0 || stockFilter !== 'all') && (
                <span className="bg-[#3d3dbd] w-4 h-4 rounded-full flex items-center justify-center text-[9px]">
                  {selectedMaterials.length + (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0)}
            </span>
              )}
            </button>
            
            {/* View toggle */}
            <div className="bg-[#0a0a23] rounded-md flex overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`flex items-center gap-1 px-3 py-1.5 ${viewMode === 'grid' ? 'bg-[#3d3dbd] text-white' : 'text-neutral-400'}`}
              >
                <FiGrid size={14} />
                <span className="text-xs">Grid</span>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-1 px-3 py-1.5 ${viewMode === 'list' ? 'bg-[#3d3dbd] text-white' : 'text-neutral-400'}`}
              >
                <FiList size={14} />
                <span className="text-xs">List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-[#11112a]/80 backdrop-blur-lg rounded-lg p-4 mb-4 border border-[#1a1a3a]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <FiSliders className="text-[#3d3dbd]" />
                  Advanced Filters
                </h3>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetFilters}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Reset All
                  </button>
                  <button 
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="bg-[#0a0a23] h-5 w-5 rounded-full flex items-center justify-center"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-medium mb-2 text-neutral-300 flex items-center gap-1">
                    <FiDollarSign size={12} className="text-[#3d3dbd]" />
                    Price Range
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Min Price</label>
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full bg-[#0a0a23] border border-[#1a1a3a] rounded text-xs py-1.5 px-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Max Price</label>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full bg-[#0a0a23] border border-[#1a1a3a] rounded text-xs py-1.5 px-2 text-white"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Material Filter */}
                <div>
                  <h4 className="text-xs font-medium mb-2 text-neutral-300 flex items-center gap-1">
                    <FiActivity size={12} className="text-[#3d3dbd]" />
                    Material
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map(materialId => (
                      <button
                        key={materialId}
                        onClick={() => toggleMaterial(materialId)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          selectedMaterials.includes(materialId)
                            ? 'bg-[#3d3dbd] text-white'
                            : 'bg-[#0a0a23] text-neutral-300'
                        }`}
                      >
                        {selectedMaterials.includes(materialId) && <FiCheck size={10} />}
                        {getMaterialName(materialId)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Stock Filter */}
                <div>
                  <h4 className="text-xs font-medium mb-2 text-neutral-300 flex items-center gap-1">
                    <FiTag size={12} className="text-[#3d3dbd]" />
                    Availability
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'All Items' },
                      { id: 'inStock', label: 'In Stock' },
                      { id: 'lowStock', label: 'Low Stock' },
                      { id: 'outOfStock', label: 'Out of Stock' }
                    ].map(option => (
                      <button
                        key={option.id}
                        onClick={() => setStockFilter(option.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          stockFilter === option.id
                            ? 'bg-[#3d3dbd] text-white'
                            : 'bg-[#0a0a23] text-neutral-300'
                        }`}
                      >
                        {stockFilter === option.id && <FiCheck size={10} />}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Active filters */}
              {(priceRange[0] > 0 || priceRange[1] < 100000 || selectedMaterials.length > 0 || stockFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t border-[#1a1a3a]">
                  <div className="flex items-center gap-2 text-xs text-neutral-300 mb-2">
                    <FiFilter size={12} className="text-[#3d3dbd]" />
                    <span>Active Filters:</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {priceRange[0] > 0 && (
                      <div className="bg-[#0a0a23] text-neutral-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                        <span>Min: {formatPrice(priceRange[0])}</span>
                        <button 
                          onClick={() => setPriceRange([0, priceRange[1]])}
                          className="text-neutral-400 hover:text-white"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    )}
                    
                    {priceRange[1] < 100000 && (
                      <div className="bg-[#0a0a23] text-neutral-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                        <span>Max: {formatPrice(priceRange[1])}</span>
                        <button 
                          onClick={() => setPriceRange([priceRange[0], 100000])}
                          className="text-neutral-400 hover:text-white"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    )}
                    
                    {selectedMaterials.map(materialId => (
                      <div key={materialId} className="bg-[#0a0a23] text-neutral-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                        <span>{getMaterialName(materialId)}</span>
                        <button 
                          onClick={() => toggleMaterial(materialId)}
                          className="text-neutral-400 hover:text-white"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                    
                    {stockFilter !== 'all' && (
                      <div className="bg-[#0a0a23] text-neutral-300 rounded px-2 py-1 text-xs flex items-center gap-1">
                        <span>
                          {stockFilter === 'inStock' ? 'In Stock' : 
                           stockFilter === 'lowStock' ? 'Low Stock' : 
                           'Out of Stock'}
                        </span>
                        <button 
                          onClick={() => setStockFilter('all')}
                          className="text-neutral-400 hover:text-white"
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
            
      {/* Category Chips - Dynamically loaded from API */}
      <div className="mb-6">
        <div className="flex bg-[#0a0a23]/80 p-2 rounded-lg overflow-x-auto">
          <button 
            onClick={() => handleCategoryClick(null)}
            className={`px-5 py-2 rounded-md text-sm font-bold uppercase tracking-wider ${
              selectedCategoryId === null 
                ? 'bg-[#3d3dbd] text-white' 
                : 'text-white hover:bg-[#1a1a3a]/60'
            }`}
          >
            All Items
          </button>
          
          {/* Debug information - only in development */}
          {process.env.NODE_ENV === 'development' && categoryDebug.topLevelCount === 0 && (
            <div className="px-4 py-2 bg-orange-400/20 text-orange-400 text-xs rounded-md flex items-center">
              <span>DEBUG: No top-level categories loaded ({categoryDebug.allCategoriesCount} total)</span>
            </div>
          )}
          
          {/* Map only real top-level categories from API */}
          {topLevelCategories && topLevelCategories.length > 0 ? (
            topLevelCategories.map(category => (
              <button 
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`px-5 py-2 rounded-md text-sm font-bold uppercase tracking-wider whitespace-nowrap ${
                  selectedCategoryId === Number(category.id) 
                    ? 'bg-[#3d3dbd] text-white' 
                    : 'text-white hover:bg-[#1a1a3a]/60'
                }`}
              >
                {category.name.toUpperCase()}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400 text-xs">Loading categories...</div>
          )}
          
          {/* Display current selected category */}
          {selectedCategoryId && getCategoryName(selectedCategoryId) !== 'Uncategorized' && (
            <div className="ml-2 px-3 py-1 bg-[#3d3dbd]/20 rounded-md flex items-center gap-1 text-xs">
              <span>Selected:</span>
              <span className="font-bold">{getCategoryName(selectedCategoryId)}</span>
              <button 
                onClick={() => handleCategoryClick(null)}
                className="ml-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Section with debug info */}
      <div className="min-h-[300px]">
        {!items || items.length === 0 ? (
          <div className="bg-[#11112a]/80 backdrop-blur-lg rounded-lg p-8 text-center">
            <FiSearch className="h-6 w-6 text-[#3d3dbd] mx-auto mb-3" />
            <h3 className="text-base font-medium text-white mb-1">
              {selectedCategoryId ? 'No items in this category' : 'Loading items...'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {selectedCategoryId ? 
                `No items found in ${getCategoryName(selectedCategoryId)} category.` : 
                'Please wait while we fetch the jewelry collection.'}
            </p>
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-left bg-gray-800/50 p-4 rounded-md max-w-md mx-auto">
                <p className="text-xs text-gray-400 mb-1">DEBUG INFO:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>Selected Category: {selectedCategoryId ? `#${selectedCategoryId} (${getCategoryName(selectedCategoryId)})` : 'None'}</li>
                  <li>Top Level Categories: {topLevelCategories?.length || 0}</li>
                  <li>All Categories: {categories?.length || 0}</li>
                  <li>Total Items: {items?.length || 0}</li>
                  <li>Filtered Items: {filteredItems?.length || 0}</li>
                  {selectedCategoryId && (
                    <li>
                      Category Children: {
                        getAllChildCategoryIds(selectedCategoryId).length > 0 
                          ? getAllChildCategoryIds(selectedCategoryId).map(id => getCategoryName(id)).join(', ')
                          : 'None'
                      }
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => {
                    console.log({
                      items,
                      categories,
                      filteredItems,
                      selectedCategoryId,
                      childCategories: getAllChildCategoryIds(selectedCategoryId)
                    });
                    // Force re-render to verify filtering (for debugging)
                    setDebugRerenderFlag(prev => !prev);
                  }}
                  className="mt-2 text-xs bg-[#3d3dbd]/50 hover:bg-[#3d3dbd] px-2 py-1 rounded text-white"
                >
                  Log Debug Info & Force Re-filter
                </button>
              </div>
            )}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-[#11112a]/80 backdrop-blur-lg rounded-lg p-8 text-center">
            <FiSearch className="h-6 w-6 text-[#3d3dbd] mx-auto mb-3" />
            <h3 className="text-base font-medium text-white mb-1">No items found</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
            
            {/* Additional debug info for empty filtered results */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-left bg-red-900/30 p-4 rounded-md max-w-md mx-auto">
                <p className="text-xs text-red-400 mb-1">FILTER DEBUG:</p>
                <ul className="text-xs text-red-300 space-y-1">
                  <li>Items Available: {items.length}</li>
                  <li>Filtered Items: 0</li>
                  <li>Selected Category: {selectedCategoryId ? `#${selectedCategoryId} (${getCategoryName(selectedCategoryId)})` : 'None'}</li>
                  <li>Price Range: {priceRange[0]} - {priceRange[1]}</li>
                  <li>Materials Filter: {selectedMaterials.length ? selectedMaterials.map(m => getMaterialName(m)).join(', ') : 'None'}</li>
                  <li>Stock Filter: {stockFilter}</li>
                  <li>Search Term: {searchTerm || 'None'}</li>
                </ul>
                <button
                  onClick={() => {
                    // Reset filters except category
                    setPriceRange([0, 100000]);
                    setSelectedMaterials([]);
                    setStockFilter('all');
                    setSearchTerm('');
                  }}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-white"
                >
                  Reset All Filters (Keep Category)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            className={viewMode === 'grid' 
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" 
              : "flex flex-col space-y-2"
            }
          >
            {/* Add debug log to verify filteredItems content */}
            {console.log("🖥️ Rendering items:", filteredItems)}
            
            {filteredItems.map(item => (
              <div
              key={item.id}
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className={`group cursor-pointer relative ${
                  viewMode === 'grid' 
                    ? 'bg-[#11112a]/80 backdrop-blur-lg rounded-lg overflow-hidden border border-[#1a1a3a]' 
                    : 'bg-[#11112a]/80 backdrop-blur-lg rounded-lg overflow-hidden border border-[#1a1a3a] flex items-center'
                }`}
              onClick={() => onItemClick(item)}
            >
                {viewMode === 'grid' ? (
                  // Grid View - Optimized with simpler transitions
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={`http://127.0.0.1:5000/product_img/${item.unique_id}.jpg`}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                        }}
                      />
                      
                      {/* Stock badge */}
                      {item.stock <= 0 ? (
                        <div className="absolute top-2 right-2 bg-rose-500/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Out of Stock
                        </div>
                      ) : item.stock <= 3 ? (
                        <div className="absolute top-2 right-2 bg-amber-500/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                          Low Stock
                        </div>
                      ) : null}
                      
                      {/* Category tag - Updated to show full category path */}
                      <div className="absolute top-2 left-2 bg-[#0a0a23]/90 text-white text-[10px] px-2 py-1 rounded max-w-[90%] truncate border border-[#3d3dbd]/30">
                        {getCategoryPath(item.category_id)}
                      </div>
                      
                      {/* Quick actions */}
                      {hoveredItemId === item.id && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000]/90 to-transparent py-2 px-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-white">{formatPrice(item.price)}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(item.id);
                                }}
                                disabled={item.stock <= 0}
                                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                  item.stock > 0 
                                    ? 'bg-[#3d3dbd] text-white' 
                                    : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                }`}
                              >
                                <FiShoppingBag size={12} />
                              </button>
                              <button
                                className="h-6 w-6 bg-[#0a0a23] text-white rounded-full flex items-center justify-center"
                              >
                                <FiStar size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2.5">
                      <h3 className="text-sm font-medium mb-0.5 text-white group-hover:text-[#3d3dbd] transition-colors truncate">
                        {item.name}
                      </h3>
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>ID: {item.unique_id}</span>
                        <span className={item.stock <= 0 ? 'text-rose-400' : item.stock <= 3 ? 'text-amber-400' : 'text-emerald-400'}>
                          Stock: {item.stock}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  // List View
                  <>
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden ml-2.5">
              <img
                src={`http://127.0.0.1:5000/product_img/${item.unique_id}.jpg`}
                alt={item.name}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                      />
                    </div>
                    
                    <div className="flex-grow p-2.5 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-white group-hover:text-[#3d3dbd] transition-colors truncate">
                            {item.name}
                          </h3>
                          <span className="text-[10px] bg-[#0a0a23] text-white px-2 py-0.5 rounded border border-[#3d3dbd]/30">
                            {getCategoryPath(item.category_id)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral-400">ID: {item.unique_id}</span>
                          <span className={`text-[10px] ${item.stock <= 0 ? 'text-rose-400' : item.stock <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            Stock: {item.stock}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-white">{formatPrice(item.price)}</p>
                        
              <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item.id);
                          }}
                          disabled={item.stock <= 0}
                          className={`text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1 ${
                            item.stock > 0 
                              ? 'bg-[#3d3dbd] text-white' 
                              : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                          }`}
                        >
                          <FiShoppingBag size={10} />
                          <span className="hidden sm:inline">Add</span>
              </button>
                        
                        {item.stock <= 0 && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination - Simplified */}
      {filteredItems && filteredItems.length > 0 && (
        <div className="mt-6 flex justify-center">
          <div className="bg-[#11112a]/80 backdrop-blur-lg rounded-md overflow-hidden flex text-xs">
            <button className="px-2.5 py-1.5 text-neutral-400">
              <FiChevronUp className="transform rotate-180" size={14} />
            </button>
            <button className="px-2.5 py-1.5 bg-[#3d3dbd] text-white">1</button>
            <button className="px-2.5 py-1.5 text-neutral-400">2</button>
            <button className="px-2.5 py-1.5 text-neutral-400">3</button>
            <button className="px-2.5 py-1.5 text-neutral-400">
              <FiChevronDown size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveView;
