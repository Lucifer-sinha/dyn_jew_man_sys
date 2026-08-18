// src/pages/DetailsView.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiSave, FiX, FiTag, FiDollarSign, FiPackage, FiBox, FiList, FiFolder } from 'react-icons/fi';

// Helper function to format currency with Rupee symbol
const formatCurrency = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

function DetailsView({ item, onEditClick, onDeleteClick, onCategoryClick, categories = [] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(null);

  if (!item) return null;

  const handleEditStart = () => {
    setEditedItem({...item});
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedItem(null);
  };

  const handleEditSave = () => {
    onEditClick(editedItem);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedItem({
      ...editedItem,
      [name]: value
    });
  };

  // Filter the categories to only get top-level categories for the dropdown
  const topLevelCategories = categories.filter(cat => !cat.parent_id);

  // Find the category ID by name matching when clicking on buttons like "MEN"
  const getCategoryIdByName = (name) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Looking up category by name: "${name}"`);
    
    // Check if categories exist
    if (!categories || categories.length === 0) {
      console.warn(`[${timestamp}] ⚠️ Categories array is empty, using item's category ${item.category_id}`);
      return Number(item.category_id);
    }
    
    console.log(`[${timestamp}] Searching among ${categories.length} categories...`);
    
    // DEBUG: Log first few categories for diagnosis
    const sampleCategories = categories.slice(0, 5).map(c => `${c.name}(${c.id})`).join(', ');
    console.log(`[${timestamp}] Sample categories: ${sampleCategories}...`);
    
    // First try exact case-insensitive matching with trimmed strings
    const exactMatch = categories.find(c => 
      c.name && c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    
    if (exactMatch) {
      console.log(`[${timestamp}] ✓ Found exact category match: ${exactMatch.name} (ID: ${exactMatch.id})`);
      return Number(exactMatch.id);
    }
    
    // If exact match fails, try partial matching
    console.log(`[${timestamp}] No exact match found, trying partial match...`);
    const partialMatches = categories.filter(c => 
      c.name && (
        name.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    if (partialMatches.length > 0) {
      // If multiple matches, prefer the shortest name (likely more specific)
      const bestMatch = partialMatches.sort((a, b) => a.name.length - b.name.length)[0];
      console.log(`[${timestamp}] ✓ Found partial category match: ${bestMatch.name} (ID: ${bestMatch.id})`);
      return Number(bestMatch.id);
    }
    
    // Try searching by top-level categories (parent_id is null)
    const topLevel = categories.filter(c => !c.parent_id);
    console.log(`[${timestamp}] Trying top-level categories (${topLevel.length})`);
    
    // Look for a top-level category with a name similar to our search term
    const topLevelMatch = topLevel.find(c => 
      c.name && (
        name.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    if (topLevelMatch) {
      console.log(`[${timestamp}] ✓ Found top-level category match: ${topLevelMatch.name} (ID: ${topLevelMatch.id})`);
      return Number(topLevelMatch.id);
    }
    
    // If no match found, try checking if the name corresponds to a common top-level category
    // This handles cases where "men", "women", "kids" might not match exactly with how they're stored
    const commonCategories = {
      "men": ["men", "mens", "male", "gents", "gentlemen"],
      "women": ["women", "womens", "female", "ladies", "lady"],
      "kids": ["kids", "children", "child", "baby", "babies", "junior"]
    };
    
    for (const [categoryType, aliases] of Object.entries(commonCategories)) {
      if (aliases.some(alias => name.toLowerCase().includes(alias))) {
        const matchByType = categories.find(c => 
          c.name && aliases.some(alias => c.name.toLowerCase().includes(alias))
        );
        
        if (matchByType) {
          console.log(`[${timestamp}] ✓ Found match by category type "${categoryType}": ${matchByType.name} (ID: ${matchByType.id})`);
          return Number(matchByType.id);
        }
      }
    }
    
    // If specific category not found, use the item's category as fallback
    console.warn(`[${timestamp}] ✗ No category found with name: ${name}, using item's category ${item.category_id}`);
    return Number(item.category_id);
  };

  return (
    <div className="bg-[#11112a]/90 backdrop-blur-lg rounded-xl border border-[#111]/50 overflow-hidden max-w-5xl mx-auto shadow-xl">
      <div className="px-8 py-5 bg-gradient-to-r from-[#0a0a23] to-[#111153] border-b border-[#1a1a3a]">
        <h2 className="text-2xl md:text-3xl font-bold text-[#f3ba19]">
          {isEditing ? 'Edit Item' : item.name}
        </h2>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image */}
          <div className="flex-shrink-0 lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative group overflow-hidden rounded-lg"
            >
        <img
          src={`http://127.0.0.1:5000/product_img/${item.unique_id}.jpg`}
          alt={item.name}
                className="w-full aspect-square object-cover rounded-lg border border-[#1a1a3a] shadow-lg group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300?text=No+Image';
          }}
        />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-lg font-semibold truncate">{item.name}</p>
                <p className="text-[#00ccff] font-bold">{formatCurrency(item.price)}</p>
              </div>
            </motion.div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-[#1a1a3a]/70 rounded-lg text-sm text-gray-300 flex items-center gap-1.5">
                <FiTag className="text-[#f3ba19]" />
                ID: {item.unique_id}
              </div>
              <div className="px-3 py-1.5 bg-[#1a1a3a]/70 rounded-lg text-sm text-gray-300 flex items-center gap-1.5">
                <FiBox className="text-[#f3ba19]" />
                Stock: {item.stock}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex-grow lg:w-2/3">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  key="edit-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#0a0a23]/50 backdrop-blur-sm p-5 rounded-xl border border-[#1a1a3a]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editedItem.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Price (₹)</label>
                      <input
                        type="number"
                        name="price"
                        value={editedItem.price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Weight (g)</label>
                      <input
                        type="number"
                        name="weight"
                        value={editedItem.weight || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={editedItem.stock}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Category</label>
                      <select
                        name="category_id"
                        value={editedItem.category_id || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      >
                        <option value="">Select Category</option>
                        {topLevelCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Unique ID</label>
                      <input
                        type="text"
                        name="unique_id"
                        value={editedItem.unique_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
                    <textarea
                      name="description"
                      value={editedItem.description || ''}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 bg-[#1a1a3a] text-white border border-[#2a2a4a] rounded focus:outline-none focus:border-[#3d3dbd]"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditCancel}
                      className="px-4 py-2 bg-[#1a1a3a] text-white rounded-lg flex items-center gap-2 hover:bg-[#252550] transition-colors duration-200"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <FiX /> Cancel
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditSave}
                      className="px-4 py-2 bg-gradient-to-r from-[#3d3dbd] to-[#5151ca] text-white rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-[#3d3dbd]/20 transition-all duration-200"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <FiSave /> Save Changes
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="details-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-[#0a0a23]/50 rounded-xl backdrop-blur-sm border border-[#1a1a3a] overflow-hidden">
                    <table className="w-full border-collapse">
          <tbody>
                        <tr className="border-b border-[#1a1a3a]">
                          <td className="py-3 px-5 bg-[#11112a]/50 w-1/3 md:w-1/4">
                            <div className="flex items-center gap-2">
                              <FiDollarSign className="text-[#f3ba19]" />
                              <span className="font-medium text-gray-300">Price</span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-white font-semibold">
                            <span className="text-[#00ccff]">{formatCurrency(item.price)}</span>
                          </td>
            </tr>
                        
                        <tr className="border-b border-[#1a1a3a]">
                          <td className="py-3 px-5 bg-[#11112a]/50">
                            <div className="flex items-center gap-2">
                              <FiPackage className="text-[#f3ba19]" />
                              <span className="font-medium text-gray-300">Weight</span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-white">
                            {item.weight ? `${item.weight}g` : 'N/A'}
                          </td>
            </tr>
                        
                        <tr className="border-b border-[#1a1a3a]">
                          <td className="py-3 px-5 bg-[#11112a]/50">
                            <div className="flex items-center gap-2">
                              <FiList className="text-[#f3ba19]" />
                              <span className="font-medium text-gray-300">Description</span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-white">
                            {item.description || 'No description available'}
                          </td>
            </tr>
                        
            <tr>
                          <td className="py-3 px-5 bg-[#11112a]/50">
                            <div className="flex items-center gap-2">
                              <FiFolder className="text-[#f3ba19]" />
                              <span className="font-medium text-gray-300">Category</span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex flex-wrap gap-2">
                              {item.full_category_path && item.full_category_path.length > 0 ? (
                                item.full_category_path.map((cat, idx) => {
                                  return (
                                  <motion.button
                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        const timestamp = new Date().toISOString();
                                        const categoryId = getCategoryIdByName(cat);
                                        console.log(`[${timestamp}] Clicking category button: ${cat} → ID: ${categoryId}`);
                                        
                                        // Double-check if we can find this category directly in the categories array
                                        const directCategory = categories.find(c => Number(c.id) === Number(categoryId));
                                        if (directCategory) {
                                          console.log(`[${timestamp}] ✓ Category found in categories data: ${directCategory.name} (ID: ${directCategory.id})`);
                                        } else {
                                          console.warn(`[${timestamp}] ⚠️ Category ID ${categoryId} not found directly in categories data`);
                                          
                                          // Try to find a top-level category that may be a better match
                                          const topLevelCategories = categories.filter(c => !c.parent_id);
                                          console.log(`[${timestamp}] Trying from ${topLevelCategories.length} top-level categories`);
                                          
                                          // Try to find a better match from top-level categories
                                          if (topLevelCategories.length > 0) {
                                            // Common category names
                                            const commonCategories = {
                                              "men": ["men", "mens", "male", "gents", "gentlemen", "ring", "rings"],
                                              "women": ["women", "womens", "female", "ladies", "lady", "necklace", "bracelet", "bangles"],
                                              "kids": ["kids", "children", "child", "baby", "babies", "junior"]
                                            };
                                            
                                            // See if our category name matches any of the common categories
                                            let categoryType = null;
                                            for (const [type, aliases] of Object.entries(commonCategories)) {
                                              if (aliases.some(alias => cat.toLowerCase().includes(alias))) {
                                                categoryType = type;
                                                break;
                                              }
                                            }
                                            
                                            if (categoryType) {
                                              console.log(`[${timestamp}] Category "${cat}" seems to be of type "${categoryType}"`);
                                              
                                              // Try to find a top-level category of this type
                                              const matchedCategory = topLevelCategories.find(c => 
                                                commonCategories[categoryType].some(alias => 
                                                  c.name.toLowerCase().includes(alias)
                                                )
                                              );
                                              
                                              if (matchedCategory) {
                                                console.log(`[${timestamp}] ✓ Found better match: ${matchedCategory.name} (ID: ${matchedCategory.id})`);
                                                // Use this better match instead
                                                if (onCategoryClick) onCategoryClick(Number(matchedCategory.id));
                                                return;
                                              }
                                            }
                                          }
                                        }
                                        
                                        // Use the original categoryId if we couldn't find a better match
                                        if (onCategoryClick) onCategoryClick(categoryId);
                                      }}
                                    className="cursor-pointer bg-[#3d3dbd] text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-[#4a4ad0]"
                                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {cat}
                                  </motion.button>
                                  );
                                })
                              ) : (
                                <span className="text-gray-400 italic">No category information</span>
                              )}
                            </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditStart}
                      className="px-4 py-2.5 bg-[#3d3dbd] text-white rounded-lg flex items-center gap-2 hover:bg-[#4a4ad0] transition-colors duration-200"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <FiEdit2 /> Edit Item
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
          onClick={() => onDeleteClick(item.id)}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#d32f2f] to-[#ef5350] text-white rounded-lg flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <FiTrash2 /> Delete
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailsView;
