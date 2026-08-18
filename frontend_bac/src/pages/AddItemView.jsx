// src/pages/AddItemView.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, Check, Camera, ArrowRight, Diamond, Sparkles, Gem, DollarSign, Weight, Package, FileText, Folder, FolderPlus, ChevronRight, Plus } from 'lucide-react';
import { authenticatedFetch } from '../utils/auth';

// Helper function to flatten nested categories with level (indentation)
const flattenCategories = (categories, level = 0) => {
  let flatList = [];
  categories.forEach(cat => {
    // Add current category with indentation info
    flatList.push({ id: cat.id, name: cat.name, level });
    // Recursively flatten subcategories if present
    if (cat.subcategories && cat.subcategories.length > 0) {
      flatList = flatList.concat(flattenCategories(cat.subcategories, level + 1));
    }
  });
  return flatList;
};

// Build a flat list of categories with proper indentation for the dropdown
const flattenCategoriesForDropdown = (categories) => {
  const result = [];
  
  // Helper function to recursively process categories with indentation
  const processCategory = (category, depth = 0) => {
    // Skip hidden categories
    if (!category.visibility) return;
    
    // Add this category with proper indentation
    result.push({
      id: category.id,
      name: category.name,
      depth: depth,
      isParent: category.subcategories && category.subcategories.length > 0,
      displayName: '  '.repeat(depth) + (depth > 0 ? '└─ ' : '') + category.name
    });
    
    // Process subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach(subcat => {
        processCategory(subcat, depth + 1);
      });
    }
  };
  
  // Start with top-level categories
  categories.filter(cat => !cat.parent_id).forEach(cat => {
    processCategory(cat);
  });
  
  return result;
};

