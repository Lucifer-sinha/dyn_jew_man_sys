// src/pages/CategoryTree.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GripVertical, 
  PlusSquare, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  X,
  Home,
  Folder,
  FolderPlus,
  FolderX,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
  Copy,
  MoveHorizontal,
  MoveVertical,
  Eye as EyeIcon
} from "lucide-react";

// Custom drop animation
const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

// SortableItem component with enhanced features
const SortableItem = ({ 
  id, 
  name, 
  level, 
  visibility,
  onDelete, 
  onAddSub, 
  onEdit,
  onToggleVisibility,
  hasChildren,
  isExpanded,
  onToggleExpand,
  isFiltered,
  isDuplicating,
  usageCount,
  isOverDroppable,
  onCopyCategory,
  path,
  onViewDetails
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    over,
  } = useSortable({ 
    id, 
    data: { id, name, level, path },
    disabled: isDuplicating
  });

  // Enhanced styling with dynamic effects
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : (isFiltered ? 20 : 1),
    position: 'relative',
  };

  // Hover states for interactive elements
  const [isHovered, setIsHovered] = useState(false);
  
  // Animate when item is a potential drop target
  const isDropTarget = isOverDroppable && !isDragging;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -10 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isDragging ? 1.02 : isDropTarget ? 1.01 : 1,
        boxShadow: isDragging 
          ? "0 10px 25px rgba(0,0,0,0.3)" 
          : isDropTarget 
            ? "0 0 15px rgba(61,61,189,0.3)" 
            : "none",
      }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className={`mb-2 ${isDragging ? 'z-50' : ''} ${isFiltered ? 'ring-2 ring-[#ffd700] ring-opacity-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Path breadcrumb - shown when hovered */}
      {path && isHovered && path.length > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-6 left-0 right-0 text-xs text-gray-200 bg-[#0a0a23]/90 p-1.5 rounded-t-md overflow-hidden whitespace-nowrap shadow-md z-10 border border-[#3d3dbd]/20 backdrop-blur-sm"
        >
          {path.slice(0, -1).map((segment, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <ChevronRight size={12} className="mx-1 text-gray-400" />}
              <span className="text-gray-300">{segment}</span>
            </span>
          ))}
        </motion.div>
      )}
      
      <div 
        className={`
          flex items-center justify-between p-3 
          rounded-lg 
          ${isDragging 
            ? 'bg-gradient-to-r from-[#ffaa00] to-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.5)]' 
            : isDropTarget 
              ? 'bg-gradient-to-r from-[#3d3dbd]/20 to-[#3d3dbd]/10 border-[#3d3dbd] animate-pulse' 
              : `bg-[#11112a]/90 ${isHovered ? 'bg-[#1e1e45]/90' : ''}`
          } 
          border ${visibility 
            ? isFiltered 
              ? 'border-[#ffd700]' 
              : 'border-[#ffd700]/30' 
            : 'border-[#666]/30'
          } 
          backdrop-blur-sm shadow-md 
          transition-all duration-200
          ${!visibility ? 'opacity-70' : ''}
          ${isDragging ? 'cursor-grabbing' : ''}
        `}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <div 
            {...attributes} 
            {...listeners} 
            className={`
              cursor-grab text-gray-400 hover:text-[#ffd700] p-1.5 rounded-md 
              ${isHovered ? 'bg-[#1a1a3a]/80' : ''}
              ${isDuplicating ? 'opacity-50 cursor-not-allowed' : ''}
              group
            `}
            title="Drag to reorder or nest"
          >
            <GripVertical size={18} strokeWidth={1.5} className="transition-transform group-hover:scale-110" />
          </div>
          
          {hasChildren ? (
            <button
              onClick={onToggleExpand}
              className={`
                text-[#ffd700] hover:text-[#ffaa00] p-1.5 rounded-md transition-colors
                ${isHovered ? 'bg-[#ffd700]/10' : ''}
              `}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? 
                <ChevronDown size={18} strokeWidth={1.5} /> : 
                <ChevronRight size={18} strokeWidth={1.5} />
              }
            </button>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center text-[#666]">
              <Folder size={16} strokeWidth={1.5} />
            </div>
          )}
          
          <div className="flex items-center min-w-0 flex-grow">
            <span className={`
              font-medium text-sm truncate transition-colors
              ${visibility ? 'text-white' : 'text-gray-400'}
              ${isDropTarget ? 'text-[#3d3dbd]' : ''}
            `}>
              {name}
            </span>
            
            {/* Display category usage count with improved styling */}
            {typeof usageCount === 'number' && (
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className={`
                  ml-2 px-1.5 py-0.5 text-[10px] rounded-full 
                  ${usageCount > 0 
                    ? 'bg-[#3d3dbd]/20 text-[#00ccff]' 
                    : 'bg-gray-700/20 text-gray-400'
                  }
                `} 
                title={`${usageCount} item${usageCount !== 1 ? 's' : ''} using this category`}
              >
                {usageCount}
              </motion.span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Enhanced visibility toggle with better visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleVisibility}
            className={`
              p-1.5 rounded-md transition-all
              ${visibility 
                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700/30'
              }
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title={visibility ? "Hide Category" : "Show Category"}
          >
            {visibility ? <Eye size={16} /> : <EyeOff size={16} />}
          </motion.button>
          
          {/* Copy/duplicate category with improved visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCopyCategory}
            className={`
              p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 rounded-md transition-all
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title="Duplicate Category"
          >
            <Copy size={16} />
          </motion.button>
          
          {/* Add subcategory with improved visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddSub}
            className={`
              p-1.5 text-[#ffd700] hover:text-[#ffaa00] hover:bg-[#ffd700]/10 rounded-md transition-all
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title="Add Subcategory"
          >
            <FolderPlus size={16} />
          </motion.button>
          
          {/* Edit category with improved visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className={`
              p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-md transition-all
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title="Edit Category"
          >
            <Edit size={16} />
          </motion.button>
          
          {/* View category details with improved visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onViewDetails}
            className={`
              p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/30 rounded-md transition-all
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title="View Category Details"
          >
            <Info size={16} />
          </motion.button>
          
          {/* Delete category with improved visual feedback */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className={`
              p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-md transition-all
              ${isHovered ? 'opacity-100' : 'opacity-80'}
            `}
            title="Delete Category"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Custom dropzone for "Make top-level" area with enhanced visuals and functionality
const TopLevelDropzone = ({ isOver, itemCount, totalCategoryCount }) => {
  const { setNodeRef } = useDroppable({
    id: 'root',
  });

  return (
    <motion.div
      ref={setNodeRef}
      className={`
        mb-6 p-6 relative overflow-hidden rounded-xl border-2 border-dashed
        ${isOver 
          ? 'border-[#ffd700] bg-[#ffd700]/10' 
          : 'border-[#3d3dbd]/50 hover:border-[#3d3dbd]/80'
        } 
        text-${isOver ? '[#ffd700]' : '[#3d3dbd]'}
        transition-all duration-300
        min-h-[120px] cursor-pointer
      `}
      whileHover={{ scale: 1.01 }}
      animate={{ 
        backgroundColor: isOver ? 'rgba(255, 215, 0, 0.1)' : 'rgba(61, 61, 189, 0.05)',
        borderColor: isOver ? 'rgba(255, 215, 0, 0.8)' : 'rgba(61, 61, 189, 0.3)'
      }}
    >
      {/* Animated background effect when something is being dragged over */}
      {isOver && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/0 via-[#ffd700]/10 to-[#ffd700]/0"
          animate={{ 
            x: ['-100%', '100%'],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5,
            ease: "linear"
          }}
        />
      )}
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
        <div className={`
          p-4 rounded-full 
          ${isOver 
            ? 'bg-[#ffd700]/20 text-[#ffd700]' 
            : 'bg-[#3d3dbd]/10 text-[#3d3dbd]'
          }
          transition-colors duration-300
        `}>
          <Home size={28} strokeWidth={1.5} />
        </div>
        
        <div className="flex flex-col items-center sm:items-start">
          <span className={`
            font-bold text-xl text-center sm:text-left transition-colors duration-300
            ${isOver ? 'text-[#ffd700]' : 'text-[#3d3dbd]'}
          `}>
            Drop here to make Top-Level Category
          </span>
          
          <p className="text-gray-400 text-sm mt-1 text-center sm:text-left">
            Drag and drop any category here to move it to the top level
          </p>
          
          {itemCount > 0 && (
            <div className="flex items-center text-sm mt-3 gap-3">
              <div className="flex items-center bg-[#3d3dbd]/10 px-3 py-1 rounded-full">
                <span className="font-bold text-[#3d3dbd]">{itemCount}</span>
                <span className="text-gray-400 ml-1">top-level</span>
              </div>
              
              <div className="flex items-center bg-[#00ccff]/10 px-3 py-1 rounded-full">
                <span className="font-bold text-[#00ccff]">{totalCategoryCount || itemCount}</span>
                <span className="text-gray-400 ml-1">total</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Visual elements - decorative dots */}
      <div className="absolute top-3 right-3 flex space-x-1">
        <div className={`w-2 h-2 rounded-full ${isOver ? 'bg-[#ffd700]/40' : 'bg-[#3d3dbd]/40'}`}></div>
        <div className={`w-2 h-2 rounded-full ${isOver ? 'bg-[#ffd700]/60' : 'bg-[#3d3dbd]/60'}`}></div>
        <div className={`w-2 h-2 rounded-full ${isOver ? 'bg-[#ffd700]/80' : 'bg-[#3d3dbd]/80'}`}></div>
      </div>
    </motion.div>
  );
};

// Analytics card for category stats
const CategoryStatsCard = ({ title, value, icon: Icon, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#11112a]/80 backdrop-blur-sm rounded-lg p-3 border border-[#1a1a3a]"
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}/10 mr-3`}>
          <Icon className={`text-${color} h-5 w-5`} />
        </div>
        <div>
          <p className="text-xs text-gray-400">{title}</p>
          <p className="text-lg font-medium text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function CategoryTreeManager() {
  // State variables
  const [categories, setCategories] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addTargetParentId, setAddTargetParentId] = useState(null);
  const [editCategory, setEditCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [activeDroppableId, setActiveDroppableId] = useState(null);
  const [isOverRoot, setIsOverRoot] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [sortOrder, setSortOrder] = useState('name_asc'); // name_asc, name_desc, items_asc, items_desc
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [duplicatingCategory, setDuplicatingCategory] = useState(null);
  const [categoryUsageCounts, setCategoryUsageCounts] = useState({});
  const [notification, setNotification] = useState(null);
  
  // Refs
  const lastSavedStateRef = useRef(categories);
  const saveTimeoutRef = useRef(null);

  // Configure DnD sensors with increased performance and interaction options
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduce from 5 to 3 for more responsive dragging
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => {
        const STEP = 10;
        const { active, context } = args;
        const { x, y } = context.active.rect.current;

        if (event.key === 'ArrowDown') return { x, y: y + STEP };
        if (event.key === 'ArrowUp') return { x, y: y - STEP };
        if (event.key === 'ArrowLeft') return { x: x - STEP, y };
        if (event.key === 'ArrowRight') return { x: x + STEP, y };
        return undefined;
      },
    })
  );

  // Enhanced statistics calculations
  const stats = useMemo(() => {
    return {
      totalCategories: categories.reduce((count, cat) => {
        // Recursive counter function
        const countCats = (category) => {
          let total = 1; // Count this category
          if (category.subcategories?.length) {
            return total + category.subcategories.reduce((sum, sub) => sum + countCats(sub), 0);
          }
          return total;
        };
        return count + countCats(cat);
      }, 0),
      topLevelCount: categories.length,
      maxDepth: categories.reduce((maxDepth, cat) => {
        const getDepth = (category, currentDepth = 1) => {
          if (!category.subcategories?.length) return currentDepth;
          return Math.max(...category.subcategories.map(sub => getDepth(sub, currentDepth + 1)));
        };
        return Math.max(maxDepth, getDepth(cat));
      }, 0),
      visibleCategories: categories.reduce((count, cat) => {
        const countVisible = (category) => {
          let total = category.visibility ? 1 : 0;
          if (category.subcategories?.length) {
            return total + category.subcategories.reduce((sum, sub) => sum + countVisible(sub), 0);
          }
          return total;
        };
        return count + countVisible(cat);
      }, 0),
    };
  }, [categories]);

  // Fetch all categories from API with enhanced error handling
  const fetchCategories = useCallback(() => {
    setIsSaving(true);
    fetch("http://127.0.0.1:5000/get_category_tree")
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then((data) => {
        setCategories(data);
        setFilteredCategories(data);
        lastSavedStateRef.current = data;
      })
      .catch(err => {
        console.error("Error fetching categories:", err);
        // Could add toast notification here
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 300);
      });
  }, []);
  
  // Fetch category usage data - how many items use each category
  const fetchCategoryUsage = useCallback(() => {
    fetch("http://127.0.0.1:5000/get_items")
      .then(res => res.json())
      .then(items => {
        // Count occurrences of each category_id
        const counts = {};
        items.forEach(item => {
          if (item.category_id) {
            counts[item.category_id] = (counts[item.category_id] || 0) + 1;
          }
        });
        setCategoryUsageCounts(counts);
      })
      .catch(err => console.error("Error fetching category usage data:", err));
  }, []);

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchCategoryUsage();
    
    // Auto-expand categories with search matches
    if (searchTerm) {
      // Logic to auto-expand relevant categories will be added here
    }
  }, [fetchCategories, fetchCategoryUsage, searchTerm]);
  
  // Debounced search with path highlighting
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredCategories(categories);
        return;
      }
      
      // Get all matching category paths
      const matchingPaths = [];
      
      // Recursive search function that builds full paths
      const findMatchingPaths = (cats, currentPath = []) => {
        cats.forEach(cat => {
          const newPath = [...currentPath, cat];
          
          if (cat.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchingPaths.push(newPath);
          }
          
          if (cat.subcategories?.length) {
            findMatchingPaths(cat.subcategories, newPath);
          }
        });
      };
      
      findMatchingPaths(categories);
      
      // Create a set of all category IDs that should be shown
      const categoriesToShow = new Set();
      matchingPaths.forEach(path => {
        // Add all categories in the path
        path.forEach(cat => {
          categoriesToShow.add(cat.id);
          
          // Auto-expand parent categories to show matches
          if (cat.subcategories?.length) {
            setExpandedCategories(prev => 
              prev.includes(cat.id) ? prev : [...prev, cat.id]
            );
          }
        });
      });
      
      // Clone and filter the category tree to only show matching paths
      const filterTree = (cats) => {
        return cats
          .filter(cat => categoriesToShow.has(cat.id))
          .map(cat => {
            const newCat = {...cat};
            if (cat.subcategories?.length) {
              newCat.subcategories = filterTree(cat.subcategories);
            }
            return newCat;
          });
      };
      
      setFilteredCategories(filterTree(categories));
    }, 300);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [searchTerm, categories]);
  
  // Sort categories based on current sort order
  useEffect(() => {
    const sortCategories = (cats) => {
      return [...cats].sort((a, b) => {
        switch (sortOrder) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'items_asc':
            return (categoryUsageCounts[a.id] || 0) - (categoryUsageCounts[b.id] || 0);
          case 'items_desc':
            return (categoryUsageCounts[b.id] || 0) - (categoryUsageCounts[a.id] || 0);
          default:
            return 0;
        }
      }).map(cat => {
        if (cat.subcategories?.length) {
          return {...cat, subcategories: sortCategories(cat.subcategories)};
        }
        return cat;
      });
    };
    
    setFilteredCategories(sortCategories(filteredCategories));
  }, [sortOrder, categoryUsageCounts]);
  
  // Enhanced drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedItem(active.data.current);
    setIsDragging(true);
    
    // Auto-expand categories when dragging over them (if they have children)
    document.body.classList.add('is-dragging');
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // Skip if no active or over element
    if (!active || !over) {
      setIsOverRoot(false);
      setActiveDroppableId(null);
      return;
    }
    
    // Check if we're over the root dropzone
    if (over.id === 'root') {
      setIsOverRoot(true);
      setActiveDroppableId(null);
      console.log('Over root dropzone'); // Debug log
      return;
    } 
    
    // We're over another category
    setIsOverRoot(false);
    
    // Check if we're trying to drag into a descendant (to prevent invalid nesting)
    const draggedId = active.id;
    const overId = over.id;
    
    // Don't allow dropping onto a descendant of the dragged item
    // This function checks if overId is a descendant of draggedId
    const isDescendant = (parentId, childId) => {
      const findInTree = (cats, targetId, currentPath = []) => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            return [...currentPath, cat.id];
          }
          if (cat.subcategories?.length) {
            const found = findInTree(cat.subcategories, targetId, [...currentPath, cat.id]);
            if (found.length) return found;
          }
        }
        return [];
      };
      
      // Get all descendants of draggedId
      const findAllDescendants = (catId) => {
        const descendants = [];
        
        const traverse = (categoryId) => {
          // Find the category in the tree
          const findCategory = (cats) => {
            for (const cat of cats) {
              if (cat.id === categoryId) {
                return cat;
              }
              if (cat.subcategories?.length) {
                const found = findCategory(cat.subcategories);
                if (found) return found;
              }
            }
            return null;
          };
          
          const category = findCategory(categories);
          if (!category) return;
          
          // Add all subcategories and their children
          if (category.subcategories?.length) {
            category.subcategories.forEach(sub => {
              descendants.push(sub.id);
              traverse(sub.id);
            });
          }
        };
        
        traverse(catId);
        return descendants;
      };
      
      const descendants = findAllDescendants(parentId);
      return descendants.includes(childId);
    };
    
    // Block invalid drops visually
    if (isDescendant(draggedId, overId)) {
      // This is an invalid drop target, don't highlight it
      setActiveDroppableId(null);
      return;
    }
    
    // Valid drop target
    setActiveDroppableId(overId);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setDraggedItem(null);
    setIsDragging(false);
    setIsOverRoot(false);
    setActiveDroppableId(null);
    document.body.classList.remove('is-dragging');
    
    if (!over || active.id === over.id) return;

    const draggedId = active.id;
    const overId = over.id;
    
    console.log(`Drag end: from ${draggedId} to ${overId}`); // Debug log
    
    // Check if we're dropping onto the root
    if (overId === "root") {
      console.log('Moving category to top level'); // Debug log
      // Move to top level
      setIsSaving(true);
    fetch(`http://127.0.0.1:5000/category/${draggedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: null })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to update category');
          return res.json();
        })
        .then(() => {
          fetchCategories();
          setNotification({
            type: 'success',
            message: 'Category moved to top level'
          });
          setTimeout(() => setNotification(null), 3000);
        })
        .catch(err => {
          console.error("Error updating category:", err);
          setNotification({
            type: 'error',
            message: 'Failed to move category'
          });
          setTimeout(() => setNotification(null), 3000);
        })
        .finally(() => {
          setTimeout(() => setIsSaving(false), 500);
        });
      return;
    }
    
    // Helper function to get the flat array of all categories
    const flattenCategories = (cats, parentId = null, result = []) => {
      cats.forEach(cat => {
        result.push({...cat, parent_id: parentId});
        if (cat.subcategories?.length) {
          flattenCategories(cat.subcategories, cat.id, result);
        }
      });
      return result;
    };
    
    // Get flat array of all categories
    const allCategories = flattenCategories(categories);
    
    // Find the dragged category and target category
    const draggedCategory = allCategories.find(cat => cat.id === draggedId);
    const targetCategory = allCategories.find(cat => cat.id === overId);
    
    if (!draggedCategory || !targetCategory) return;
    
    // Check if this is a reordering within the same parent
    if (draggedCategory.parent_id === targetCategory.parent_id) {
      // This is a sort operation within the same parent
      console.log('Reordering within the same parent');
      
      // Find all siblings with the same parent
      const siblings = allCategories.filter(cat => 
        cat.parent_id === draggedCategory.parent_id
      );
      
      // Get the current order of categories
      const oldIndex = siblings.findIndex(cat => cat.id === draggedId);
      const newIndex = siblings.findIndex(cat => cat.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return;
      
      // Reorder the array
      const newOrder = arrayMove(siblings, oldIndex, newIndex);
      
      // Update sort_order for all affected categories
      setIsSaving(true);
      
      // Create array of promises for all updates
      const updatePromises = newOrder.map((cat, index) => 
        fetch(`http://127.0.0.1:5000/category/${cat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: index })
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to update sort order for category ${cat.id}`);
          return res.json();
        })
      );
      
      // Wait for all updates to complete
      Promise.all(updatePromises)
        .then(() => {
          fetchCategories();
          setNotification({
            type: 'success',
            message: 'Categories reordered successfully'
          });
          setTimeout(() => setNotification(null), 3000);
        })
        .catch(err => {
          console.error("Error updating category order:", err);
          setNotification({
            type: 'error',
            message: 'Failed to reorder categories'
          });
          setTimeout(() => setNotification(null), 3000);
        })
        .finally(() => {
          setTimeout(() => setIsSaving(false), 500);
        });
      
      return;
    }
    
    // Check for dropping onto a descendant
    const isDescendant = (parentId, childId) => {
      const findInTree = (cats, targetId, currentPath = []) => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            return [...currentPath, cat.id];
          }
          if (cat.subcategories?.length) {
            const found = findInTree(cat.subcategories, targetId, [...currentPath, cat.id]);
            if (found.length) return found;
          }
        }
        return [];
      };
      
      // Get all descendants of draggedId
      const findAllDescendants = (catId) => {
        const descendants = [];
        
        const traverse = (cats, targetId) => {
          for (const cat of cats) {
            if (cat.id === targetId) {
              if (cat.subcategories?.length) {
                cat.subcategories.forEach(sub => {
                  descendants.push(sub.id);
                  traverse(categories, sub.id);
                });
              }
              return;
            }
            if (cat.subcategories?.length) {
              traverse(cat.subcategories, targetId);
            }
          }
        };
        
        traverse(categories, catId);
        return descendants;
      };
      
      const descendants = findAllDescendants(parentId);
      return descendants.includes(childId);
    };
    
    if (isDescendant(draggedId, overId)) {
      // Show error notification
      setNotification({
        type: 'error',
        message: 'Cannot move a category into its own descendant'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    
    // Make the category a child of the target
    setIsSaving(true);
    fetch(`http://127.0.0.1:5000/category/${draggedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parent_id: overId })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
      })
      .then(() => {
        fetchCategories();
        // Auto-expand the target category
        if (!expandedCategories.includes(overId)) {
          setExpandedCategories(prev => [...prev, overId]);
        }
        setNotification({
          type: 'success',
          message: `Category moved successfully`
        });
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(err => {
        console.error("Error updating category:", err);
        setNotification({
          type: 'error',
          message: 'Failed to move category'
        });
        setTimeout(() => setNotification(null), 3000);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };
  
  const handleDragCancel = () => {
    setDraggedItem(null);
    setIsDragging(false);
    setIsOverRoot(false);
    setActiveDroppableId(null);
    document.body.classList.remove('is-dragging');
  };

  // Category management handlers with improved error handling
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    // If we're duplicating a category
    if (duplicatingCategory) {
      const payload = {
        name: newCategoryName,
        parent_id: addTargetParentId,
        sort_order: 0,
        visibility: duplicatingCategory.visibility
      };
      
      setIsSaving(true);
      
      fetch("http://127.0.0.1:5000/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add category');
          return res.json();
        })
        .then(() => {
          setNewCategoryName("");
          setAddTargetParentId(null);
          setDuplicatingCategory(null);
          fetchCategories();
        })
        .catch(err => {
          console.error("Error adding category:", err);
        })
        .finally(() => {
          setTimeout(() => setIsSaving(false), 500);
        });
      
      return;
    }
    
    // Regular category addition
    setIsSaving(true);
    
    fetch("http://127.0.0.1:5000/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCategoryName,
        parent_id: addTargetParentId,
        sort_order: 0,
        visibility: true
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add category');
        return res.json();
      })
      .then(() => {
        setNewCategoryName("");
        setAddTargetParentId(null);
        fetchCategories();
      })
      .catch(err => {
        console.error("Error adding category:", err);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };

  const handleEditSave = () => {
    if (!editCategory || !newCategoryName.trim()) return;
    
    setIsSaving(true);
    
    fetch(`http://127.0.0.1:5000/category/${editCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
      })
      .then(() => {
        setEditCategory(null);
        setNewCategoryName("");
        fetchCategories();
      })
      .catch(err => {
        console.error("Error updating category:", err);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this category and its subcategories?")) return;
    
    setIsSaving(true);
    
    fetch(`http://127.0.0.1:5000/category/${id}`, {
      method: "DELETE",
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete category');
        return res.json();
      })
      .then(() => {
        fetchCategories();
        fetchCategoryUsage();
      })
      .catch(err => {
        console.error("Error deleting category:", err);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };

  const handleToggleVisibility = (category) => {
    setIsSaving(true);
    
    fetch(`http://127.0.0.1:5000/category/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: !category.visibility })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update category visibility');
        return res.json();
      })
      .then(() => {
        fetchCategories();
      })
      .catch(err => {
        console.error("Error updating category visibility:", err);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };
  
  // New methods for enhanced functionality
  const handleDuplicateCategory = (category) => {
    setDuplicatingCategory(category);
    setNewCategoryName(`${category.name} (Copy)`);
    setAddTargetParentId(category.parent_id);
  };
  
  const handleViewCategoryDetails = (category) => {
    setSelectedCategory(category);
  };

  const toggleExpand = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };
  
  const expandAll = () => {
    // Recursive function to get all category IDs
    const getAllIds = (cats) => {
      let ids = [];
      cats.forEach(cat => {
        ids.push(cat.id);
        if (cat.subcategories?.length) {
          ids = [...ids, ...getAllIds(cat.subcategories)];
        }
      });
      return ids;
    };
    
    setExpandedCategories(getAllIds(categories));
  };
  
  const collapseAll = () => {
    setExpandedCategories([]);
  };

  // Utility to build full path for a category
  const getCategoryPath = useCallback((categoryId, categoriesData = categories) => {
    const path = [];
    
    const findPath = (cats, id, currentPath = []) => {
      for (const cat of cats) {
        const newPath = [...currentPath, cat.name];
        
        if (cat.id === id) {
          return [...newPath];
        }
        
        if (cat.subcategories?.length) {
          const result = findPath(cat.subcategories, id, newPath);
          if (result.length) return result;
        }
      }
      
      return [];
    };
    
    return findPath(categoriesData, categoryId);
  }, [categories]);

  // Enhanced visibility toggle with batch operations
  const toggleAllVisibility = (visible) => {
    // Confirm the action with the user
    if (!window.confirm(`Are you sure you want to ${visible ? 'show' : 'hide'} all categories?`)) {
      return;
    }
    
    setIsSaving(true);
    
    // Get all category IDs recursively
    const getAllCategoryIds = (cats) => {
      return cats.reduce((ids, cat) => {
        ids.push(cat.id);
        if (cat.subcategories?.length) {
          ids = [...ids, ...getAllCategoryIds(cat.subcategories)];
        }
        return ids;
      }, []);
    };
    
    const allIds = getAllCategoryIds(categories);
    
    // Create promises for all categories
    const updatePromises = allIds.map(id => 
      fetch(`http://127.0.0.1:5000/category/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: visible })
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to update visibility for category ${id}`);
        return res.json();
      })
    );
    
    // Execute all updates
    Promise.all(updatePromises)
      .then(() => {
        fetchCategories();
        setNotification({
          type: 'success',
          message: `All categories ${visible ? 'shown' : 'hidden'} successfully`
        });
        setTimeout(() => setNotification(null), 3000);
      })
      .catch(err => {
        console.error("Error updating category visibility:", err);
        setNotification({
          type: 'error',
          message: 'Failed to update category visibility'
        });
        setTimeout(() => setNotification(null), 3000);
      })
      .finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
  };

  // Recursive function to render category tree with enhanced features
  const renderTree = (nodes, level = 0, parentPath = []) => (
    <AnimatePresence mode="sync">
      {nodes.map((cat) => {
        const currentPath = [...parentPath, cat.name];
        const isFiltered = searchTerm && cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isOverDroppable = activeDroppableId === cat.id;
        
        return (
          <React.Fragment key={cat.id}>
          <SortableItem
            id={cat.id}
            name={cat.name}
            level={level}
              visibility={cat.visibility}
              hasChildren={cat.subcategories?.length > 0}
              isExpanded={expandedCategories.includes(cat.id)}
              onToggleExpand={() => toggleExpand(cat.id)}
            onDelete={() => handleDelete(cat.id)}
              onAddSub={() => {
                setEditCategory(null);
                setAddTargetParentId(cat.id);
                setNewCategoryName("");
                setDuplicatingCategory(null);
              }}
              onEdit={() => {
                setEditCategory(cat);
                setNewCategoryName(cat.name);
                setAddTargetParentId(null);
                setDuplicatingCategory(null);
              }}
              onToggleVisibility={() => handleToggleVisibility(cat)}
              isFiltered={isFiltered}
              isDuplicating={duplicatingCategory?.id === cat.id}
              usageCount={categoryUsageCounts[cat.id]}
              isOverDroppable={isOverDroppable}
              onCopyCategory={() => handleDuplicateCategory(cat)}
              path={currentPath}
              onViewDetails={() => handleViewCategoryDetails(cat)}
            />
            
            {/* Add subcategory form */}
            <AnimatePresence>
          {addTargetParentId === cat.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div 
                    className="ml-10 mb-3 p-3 bg-[#11112a]/90 rounded-lg border border-[#ffd700]/20"
                    style={{ marginLeft: `${(level * 24) + 24}px` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FolderPlus size={16} className="text-[#ffd700]" />
                      <span className="text-[#ffd700] text-sm font-medium">
                        {duplicatingCategory 
                          ? `Duplicate "${duplicatingCategory.name}" as child of: ${cat.name}`
                          : `Add to: ${cat.name}`}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Subcategory name"
                        className="flex-grow px-3 py-2 text-sm rounded bg-[#1e1e45] text-white border border-[#3d3dbd]/30 focus:border-[#3d3dbd] focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddCategory}
                          className="bg-gradient-to-r from-[#3d3dbd] to-[#00ccff] text-white px-3 py-2 rounded text-sm font-medium hover:from-[#4d4dcd] hover:to-[#33d6ff] transition flex items-center"
                        >
                          <Save size={14} className="mr-1" />
                          Add
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setNewCategoryName("");
                  setAddTargetParentId(null);
                            setDuplicatingCategory(null);
                }}
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-500 transition flex items-center"
              >
                          <X size={14} className="mr-1" />
                Cancel
                        </motion.button>
            </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Edit category form */}
            <AnimatePresence>
              {editCategory?.id === cat.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div 
                    className="mb-3 p-3 bg-[#11112a]/90 rounded-lg border border-[#3d3dbd]/20"
                    style={{ marginLeft: `${level * 24}px` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Edit size={16} className="text-blue-400" />
                      <span className="text-blue-400 text-sm font-medium">Edit Category</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-grow px-3 py-2 text-sm rounded bg-[#1e1e45] text-white border border-blue-500/30 focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleEditSave}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-500 transition flex items-center"
                        >
                          <Save size={14} className="mr-1" />
                          Update
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setEditCategory(null);
                            setNewCategoryName("");
                          }}
                          className="bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-500 transition flex items-center"
                        >
                          <X size={14} className="mr-1" />
                Cancel
                        </motion.button>
                      </div>
                    </div>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Render subcategories if expanded */}
            <AnimatePresence>
              {expandedCategories.includes(cat.id) && cat.subcategories?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  {renderTree(cat.subcategories, level + 1, currentPath)}
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        );
      })}
    </AnimatePresence>
  );

  return (
    <div className="p-8 bg-gradient-to-b from-[#0a0a2f]/90 to-[#0e1e3f]/80 text-white rounded-3xl shadow-2xl backdrop-blur-md border border-white/10 relative overflow-hidden">
      {/* Background embellishments */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#3d3dbd]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00ccff]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 z-0"></div>
      
      {/* Title section */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <motion.h2 
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-[#ffaa00] drop-shadow-sm tracking-tight flex items-center"
            animate={{ 
              backgroundPosition: isDragging ? ['0% 0%', '100% 0%'] : '0% 0%',
            }}
            transition={{ 
              duration: 2, 
              repeat: isDragging ? Infinity : 0,
              repeatType: "reverse" 
            }}
          >
            <Folder className="mr-2 h-8 w-8 text-[#ffd700]" />
            Enhanced Category Manager
          </motion.h2>
          
          {/* View mode and actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* New feature banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#3d3dbd]/20 to-[#00ccff]/20 
                        backdrop-blur-sm border border-[#3d3dbd]/30 rounded-lg mr-2 mb-2 w-full md:w-auto"
            >
              <span className="text-[#00ccff] font-medium">✨ New: Improved drag & drop!</span>
            </motion.div>

            {/* Search input */}
            <div className="relative w-full md:w-64">
        <input
          type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-4 py-2 rounded-lg bg-[#1a1a3a]/80 text-white border border-[#3d3dbd]/30 focus:border-[#3d3dbd] focus:outline-none pr-8"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                {searchTerm ? (
                  <X 
                    size={16} 
                    className="cursor-pointer hover:text-white transition-colors" 
                    onClick={() => setSearchTerm('')}
                  />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </span>
            </div>
            
            {/* Sort options */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#1a1a3a]/80 text-white border border-[#3d3dbd]/30 focus:border-[#3d3dbd] focus:outline-none text-sm"
            >
              <option value="name_asc">Sort: Name (A-Z)</option>
              <option value="name_desc">Sort: Name (Z-A)</option>
              <option value="items_asc">Sort: Usage (Low-High)</option>
              <option value="items_desc">Sort: Usage (High-Low)</option>
            </select>
            
            {/* View mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-[#3d3dbd]/30 bg-[#1a1a3a]/80">
        <button
                onClick={() => setViewMode('tree')} 
                className={`px-3 py-2 text-sm ${viewMode === 'tree' ? 'bg-[#3d3dbd] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <FolderPlus size={16} className="inline-block mr-1" />
                Tree
              </button>
              <button
                onClick={() => setViewMode('list')} 
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-[#3d3dbd] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <MoveVertical size={16} className="inline-block mr-1" />
                List
        </button>
            </div>
          </div>
      </div>

        {/* Saving indicator */}
        <AnimatePresence>
          {isSaving && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="fixed top-4 right-4 z-50 bg-[#0a0a2f]/90 backdrop-blur-md rounded-lg border border-[#3d3dbd]/30 p-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-[#3d3dbd] border-t-transparent rounded-full"></div>
                <span className="text-white text-sm">Saving changes...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <CategoryStatsCard 
            title="Total Categories" 
            value={stats.totalCategories} 
            icon={Folder} 
            color="[#ffd700]" 
          />
          <CategoryStatsCard 
            title="Top-Level Categories" 
            value={stats.topLevelCount} 
            icon={Home} 
            color="[#00ccff]" 
          />
          <CategoryStatsCard 
            title="Maximum Depth" 
            value={stats.maxDepth} 
            icon={MoveVertical} 
            color="[#3d3dbd]" 
          />
          <CategoryStatsCard 
            title="Visible Categories" 
            value={stats.visibleCategories} 
            icon={EyeIcon} 
            color="green-400" 
          />
        </div>
      </div>

      {/* DND Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          // Try different collision detection algorithms in priority order
          const rectIntersectionCollisions = rectIntersection(args);
          if (rectIntersectionCollisions.length > 0) {
            return rectIntersectionCollisions;
          }
          // Fall back to pointer within
          const pointerWithinCollisions = pointerWithin(args);
          if (pointerWithinCollisions.length > 0) {
            return pointerWithinCollisions;
          }
          // As a last resort, use closest center
          return closestCenter(args);
        }}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Root dropzone - now separate and enhanced */}
        <TopLevelDropzone 
          isOver={isOverRoot} 
          itemCount={stats.topLevelCount} 
          totalCategoryCount={stats.totalCategories}
        />
        
        {/* Top-level adder */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="flex-grow relative">
            <input
              type="text"
              value={!editCategory && !duplicatingCategory ? newCategoryName : ''}
              onChange={(e) => !editCategory && !duplicatingCategory && setNewCategoryName(e.target.value)}
              disabled={!!editCategory || !!duplicatingCategory}
              placeholder="New top-level category name"
              className="w-full px-4 py-3 rounded-lg bg-[#11112a] text-white border border-[#ffd700]/30 focus:border-[#ffd700] focus:outline-none shadow-inner"
            />
            {(editCategory || duplicatingCategory) && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#11112a]/95 rounded-lg border border-[#1a1a3a] text-gray-400">
                <span>{duplicatingCategory ? "Finish duplication" : "Finish current edit"} or cancel to add new category</span>
              </div>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !editCategory && !duplicatingCategory && handleAddCategory()}
            disabled={(!!editCategory || !!duplicatingCategory) || !newCategoryName.trim()}
            className={`px-6 py-3 rounded-lg text-[#0a0a2f] font-semibold flex items-center justify-center ${
              !editCategory && !duplicatingCategory && newCategoryName.trim()
                ? 'bg-gradient-to-r from-[#ffd700] to-[#ffaa00] hover:from-[#ffaa00] hover:to-[#ffd700] shadow-md'
                : 'bg-gray-500 cursor-not-allowed opacity-50'
            } transition-all duration-300`}
          >
            <PlusSquare size={18} className="mr-2" />
            Add Top-Level Category
          </motion.button>
        </div>

        {/* Category list area */}
        <div className="bg-[#0a0a23]/60 backdrop-blur-sm rounded-xl border border-[#1a1a3a] shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1a1a3a] flex items-center justify-between">
            <h3 className="text-xl font-medium text-white">Category Hierarchy</h3>
            <div className="flex items-center text-sm text-gray-400">
              <span className="mr-1">
                {filteredCategories.length === categories.length 
                  ? `${stats.totalCategories} categories` 
                  : `${filteredCategories.length} of ${stats.totalCategories} categories`}
              </span>
              <div className="flex ml-3">
                <button 
                  onClick={expandAll} 
                  className="px-2 py-1 text-xs rounded-l-md hover:bg-[#1a1a3a] text-gray-400 hover:text-white transition-colors"
                >
                  Expand All
                </button>
                <button 
                  onClick={collapseAll} 
                  className="px-2 py-1 text-xs rounded-r-md hover:bg-[#1a1a3a] text-gray-400 hover:text-white transition-colors border-l border-[#1a1a3a]"
                >
                  Collapse All
                </button>
              </div>
              
              {/* Add visibility controls */}
              <div className="flex ml-3 border-l border-[#1a1a3a] pl-3">
                <button 
                  onClick={() => toggleAllVisibility(true)} 
                  className="px-2 py-1 text-xs rounded-l-md hover:bg-[#1a1a3a] text-gray-400 hover:text-[#00ccff] transition-colors flex items-center gap-1"
                  title="Show all categories"
                >
                  <Eye size={12} />
                  Show All
                </button>
                <button 
                  onClick={() => toggleAllVisibility(false)} 
                  className="px-2 py-1 text-xs rounded-r-md hover:bg-[#1a1a3a] text-gray-400 hover:text-[#ef5350] transition-colors flex items-center gap-1 border-l border-[#1a1a3a]"
                  title="Hide all categories"
                >
                  <EyeOff size={12} />
                  Hide All
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-5 max-h-[500px] overflow-y-auto scrollbar-styled">
        <SortableContext
              items={categories.flatMap(cat => {
                // Recursive function to get all category IDs
                const getAllIds = (category) => {
                  let ids = [category.id];
                  if (category.subcategories?.length > 0) {
                    ids = [...ids, ...category.subcategories.flatMap(getAllIds)];
                  }
                  return ids;
                };
                return getAllIds(cat);
              })}
          strategy={verticalListSortingStrategy}
        >
              {filteredCategories.length > 0 ? (
                renderTree(filteredCategories)
              ) : (
                <div className="text-center py-8">
                  {searchTerm ? (
                    <div className="flex flex-col items-center text-gray-400">
                      <p>No categories matching "{searchTerm}"</p>
                      <button 
                        onClick={() => setSearchTerm('')} 
                        className="mt-2 text-[#00ccff] hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FolderX size={48} className="mb-2 text-gray-600" />
                      <p>No categories found</p>
                      <p className="text-sm">Create your first category to get started</p>
                    </div>
                  )}
                </div>
              )}
        </SortableContext>

            <DragOverlay dropAnimation={dropAnimation}>
          {draggedItem ? (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1.05 }}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-[#ffd700] to-[#ffaa00] 
                        text-[#0a0a2f] font-semibold shadow-xl border border-[#ffd700]/70 
                        flex items-center gap-2 z-50"
            >
              <Folder size={18} className="mr-1" />
              <span>{draggedItem.name}</span>
              <span className="text-xs bg-[#ffffff40] px-2 py-0.5 rounded-full">
                Dragging
              </span>
            </motion.div>
          ) : null}
        </DragOverlay>
          </div>
        </div>
        
        {/* Category details modal */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedCategory(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#11112a] rounded-xl border border-[#3d3dbd]/30 p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#ffd700]">Category Details</h3>
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Category Name</p>
                    <p className="text-white text-lg font-medium">{selectedCategory.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Category ID</p>
                    <p className="text-white mono">{selectedCategory.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Full Path</p>
                    <p className="text-white">
                      {getCategoryPath(selectedCategory.id).join(' → ')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Visibility</p>
                    <p className={`flex items-center ${selectedCategory.visibility ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCategory.visibility ? <Eye size={16} className="mr-1" /> : <EyeOff size={16} className="mr-1" />}
                      {selectedCategory.visibility ? 'Visible' : 'Hidden'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Items Using This Category</p>
                    <p className="text-white font-medium">
                      {categoryUsageCounts[selectedCategory.id] || 0} items
                    </p>
                  </div>
                  
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setEditCategory(selectedCategory);
                        setNewCategoryName(selectedCategory.name);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg flex items-center justify-center"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDuplicateCategory(selectedCategory);
                        setSelectedCategory(null);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg flex items-center justify-center"
                    >
                      <Copy size={16} className="mr-1" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        handleDelete(selectedCategory.id);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Instructions card */}
        <div className="mt-6 bg-[#0a0a23]/60 backdrop-blur-md rounded-xl border border-[#1a1a3a] p-4 shadow-lg">
          <h4 className="text-[#00ccff] font-medium mb-2 flex items-center">
            <CheckCircle size={16} className="mr-2" />
            Category Management Tips
          </h4>
          <ul className="text-sm text-gray-300 space-y-1.5">
            <li className="flex items-start">
              <span className="text-[#ffd700] mr-2">•</span> 
              <span>Drag and drop categories to rearrange the hierarchy</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ffd700] mr-2">•</span> 
              <span>Drop a category at the top to make it a root-level category</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ffd700] mr-2">•</span> 
              <span>Use the eye icon to show/hide categories from customers</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ffd700] mr-2">•</span> 
              <span>Click the folder icon to expand/collapse subcategories</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#ffd700] mr-2">•</span> 
              <span>Use the info button to view category details and usage</span>
            </li>
          </ul>
        </div>
      </DndContext>
      
      {/* Add custom scrollbar style */}
      <style jsx>{`
        .scrollbar-styled::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-styled::-webkit-scrollbar-track {
          background: rgba(26, 26, 58, 0.3);
          border-radius: 10px;
        }
        .scrollbar-styled::-webkit-scrollbar-thumb {
          background: rgba(61, 61, 189, 0.5);
          border-radius: 10px;
        }
        .scrollbar-styled::-webkit-scrollbar-thumb:hover {
          background: rgba(61, 61, 189, 0.7);
        }
        
        .is-dragging .scrollbar-styled {
          cursor: grabbing !important;
        }
      `}</style>

      {/* Notification component */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`
              fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg 
              backdrop-blur-md border z-50 flex items-center gap-2
              ${notification.type === 'error' 
                ? 'bg-red-900/80 border-red-500/50 text-white' 
                : 'bg-green-900/80 border-green-500/50 text-white'
              }
            `}
          >
            {notification.type === 'error' ? (
              <X size={18} className="text-red-300" />
            ) : (
              <CheckCircle size={18} className="text-green-300" />
            )}
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-3 p-1 hover:bg-white/10 rounded-full"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
