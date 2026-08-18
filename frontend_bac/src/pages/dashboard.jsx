import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import RoyalHeader from './RoyalHeader';
import LiveView from './LiveView';
import AddItemView from './AddItemView';
import DetailsView from './DetailsView';
import HistoryView from './HistoryView';
import CartView from './CartView';
import CategoryTree from './CategoryTree';
import StatisticsView from './StatisticsView';
import SettingsView from './SettingsView';
import LiveBackground from '../components/LiveBackground';
import { useWallpaper } from '../contexts/WallpaperContext';
import { authenticatedFetch } from '../utils/auth';

const socket = io("http://127.0.0.1:5000");

// Helper for currency formatting - change $ to ₹
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

function Dashboard() {
  // Basic states
  const [activeView, setActiveView] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  
  // Data states
  const [jewelryItems, setJewelryItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nestedCategories, setNestedCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  // Metal prices
  const [goldPrice, setGoldPrice] = useState(null);
  const [silverPrice, setSilverPrice] = useState(null);

  // For Add/Edit item
  const [newItem, setNewItem] = useState({
    unique_id: "",
    name: "",
    category_id: "",
    material_id: "",
    price: "",
    weight: "",
    stock: "",
    description: "",
    image_url: ""
  });
  const [editItem, setEditItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // For placing orders
  const [orderDetails, setOrderDetails] = useState({
    customer_name: "",
    customer_contact: "",
    payment_method: "",
    making_charges: ""
  });

  // Item details
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Sorting
  const [sortOption, setSortOption] = useState("");

  // Top-level category filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [topLevelCategories, setTopLevelCategories] = useState([]);

  // Debug mode
  const [debugInfo, setDebugInfo] = useState({
    apiCalls: [],
    categoryData: null,
    filterAttempts: 0,
    errors: []
  });

  // Add this new code to use the wallpaper context
  const { wallpaperData, enableInteractivity, showGradient } = useWallpaper();

  // Socket listeners
  useEffect(() => {
    socket.on("update_items", (updatedItems) => setJewelryItems(updatedItems));
    socket.on("update_cart", (updatedCart) => setCart(updatedCart));
    return () => {
      socket.off("update_items");
      socket.off("update_cart");
    };
  }, []);

  // Backend fetch functions
  const fetchItems = (sortKey = "") => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Fetching all items with sort key:`, sortKey);
    
    setDebugInfo(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, { endpoint: '/get_items', sortKey, time: timestamp }]
    }));
    
    let url = "http://127.0.0.1:5000/get_items";
    if (sortKey) {
      let apiSortParam = sortKey;
      if (sortKey === "price-asc") apiSortParam = "price_asc";
      if (sortKey === "price-desc") apiSortParam = "price_desc";
      url += `?sort=${apiSortParam}`;
    }
    
    console.log(`[${timestamp}] Fetching from URL:`, url);
    
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch items: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`[${timestamp}] ✓ Received ${data.length} items`);
        
        // Log categories of items for debugging
        const categoriesInItems = [...new Set(data.map(item => item.category_id))];
        console.log(`Categories in items: ${categoriesInItems.join(', ')}`);
        
        if (Array.isArray(data)) {
          setJewelryItems(data);
        } else {
          console.error(`[${timestamp}] ✗ Received non-array data:`, data);
          setJewelryItems([]);
        }
      })
      .catch(err => {
        console.error(`[${timestamp}] ✗ Error fetching items:`, err);
        setJewelryItems([]);
        
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, { type: 'FETCH_ITEMS', message: err.message, time: timestamp }]
        }));
      });
  };

  const searchItems = (query) => {
    if (!query.trim()) {
      fetchItems(sortOption);
      return;
    }
    fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setJewelryItems(data))
      .catch(err => console.error("Error searching items:", err));
  };

  // Fetch all categories on component mount
  useEffect(() => {
    fetchCategories();
    fetchMaterials();
  }, []);

  // Explicitly fetch categories function
  const fetchCategories = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Fetching categories...`);
    
    setDebugInfo(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, { endpoint: '/get_category_tree', time: timestamp }]
    }));
    
    fetch("http://127.0.0.1:5000/get_category_tree")
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`[${timestamp}] ✓ Categories fetched:`, data.length, "items");
        
        // Store the original nested category tree for components that need hierarchy (like AddItemView)
        const originalCategoryTree = [...data];
        
        // Extract all categories from the tree, including nested subcategories
        const extractAllCategories = (categoryTree) => {
          let result = [];
          
          const processCategory = (category) => {
            const { subcategories, ...categoryWithoutSubcategories } = category;
            result.push(categoryWithoutSubcategories);
            
            // Process children
            if (subcategories && subcategories.length > 0) {
              subcategories.forEach(subcategory => {
                processCategory(subcategory);
              });
            }
          };
          
          // Process each top-level category
          categoryTree.forEach(category => {
            processCategory(category);
          });
          
          return result;
        };
        
        // Get all categories in a flattened array
        const allCategories = extractAllCategories(data);
        
        // Log each category for debugging
        allCategories.forEach(cat => {
          console.log(`Category: ID=${cat.id}, Name=${cat.name}, Parent=${cat.parent_id || 'None'}`);
        });
        
        // Store full category data (flattened)
        setCategories(allCategories);
        
        // Also store original tree structure in a new state variable
        setNestedCategories(originalCategoryTree);
        
        // Filter top-level only (no parent_id)
        const topLevels = allCategories.filter(cat => !cat.parent_id && cat.visibility);
        console.log(`[${timestamp}] Found ${topLevels.length} top-level categories:`, 
          topLevels.map(c => `${c.name}(${c.id})`).join(', '));
        
        setTopLevelCategories(topLevels);
        
        // Save to debug info
        setDebugInfo(prev => ({
          ...prev, 
          categoryData: {
            all: allCategories,
            topLevel: topLevels,
            nestedTree: originalCategoryTree
          }
        }));
      })
      .catch(err => {
        console.error(`[${timestamp}] ✗ Error fetching categories:`, err);
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, { type: 'FETCH_CATEGORIES', message: err.message, time: timestamp }]
        }));
      });
  };

  const fetchMaterials = () => {
    fetch("http://127.0.0.1:5000/get_materials")
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error("Error fetching materials:", err));
  };

  const fetchOrderHistory = () => {
    console.log("[fetchOrderHistory] Calling authenticatedFetch for order history..."); // Debug log
    authenticatedFetch('/get_order_history')
      .then(data => {
        console.log("[fetchOrderHistory] Received data:", data); // Debug log
        if (Array.isArray(data)) {
          setOrderHistory(data);
          console.log(`[fetchOrderHistory] Successfully set ${data.length} orders.`); // Debug log
        } else {
          console.error("[fetchOrderHistory] Received non-array data:", data); // Debug log
          setOrderHistory([]); // Ensure orderHistory is always an array
          // Optionally set an error state here to display a message to the user
        }
      })
      .catch(err => {
        console.error("[fetchOrderHistory] Error fetching order history:", err);
        setOrderHistory([]); // Clear orders on error
        // Handle error, maybe set an error state to display a message
      });
  };

  const fetchMetalPrices = () => {
    fetch("http://127.0.0.1:5000/get_metal_prices")
      .then(res => res.json())
      .then(data => {
        setGoldPrice(data.Gold);
        setSilverPrice(data.Silver);
      })
      .catch(err => console.error("Error fetching metal prices:", err));
  };

  useEffect(() => {
    fetchItems();
    fetchMetalPrices();
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      fetchOrderHistory();
    }
  }, [activeView]);

  useEffect(() => {
    searchItems(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (sortOption) {
      fetchItems(sortOption);
    }
  }, [sortOption]);

  // Filter items based on selected category
  useEffect(() => {
    const timestamp = new Date().toISOString();
    
    if (selectedCategoryId) {
      console.log(`[${timestamp}] 🔍 Filtering by category ID:`, selectedCategoryId);
      
      setDebugInfo(prev => ({
        ...prev,
        filterAttempts: prev.filterAttempts + 1,
        apiCalls: [...prev.apiCalls, { 
          endpoint: '/get_items_by_category', 
          categoryId: selectedCategoryId, 
          time: timestamp 
        }]
      }));
      
      const categoryIdParam = Number(selectedCategoryId);
      const apiUrl = `http://127.0.0.1:5000/get_items_by_category?category_id=${categoryIdParam}`;
      
      console.log(`[${timestamp}] API call to:`, apiUrl);
      
      fetch(apiUrl)
        .then(res => {
          if (!res.ok) {
            console.error(`[${timestamp}] API returned ${res.status} ${res.statusText}`);
            throw new Error(`API error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log(`[${timestamp}] ✓ Found ${data.length} items for category ${categoryIdParam}`);
          
          // If no items from the API directly, we'll try fetching all items and filtering client-side
          if (data.length === 0) {
            console.log(`[${timestamp}] ⚠️ No items returned from API, trying client-side filtering...`);
            throw new Error("No items found from API");
          }
          
          // Log first few items for debugging
          if (data.length > 0) {
            console.log("Sample items:", data.slice(0, 3).map(i => `${i.name} (${i.category_id})`));
          }
          
          setJewelryItems(data);
        })
        .catch(err => {
          console.error(`[${timestamp}] ✗ Error filtering items:`, err);
          
          setDebugInfo(prev => ({
            ...prev,
            errors: [...prev.errors, { 
              type: 'FILTER_ITEMS', 
              message: err.message, 
              categoryId: selectedCategoryId,
              time: timestamp 
            }]
          }));
          
          // Fallback: Fetch all and filter client-side
          console.log(`[${timestamp}] ⚠️ Using fallback: client-side filtering...`);
          fetch("http://127.0.0.1:5000/get_items")
            .then(res => res.json())
            .then(allItems => {
              console.log(`[${timestamp}] Received ${allItems.length} items for client-side filtering`);
              
              // Define all subcategories 
              const getChildCategories = (parentId) => {
                // Ensure parentId is a number for comparison
                const parentIdNum = Number(parentId);
                const result = [parentIdNum];
                
                // Find all direct children
                categories.forEach(cat => {
                  if (cat.parent_id && Number(cat.parent_id) === parentIdNum) {
                    // Add child
                    result.push(Number(cat.id));
                    // Add all grandchildren recursively
                    const grandchildren = getChildCategories(Number(cat.id));
                    result.push(...grandchildren);
                  }
                });
                
                return [...new Set(result)]; // Remove duplicates
              };
              
              // Get all subcategory IDs including the parent
              const allCategoryIds = getChildCategories(categoryIdParam);
              console.log(`[${timestamp}] ⚙️ Including categories:`, allCategoryIds);
              
              // Filter items that match any category in the list
              const filtered = allItems.filter(item => {
                const itemCategoryId = Number(item.category_id);
                return allCategoryIds.includes(itemCategoryId);
              });
              
              console.log(`[${timestamp}] ✓ Filtered to ${filtered.length} items`);
              setJewelryItems(filtered);
            })
            .catch(clientErr => {
              console.error(`[${timestamp}] ✗ Client-side filtering failed:`, clientErr);
              // On complete failure, show all items
              fetchItems(sortOption);
            });
        });
    } else {
      console.log(`[${timestamp}] 🔍 No category selected, fetching all items`);
      fetchItems(sortOption);
    }
  }, [selectedCategoryId]);

  // Login/Logout handlers
  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role || "customer");
    setActiveView("live");
  };

  const handleLogout = () => {
    fetch("http://127.0.0.1:5000/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(() => {
        setIsLoggedIn(false);
        setUserRole("");
        setActiveView("live");
      })
      .catch(err => console.error("Logout error:", err));
  };

  // If not logged in, force the Login view
  if (!isLoggedIn && activeView !== 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  if (activeView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // CRUD / Image Upload functions
  const uploadImageIfSelected = async (unique_id) => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('unique_id', unique_id);
    formData.append('image', selectedFile);
    try {
      const res = await fetch('http://127.0.0.1:5000/upload_image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log('Image upload:', data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        category_id: parseInt(newItem.category_id),
        material_id: parseInt(newItem.material_id),
      };

      const res = await fetch("http://127.0.0.1:5000/add_item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Item added:", data);

      if (res.ok && data.message?.includes("Item added")) {
        if (selectedFile) {
          await uploadImageIfSelected(newItem.unique_id);
        }

        setNewItem({
          unique_id: "",
          name: "",
          category_id: "",
          material_id: "",
          price: "",
          weight: "",
          stock: "",
          description: "",
          image_url: ""
        });
        setSelectedFile(null);
        fetchItems(sortOption); // Refresh items
      } else {
        alert(data.error || "Failed to add item");
      }

    } catch (error) {
      console.error("Error adding item:", error);
      alert("Something went wrong while adding item.");
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:5000/update_item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });
      const data = await res.json();
      console.log("Item updated:", data);
      if (data.message === 'Item updated successfully') {
        await uploadImageIfSelected(editItem.unique_id);
      }
      setEditItem(null);
      setSelectedFile(null);
      setActiveView('live');
      fetchItems(sortOption);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = (id) => {
    fetch(`http://127.0.0.1:5000/delete_item?id=${id}`, { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        console.log("Item deleted:", data);
        setActiveView('live');
        fetchItems(sortOption);
      })
      .catch(err => console.error("Error deleting item:", err));
  };

  // Cart functions
  const addToCart = (itemId) => {
    fetch("http://127.0.0.1:5000/add_to_cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, quantity: 1 }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Add to cart failed:", errorData);
        } else {
          const data = await res.json();
          console.log("Add to Cart:", data);
        }
      })
      .catch(err => console.error("Error adding to cart:", err));
  };

  const removeFromCart = (itemId) => {
    fetch("http://127.0.0.1:5000/remove_from_cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          console.error("Remove from cart failed:", errorData);
        } else {
          const data = await res.json();
          console.log("Remove from Cart:", data);
        }
      })
      .catch(err => console.error("Error removing from cart:", err));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    fetch("http://127.0.0.1:5000/place_order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderDetails,
        making_charges: parseFloat(orderDetails.making_charges)
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "bill.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setCart([]);
          setOrderDetails({
            customer_name: "",
            customer_contact: "",
            payment_method: "",
            making_charges: ""
          });
        } else {
          const errorData = await res.json();
          console.error("Order failed:", errorData);
        }
      })
      .catch(err => console.error("Error placing order:", err));
  };

  // Item details functions
  const handleItemClick = (item) => {
    // Fetch complete item details including category path
    fetch(`http://127.0.0.1:5000/get_item/${item.id}`)
      .then(res => res.json())
      .then(data => {
        console.log("Item details:", data);
        setSelectedItem(data);
        setActiveView('details');
      })
      .catch(err => {
        console.error("Error fetching item details:", err);
        // Fallback to basic item data if API fails
        setSelectedItem(item);
        setActiveView('details');
      });
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setSelectedFile(null);
    setActiveView('add');
  };

  // Handle category click in details view
  const handleCategoryClick = (categoryIdOrName) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Category clicked: ${categoryIdOrName} (type: ${typeof categoryIdOrName})`);
    
    let categoryIdToUse = null;
    
    // If it's already a number, use it directly
    if (typeof categoryIdOrName === 'number') {
      categoryIdToUse = categoryIdOrName;
      console.log(`[${timestamp}] Using numeric category ID directly: ${categoryIdToUse}`);
    }
    // If it's a numeric string, convert to number
    else if (typeof categoryIdOrName === 'string' && !isNaN(Number(categoryIdOrName))) {
      categoryIdToUse = Number(categoryIdOrName);
      console.log(`[${timestamp}] Converted string to numeric ID: ${categoryIdToUse}`);
    }
    // If it's a string (category name), find the corresponding ID by case-insensitive matching
    else if (typeof categoryIdOrName === 'string') {
      console.log(`[${timestamp}] Looking up category by name: "${categoryIdOrName}"`);
      
      // First try exact case-insensitive matching
      const exactMatch = categories.find(
        c => c.name && c.name.toLowerCase() === categoryIdOrName.toLowerCase()
      );
      
      if (exactMatch) {
        console.log(`[${timestamp}] ✓ Found exact category match: ${exactMatch.name} (ID: ${exactMatch.id})`);
        categoryIdToUse = Number(exactMatch.id);
      } else {
        // If exact match fails, try partial matching (in case the name has whitespace/formatting differences)
        console.log(`[${timestamp}] No exact match found, trying partial match...`);
        const partialMatch = categories.find(
          c => c.name && categoryIdOrName.toLowerCase().includes(c.name.toLowerCase())
        );
        
        if (partialMatch) {
          console.log(`[${timestamp}] ✓ Found partial category match: ${partialMatch.name} (ID: ${partialMatch.id})`);
          categoryIdToUse = Number(partialMatch.id);
        } else {
          console.warn(`[${timestamp}] ✗ No category found with name: ${categoryIdOrName}`);
        }
      }
    }
    
    // Verify the category exists in our data
    if (categoryIdToUse !== null) {
      console.log(`[${timestamp}] Validating category ID: ${categoryIdToUse}`);
      
      // First check in the categories array
      const categoryExists = categories.some(cat => Number(cat.id) === Number(categoryIdToUse));
      
      if (!categoryExists) {
        console.warn(`[${timestamp}] ⚠️ Category ID ${categoryIdToUse} not found directly in categories data`);
        
        // Check if any item has this category ID - if so, we can still use it
        const itemWithCategory = jewelryItems.find(item => 
          Number(item.category_id) === Number(categoryIdToUse)
        );
        
        if (itemWithCategory) {
          console.log(`[${timestamp}] ✓ Found item "${itemWithCategory.name}" with category ID ${categoryIdToUse}, proceeding anyway`);
          // Continue with the category even though it's not in our categories array
        } else {
          console.warn(`[${timestamp}] ✗ Category ID ${categoryIdToUse} not found in data or items, setting to null`);
          categoryIdToUse = null;
          
          // DEBUG: Log all available categories to help diagnose
          console.log("Available categories:", categories.map(c => ({id: c.id, name: c.name})));
          console.log("Item categories:", [...new Set(jewelryItems.map(i => i.category_id))]);
        }
      } else {
        // Log which category was selected
        const selectedCategory = categories.find(c => Number(c.id) === Number(categoryIdToUse));
        console.log(`[${timestamp}] ✓ Selected category: ${selectedCategory.name} (ID: ${categoryIdToUse})`);
      }
    }
    
    console.log(`[${timestamp}] Setting selectedCategoryId to: ${categoryIdToUse}`);
    setSelectedCategoryId(categoryIdToUse);
    
    // Ensure we navigate to the LiveView to see filtered results
    if (activeView !== 'live') {
      console.log(`[${timestamp}] Changing view from ${activeView} to 'live'`);
      setActiveView('live');
    } else {
      // If already in live view, we need to trigger a re-fetch to ensure filtering works
      console.log(`[${timestamp}] Already in live view, refreshing items with selected category`);
      
      // Force a refresh by fetching items again
      if (categoryIdToUse) {
        const apiUrl = `http://127.0.0.1:5000/get_items_by_category?category_id=${categoryIdToUse}`;
        console.log(`[${timestamp}] Re-fetching from: ${apiUrl}`);
        
        fetch(apiUrl)
          .then(res => res.json())
          .then(data => {
            console.log(`[${timestamp}] ✓ Fetched ${data.length} items for category ${categoryIdToUse}`);
            setJewelryItems(data);
          })
          .catch(err => {
            console.error(`[${timestamp}] ✗ Error fetching items for category:`, err);
            fetchItems(sortOption);
          });
      } else {
        // No category selected, fetch all items
        fetchItems(sortOption);
      }
    }
  };

  // --- Animated Background Bubbles ---
  const FloatingBubbles = () => {
    return (
      <div className="fixed inset-0 z-[0] overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            initial={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              scale: Math.random() * 0.5 + 1,
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              repeat: Infinity,
              ease: "linear",
              repeatType: "reverse",
            }}
            style={{
              background: `radial-gradient(circle, 
                ${['#ff00e6', '#00ffff', '#ffd700', '#ff6b6b'][Math.floor(Math.random() * 4)]} 0%, 
                transparent 70%)`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              filter: 'blur(8px)',
            }}
          />
        ))}
      </div>
    );
  };

  // --- Top-level Category Chips Component ---
  const TopCategoryChips = () => {
    return (
      <motion.div 
        className="px-4 py-3 bg-black/20 backdrop-blur-md flex gap-3 overflow-x-auto hide-scrollbar rounded-xl shadow-lg mb-6 border border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCategoryId(null)}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
            selectedCategoryId === null
              ? 'bg-gradient-to-r from-[#ffd700] to-[#ffaa00] text-[#0a0a2f] shadow-[0_0_12px_rgba(255,215,0,0.7)]'
              : 'bg-[#1e1e45]/40 border border-[#ffd700]/50 text-[#ffd700] hover:shadow-[0_0_8px_rgba(255,215,0,0.4)]'
          }`}
        >
          All
        </motion.button>
        {topLevelCategories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
              selectedCategoryId === cat.id
                ? 'bg-gradient-to-r from-[#ffd700] to-[#ffaa00] text-[#0a0a2f] shadow-[0_0_12px_rgba(255,215,0,0.7)]'
                : 'bg-[#1e1e45]/40 border border-[#ffd700]/50 text-[#ffd700] hover:shadow-[0_0_8px_rgba(255,215,0,0.4)]'
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
        {selectedCategoryId && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategoryId(null)}
            className="text-xs text-blue-400/90 ml-2 self-center hover:text-blue-300 transition-colors"
          >
            Clear Filter
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-[#ffd700] font-[Cinzel] flex flex-col relative overflow-hidden">
      {/* LiveBackground as the first element with fixed positioning */}
      <LiveBackground 
        backgroundColor={wallpaperData.backgroundColor} 
        particleColor={wallpaperData.particleColor}
        particleEffect={wallpaperData.particleEffect}
        particleDensity={wallpaperData.particleDensity}
        enableInteractivity={enableInteractivity}
        showGradient={showGradient}
      />
      
      {/* Decorative FloatingBubbles with transparency */}
      <div className="fixed inset-0 z-[0] overflow-hidden pointer-events-none">
        <FloatingBubbles />
      </div>
      
      {/* Pattern overlay with higher transparency */}
      <div className="fixed inset-0 z-[1] bg-[url('/images/luxury-pattern.png')] opacity-3 bg-repeat pointer-events-none"></div>
      
      {/* Glassmorphism overlay for content area */}
      <div className="fixed inset-0 z-[2] pointer-events-none bg-black/10 backdrop-blur-[1px]"></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <RoyalHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeView={activeView}
          setActiveView={setActiveView}
          sortOption={sortOption}
          setSortOption={setSortOption}
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          handleLogout={handleLogout}
          jewelryItems={jewelryItems}
          orderHistory={orderHistory}
          goldPrice={goldPrice}
          silverPrice={silverPrice}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {activeView === 'live' && (
              <motion.div
                key="live-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LiveView
                  goldPrice={goldPrice}
                  silverPrice={silverPrice}
                  items={jewelryItems}
                  addToCart={addToCart}
                  onItemClick={handleItemClick}
                  categories={categories}
                  topLevelCategories={topLevelCategories}
                  selectedCategoryId={selectedCategoryId}
                  setSelectedCategoryId={setSelectedCategoryId}
                />
              </motion.div>
            )}
            
            {activeView === 'add' && (
              <motion.div
                key="add-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {isLoggedIn ? (
                  <AddItemView
                    newItem={newItem}
                    setNewItem={setNewItem}
                    handleAddItem={handleAddItem}
                    categories={categories}
                    nestedCategories={nestedCategories}
                    materials={materials}
                    editItem={editItem}
                    setEditItem={setEditItem}
                    handleUpdateItem={handleUpdateItem}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                  />
                ) : (
                  <motion.p 
                    className="text-red-400 bg-red-900/20 p-4 rounded-lg backdrop-blur-sm"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Please login to add items.
                  </motion.p>
                )}
              </motion.div>
            )}
            
            {activeView === 'history' && (
              <motion.div
                key="history-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <HistoryView orderHistory={orderHistory} />
              </motion.div>
            )}
            
            {activeView === 'cart' && (
              <motion.div
                key="cart-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <CartView
                  cart={cart}
                  removeFromCart={removeFromCart}
                  handlePlaceOrder={handlePlaceOrder}
                  orderDetails={orderDetails}
                  setOrderDetails={setOrderDetails}
                />
              </motion.div>
            )}
            
            {activeView === 'details' && selectedItem && (
              <motion.div
                key="details-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DetailsView
                  item={selectedItem}
                  onEditClick={handleEditClick}
                  onDeleteClick={
                    userRole === 'admin'
                      ? handleDeleteItem
                      : () => alert("Only admin can delete items.")
                  }
                  onCategoryClick={handleCategoryClick}
                />
              </motion.div>
            )}
            
            {activeView === 'categories' && (
              <motion.div
                key="categories-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="py-4"
              >
                <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#ffd700] to-[#ff9d00] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">
                  Manage Categories
                </h2>
                <div className="bg-black/30 backdrop-blur-lg p-6 rounded-xl border border-white/10 shadow-lg">
                  <CategoryTree />
                </div>
              </motion.div>
            )}
            
            {activeView === 'statistics' && (
              <motion.div
                key="statistics-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <StatisticsView 
                  orderHistory={orderHistory}
                  jewelryItems={jewelryItems}
                  categories={categories}
                />
              </motion.div>
            )}
            
            {activeView === 'settings' && (
              <motion.div
                key="settings-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;