function AddItemView({
  newItem, setNewItem,
  handleAddItem,
  categories, // flat structure
  nestedCategories = [], // nested tree structure
  materials,
  editItem, setEditItem,
  handleUpdateItem,
  selectedFile, setSelectedFile
}) {
  const [flatCategories, setFlatCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const fileInputRef = useRef(null);

  // --- New State for User Preferences ---
  const [userPreferences, setUserPreferences] = useState({
    price_at_add_item: true, // Default
    price_at_billing: false, // Default
    show_weight_input: true, // Default
  });
  // --------------------------------------

  // Flatten nested categories when prop changes
  useEffect(() => {
    if (categories && Array.isArray(categories)) {
      setFlatCategories(flattenCategories(categories));
    }
  }, [categories]);

  // Generate image preview when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setImagePreview(null);
      return;
    }

    setIsUploading(true);
    const objectUrl = URL.createObjectURL(selectedFile);
    
    // Simulate loading state for smoother UX
    setTimeout(() => {
      setImagePreview(objectUrl);
      setIsUploading(false);
    }, 800);

    // Free memory when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Background sparkle animation element
  const Sparkle = ({ delay, size, left, top, duration }) => (
    <motion.div
      className="absolute rounded-full bg-white z-0 pointer-events-none"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0, 1, 0], 
        scale: [0, 1, 0],
        x: [0, Math.random() * 20 - 10],
        y: [0, Math.random() * 20 - 10]
      }}
      transition={{ 
        repeat: Infinity, 
        duration, 
        delay 
      }}
      style={{ 
        width: size, 
        height: size, 
        left, 
        top,
        boxShadow: `0 0 ${size * 0.8}px ${size * 0.4}px rgba(255, 215, 0, 0.8)`,
        filter: 'blur(0.5px)'
      }}
    />
  );

  // Get all categories as a flat list with proper hierarchy for dropdown
  const flatCategoriesForDropdown = useMemo(() => {
    // Use nestedCategories if available, otherwise fall back to flattening the regular categories
    console.log("AddItemView: Using nested categories:", nestedCategories?.length || 0);
    console.log("AddItemView: Flat categories:", categories?.length || 0);
    
    const result = nestedCategories && nestedCategories.length > 0 
      ? flattenCategoriesForDropdown(nestedCategories)
      : flattenCategoriesForDropdown(categories);
      
    console.log("AddItemView: Processed categories for dropdown:", result.length);
    // Log a few categories as a sample
    if (result.length > 0) {
      console.log("Category samples:", 
        result.slice(0, 3).map(c => `${c.name} (depth: ${c.depth}, parent: ${c.isParent ? 'yes' : 'no'})`));
    }
    
    return result;
  }, [nestedCategories, categories]);

  // Inside the component, create a custom dropdown component
  const CustomSelect = ({ label, icon, options, value, onChange, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState(null);
    const dropdownRef = useRef(null);
    
    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    // Find current selected option name
    const selectedOption = options.find(opt => opt.id.toString() === value?.toString());
    
    // Determine if this is a category or material dropdown based on options structure
    const isCategoryDropdown = options.length > 0 && 'depth' in options[0];
    
    return (
      <div className="group">
        <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
          {icon}
          <span>{label} {required && '*'}</span>
        </label>
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border cursor-pointer flex justify-between items-center transition-all duration-300 ${
              isOpen 
                ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                : 'border-[#3d3dbd]/30 hover:border-[#ffd700]/40'
            } shadow-inner`}
          >
            <span className={!selectedOption ? "text-gray-400" : ""}>
              {selectedOption ? 
                (isCategoryDropdown ? (selectedOption.displayName || selectedOption.name) : selectedOption.name) : 
                placeholder
              }
            </span>
            <ArrowRight size={16} className={`transform transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#ffd700]' : 'text-gray-400'}`} />
          </div>
          
          {/* Dropdown panel */}
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-md bg-[#0a0a23]/95 border border-[#3d3dbd]/40 shadow-lg backdrop-blur-xl scrollbar-thin scrollbar-thumb-[#3d3dbd] scrollbar-track-[#11112a]"
            >
              {isCategoryDropdown ? (
                // Category dropdown rendering with icons and hierarchy
                options.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ 
                      backgroundColor: option.id.toString() === value?.toString() 
                        ? 'rgba(61, 61, 189, 0.5)' 
                        : 'rgba(26, 26, 58, 1)',
                      x: 2
                    }}
                    className={`px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                      option.id.toString() === value?.toString() 
                        ? 'bg-[#3d3dbd]/40 text-[#ffd700]' 
                        : hovered === option.id 
                          ? 'bg-[#1a1a3a] text-white' 
                          : 'text-gray-200 hover:bg-[#1a1a3a] hover:text-white'
                    }`}
                    style={{
                      paddingLeft: `${option.depth * 16 + 16}px`,
                      borderLeft: option.depth > 0 ? `2px solid rgba(61, 61, 189, ${0.1 + option.depth * 0.15})` : 'none'
                    }}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHovered(option.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="flex items-center">
                      {/* Show appropriate icon based on depth and if it's a parent category */}
                      {option.depth === 0 ? (
                        <Folder size={14} className="mr-2 text-[#ffd700]/70" />
                      ) : option.isParent ? (
                        <FolderPlus size={14} className="mr-2 text-[#3d3dbd]/70" />
                      ) : (
                        <ChevronRight size={14} className="mr-2 text-gray-500" />
                      )}
                      
                      <span className={`${option.depth > 0 ? 'text-sm' : 'font-medium'}`}>
                        {option.name}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Material dropdown with stylish elements
                options.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ 
                      backgroundColor: 'rgba(26, 26, 58, 1)',
                      x: 2
                    }}
                    className={`px-4 py-2.5 cursor-pointer transition-all duration-200 ${
                      option.id.toString() === value?.toString() 
                        ? 'bg-[#3d3dbd]/40 text-[#ffd700]' 
                        : hovered === option.id 
                          ? 'bg-[#1a1a3a] text-white' 
                          : 'text-gray-200 hover:bg-[#1a1a3a] hover:text-white'
                    }`}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHovered(option.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-3 h-3 rounded-full mr-2 ${
                          option.id.toString() === value?.toString() ? 'bg-[#ffd700]' : 'bg-[#3d3dbd]/50'
                        }`}
                      ></div>
                      
                      <span className="font-medium">{option.name}</span>
                      
                      {/* Generate a material color indicator based on the name */}
                      <div 
                        className="ml-auto w-4 h-4 rounded-full" 
                        style={{
                          background: getMaterialColor(option.name),
                          boxShadow: option.id.toString() === value?.toString() ? '0 0 5px rgba(255, 215, 0, 0.5)' : 'none'
                        }}
                      ></div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
          
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${isOpen ? 'w-[80%]' : ''}`}></div>
        </div>
      </div>
    );
  };
  
  // Helper function to generate consistent material colors
  const getMaterialColor = (materialName) => {
    const materialColors = {
      'Gold': '#FFD700',
      'Silver': '#C0C0C0',
      'Platinum': '#E5E4E2',
      'Rose Gold': '#B76E79',
      'White Gold': '#F5F5F5',
      'Yellow Gold': '#EFC050',
      'Tungsten': '#4D4E53',
      'Titanium': '#878681',
      'Steel': '#71797E',
      'Brass': '#B5A642',
      'Bronze': '#CD7F32',
      'Copper': '#B87333',
      'Rhodium': '#E2E3E5',
      'Palladium': '#CED0DD',
    };
    
    // Use predefined color if available, otherwise generate from string
    if (materialColors[materialName]) {
      return materialColors[materialName];
    }
    
    // Generate color from string
    let hash = 0;
    for (let i = 0; i < materialName.length; i++) {
      hash = materialName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const color = `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
    return color;
  };

  // Fetch user preferences on mount
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

  return (
    <div className="max-w-5xl mx-auto relative overflow-hidden">
      {/* Background sparkles */}
      <div className="absolute inset-0 overflow-hidden opacity-50 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <Sparkle 
            key={i}
            delay={Math.random() * 5}
            duration={2 + Math.random() * 4}
            size={1 + Math.random() * 3}
            left={`${Math.random() * 100}%`}
            top={`${Math.random() * 100}%`}
          />
        ))}
      </div>
      
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.h2 
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#ffaa00] inline-flex items-center"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <motion.span 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="mr-2"
            >
              <Diamond size={28} className="text-[#ffd700] inline-block" />
            </motion.span>
            {editItem ? 'Edit Luxury Jewelry Item' : 'Add New Luxury Jewelry Item'}
            <motion.span 
              initial={{ rotate: 10, scale: 0.8 }}
              animate={{ rotate: -5, scale: 1.1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="ml-2"
            >
              <Sparkles size={24} className="text-[#ffd700] inline-block" />
            </motion.span>
          </motion.h2>
          <div className="h-1 w-40 bg-gradient-to-r from-transparent via-[#ffd700]/50 to-transparent rounded-full mx-auto mt-2" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Upload Section */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:col-span-1"
          >
            <div className="bg-gradient-to-br from-[#11112a]/90 to-[#1a1a3a]/80 backdrop-blur-lg rounded-xl border border-[#3d3dbd]/20 p-6 shadow-lg hover:shadow-[0_0_25px_rgba(61,61,189,0.15)] transition-all duration-500">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <div className="w-8 h-8 flex items-center justify-center bg-[#ffd700]/10 rounded-lg mr-3">
                  <Camera className="text-[#ffd700]" size={18} />
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#cccccc]">Product Showcase</span>
              </h3>

              {/* Drag and drop zone */}
              <motion.div
                onClick={() => fileInputRef.current.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ 
                  boxShadow: isDragging 
                    ? [
                        "0 0 0 2px rgba(255,215,0,0.3)",
                        "0 0 0 4px rgba(255,215,0,0.2)",
                        "0 0 0 2px rgba(255,215,0,0.3)"
                      ] 
                    : "0 0 0 1px rgba(61,61,189,0.2)"
                }}
                transition={{ 
                  duration: isDragging ? 1.5 : 0.2, 
                  repeat: isDragging ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className={`
                  h-64 rounded-xl 
                  ${isDragging 
                    ? 'border-2 border-[#ffd700] bg-[#ffd700]/10' 
                    : 'border border-[#3d3dbd]/40 hover:border-[#ffd700]/60 bg-[#0a0a23]/50'
                  }
                  transition-all duration-200 flex flex-col items-center justify-center cursor-pointer
                  relative overflow-hidden group
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {!imagePreview ? (
                  <div className="text-center p-6 relative z-10">
                    <motion.div
                      animate={{ 
                        y: [0, -5, 0],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                      className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-[#3d3dbd]/20 to-[#3d3dbd]/5 group-hover:from-[#ffd700]/20 group-hover:to-[#ffd700]/5 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-[#3d3dbd] group-hover:text-[#ffd700] transition-colors" strokeWidth={1.5} />
                    </motion.div>
                    <p className="text-sm font-medium text-white group-hover:text-[#ffd700]/90 transition-colors">Drag & drop or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF formats</p>
                    <div className="mt-4 h-px w-16 bg-gradient-to-r from-transparent via-[#3d3dbd]/30 to-transparent mx-auto"></div>
                    <p className="text-xs text-gray-400 mt-4 max-w-xs">High-resolution images showcase your jewelry's craftsmanship and details</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {isUploading ? (
                      <motion.div 
                        key="uploading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center h-full w-full"
                      >
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-2 border-[#3d3dbd] border-t-[#ffd700] rounded-full"
                        />
                        <p className="mt-3 text-sm text-[#ffd700]">Processing image...</p>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full h-full"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-contain z-10"
                          />
                          
                          {/* Fancy background gradient for the image */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#000]/50 via-transparent to-[#000]/50 z-0"></div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedImage();
                          }}
                          className="absolute top-2 right-2 bg-[#ef5350]/80 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-[#ef5350] shadow-lg z-20"
                        >
                          <X size={16} />
                        </motion.button>
                        
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a23]/90 to-transparent py-3 px-4 text-white z-20"
                        >
                          <div className="flex items-center">
                            <Check className="text-green-400 mr-2" size={16} />
                            <p className="text-sm truncate">{selectedFile?.name}</p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
                
                {/* Background color effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3d3dbd]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
              </motion.div>

              {/* Alternative URL entry */}
              <div className="mt-6 backdrop-blur-sm">
                <label className="block text-xs text-gray-400 mb-2 flex items-center">
                  <span className="mr-2">Or use an external image URL</span>
                  <div className="h-px flex-grow bg-gradient-to-r from-[#3d3dbd]/20 to-transparent"></div>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={editItem ? editItem.image_url || '' : newItem.image_url || ''}
                    onChange={(e) => editItem 
                      ? setEditItem({ ...editItem, image_url: e.target.value })
                      : setNewItem({ ...newItem, image_url: e.target.value })
                    }
                    onFocus={() => setActiveField('image_url')}
                    onBlur={() => setActiveField(null)}
                    className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                      activeField === 'image_url' 
                        ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                        : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                    } text-sm outline-none`}
                  />
                  <Image size={16} className="absolute right-3 top-3.5 text-gray-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Fields */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-gradient-to-br from-[#11112a]/90 to-[#1a1a3a]/80 backdrop-blur-lg rounded-xl border border-[#3d3dbd]/20 p-6 shadow-lg hover:shadow-[0_0_25px_rgba(61,61,189,0.15)] transition-all duration-500">
              <form onSubmit={editItem ? handleUpdateItem : handleAddItem} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="group">
                    <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                      <Gem size={14} className="mr-2 text-[#ffd700]/70" /> 
                      <span>Unique ID *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="SKU-001"
                        value={editItem ? editItem.unique_id : newItem.unique_id}
                        onChange={(e) => editItem 
                          ? setEditItem({ ...editItem, unique_id: e.target.value })
                          : setNewItem({ ...newItem, unique_id: e.target.value })
                        }
                        onFocus={() => setActiveField('unique_id')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                          activeField === 'unique_id' 
                            ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                            : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                        } shadow-inner outline-none`}
                        required
                      />
                      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'unique_id' ? 'w-[80%]' : ''}`}></div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                      <Diamond size={14} className="mr-2 text-[#ffd700]/70" /> 
                      <span>Item Name *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Diamond Pendant"
                        value={editItem ? editItem.name : newItem.name}
                        onChange={(e) => editItem 
                          ? setEditItem({ ...editItem, name: e.target.value })
                          : setNewItem({ ...newItem, name: e.target.value })
                        }
                        onFocus={() => setActiveField('name')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                          activeField === 'name' 
                            ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                            : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                        } shadow-inner outline-none`}
                        required
                      />
                      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'name' ? 'w-[80%]' : ''}`}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <CustomSelect
                    label="Category"
                    icon={<Sparkles size={14} className="mr-2 text-[#ffd700]/70" />}
                    options={flatCategoriesForDropdown}
                    value={editItem ? editItem.category_id : newItem.category_id}
                    onChange={(value) => editItem 
                      ? setEditItem({ ...editItem, category_id: value })
                      : setNewItem({ ...newItem, category_id: value })
                    }
                    placeholder="Select Category"
                    required={true}
                  />
                  <CustomSelect
                    label="Material"
                    icon={<Gem size={14} className="mr-2 text-[#ffd700]/70" />}
                    options={materials.map(mat => ({ id: mat.id, name: mat.name }))}
                    value={editItem ? editItem.material_id : newItem.material_id}
                    onChange={(value) => editItem 
                      ? setEditItem({ ...editItem, material_id: value })
                      : setNewItem({ ...newItem, material_id: value })
                    }
                    placeholder="Select Material"
                    required={true}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Conditionally render price input based on user preference */}
                  {userPreferences.price_at_add_item && (
                    <div className="group">
                      <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                        <span className="mr-2 text-[#ffd700]/70" style={{ fontSize: '14px' }}>₹</span>
                        <span>Price (INR) *</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 pointer-events-none group-hover:text-[#ffd700]/70 transition-colors">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="299.99"
                          value={editItem ? editItem.price : newItem.price}
                          onChange={(e) => editItem 
                            ? setEditItem({ ...editItem, price: e.target.value })
                            : setNewItem({ ...newItem, price: e.target.value })
                          }
                          onFocus={() => setActiveField('price')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full pl-8 pr-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                            activeField === 'price' 
                              ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                              : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                          } shadow-inner outline-none`}
                          required
                        />
                        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'price' ? 'w-[80%]' : ''}`}></div>
                      </div>
                    </div>
                  )}
                  {/* Conditionally render weight input based on user preference */}
                  {userPreferences.show_weight_input && (
                    <div className="group">
                      <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                        <Weight size={14} className="mr-2 text-[#ffd700]/70" /> 
                        <span>Weight (g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="10.5"
                          value={editItem ? editItem.weight || '' : newItem.weight || ''}
                          onChange={(e) => editItem 
                            ? setEditItem({ ...editItem, weight: e.target.value })
                            : setNewItem({ ...newItem, weight: e.target.value })
                          }
                          onFocus={() => setActiveField('weight')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                            activeField === 'weight' 
                              ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                              : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                          } shadow-inner outline-none`}
                        />
                        <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'weight' ? 'w-[80%]' : ''}`}></div>
                      </div>
                    </div>
                  )}
                  <div className="group">
                    <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                      <Package size={14} className="mr-2 text-[#ffd700]/70" /> 
                      <span>Stock Quantity *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="10"
                        value={editItem ? editItem.stock : newItem.stock}
                        onChange={(e) => editItem 
                          ? setEditItem({ ...editItem, stock: e.target.value })
                          : setNewItem({ ...newItem, stock: e.target.value })
                        }
                        onFocus={() => setActiveField('stock')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                          activeField === 'stock' 
                            ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                            : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                        } shadow-inner outline-none`}
                        required
                      />
                      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'stock' ? 'w-[80%]' : ''}`}></div>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm text-gray-300 mb-2 flex items-center group-hover:text-[#ffd700]/90 transition-colors">
                    <FileText size={14} className="mr-2 text-[#ffd700]/70" /> 
                    <span>Description</span>
                  </label>
                  <div className="relative">
                    <textarea
                      placeholder="Enter a detailed description of the jewelry item..."
                      value={editItem ? editItem.description || '' : newItem.description || ''}
                      onChange={(e) => editItem 
                        ? setEditItem({ ...editItem, description: e.target.value })
                        : setNewItem({ ...newItem, description: e.target.value })
                      }
                      onFocus={() => setActiveField('description')}
                      onBlur={() => setActiveField(null)}
                      rows="4"
                      className={`w-full px-4 py-3 rounded-lg bg-[#0a0a23]/60 text-white border transition-all duration-300 ${
                        activeField === 'description' 
                          ? 'border-[#ffd700] shadow-[0_0_8px_rgba(255,215,0,0.3)]' 
                          : 'border-[#3d3dbd]/30 focus:border-[#3d3dbd]'
                      } shadow-inner outline-none resize-none`}
                    />
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700]/70 to-transparent w-0 group-hover:w-[80%] transition-all duration-500 ${activeField === 'description' ? 'w-[80%]' : ''}`}></div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-[#3d3dbd]/20">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255,215,0,0.5)" }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-[#ffd700] to-[#ffaa00] text-[#0a0a2f] font-bold rounded-lg shadow-lg hover:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all"
                    >
                      {editItem ? 'Update Luxury Item' : 'Add Luxury Item'}
                    </motion.button>
                    
                    {editItem && (
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(42, 42, 74, 0.9)' }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setEditItem(null);
                          setSelectedFile(null);
                          setImagePreview(null);
                        }}
                        className="w-full md:w-auto px-6 py-3.5 bg-[#1a1a3a] text-white font-medium rounded-lg transition-all"
                      >
                        Cancel
                      </motion.button>
                    )}
                    
                    <div className="md:ml-auto flex items-center">
                      <div className="text-xs text-[#ffd700] mr-1.5">*</div>
                      <p className="text-xs text-gray-400">
                        Required fields
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AddItemView;
