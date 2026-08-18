import React from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import { motion } from 'framer-motion';
import { 
  PaintBucket, 
  Check, 
  Palette, 
  CreditCard, 
  ShoppingBag, 
  User, 
  Settings, 
  Bell 
} from 'lucide-react';

const ThemeDemo = () => {
  const { 
    themeData, 
    theme,
    themeStyle, 
    getThemeClasses,
    getThemeStyles,
    enableAnimations
  } = useAppTheme();

  const buttonVariants = enableAnimations ? {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } }
  } : {};

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Theme Preview</h3>
        <span className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-sm">
          Current: {themeData.label}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Primary Card */}
        <div 
          className="rounded-lg overflow-hidden border border-white/10"
          style={getThemeStyles('primary')}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PaintBucket size={20} style={{ color: themeStyle.accent }} />
              <h4 className="font-medium">Primary Background</h4>
            </div>
            <p className="text-sm opacity-80">
              This card uses the primary theme color as its background.
            </p>
          </div>
          <div 
            className="p-4 border-t border-white/10"
            style={getThemeStyles('secondary')}
          >
            <button 
              className={getThemeClasses('button')}
              style={{ backgroundColor: themeStyle.accent }}
            >
              Primary Button
            </button>
          </div>
        </div>

        {/* Secondary Card */}
        <div 
          className="rounded-lg overflow-hidden border border-white/10"
          style={getThemeStyles('secondary')}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={20} style={{ color: themeStyle.accent }} />
              <h4 className="font-medium">Secondary Background</h4>
            </div>
            <p className="text-sm opacity-80">
              This card uses the secondary theme color for depth.
            </p>
          </div>
          <div 
            className="p-4 border-t border-white/10"
            style={getThemeStyles('primary')}
          >
            <div className="flex gap-2">
              <span 
                className="inline-block w-4 h-4 rounded-full" 
                style={{ backgroundColor: themeStyle.primary }}
              ></span>
              <span 
                className="inline-block w-4 h-4 rounded-full" 
                style={{ backgroundColor: themeStyle.secondary }}
              ></span>
              <span 
                className="inline-block w-4 h-4 rounded-full" 
                style={{ backgroundColor: themeStyle.accent }}
              ></span>
            </div>
          </div>
        </div>

        {/* Accent Card */}
        <div 
          className="rounded-lg overflow-hidden border border-white/10"
          style={getThemeStyles('accent')}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check size={20} style={{ color: themeStyle.text }} />
              <h4 className="font-medium">Accent Background</h4>
            </div>
            <p className="text-sm opacity-80">
              This card uses the accent color for emphasis.
            </p>
          </div>
          <div 
            className="p-4 border-t border-white/10 bg-black/20"
          >
            <div className="flex gap-2">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-2 rounded-lg bg-white/20" 
              >
                <Check size={16} />
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-2 rounded-lg bg-white/20" 
              >
                <Bell size={16} />
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="p-2 rounded-lg bg-white/20" 
              >
                <Settings size={16} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* UI Components Demo */}
      <div 
        className="rounded-lg p-6 border border-white/10"
        style={getThemeStyles('secondary')}
      >
        <h4 className="font-medium mb-4">UI Components</h4>
        
        <div className="space-y-6">
          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className={getThemeClasses('button')}
              style={{ backgroundColor: themeStyle.accent }}
            >
              Primary
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="px-4 py-2 rounded-lg bg-white/10 text-white"
            >
              Secondary
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="px-4 py-2 rounded-lg border border-white/20 text-white"
            >
              Outline
            </motion.button>
          </div>
          
          {/* Icons with theme colors */}
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
              <div 
                className="p-3 rounded-full" 
                style={{ backgroundColor: themeStyle.accent + '20' }}
              >
                <CreditCard size={24} style={{ color: themeStyle.accent }} />
              </div>
              <span className="text-xs text-gray-400">Payments</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div 
                className="p-3 rounded-full" 
                style={{ backgroundColor: themeStyle.accent + '20' }}
              >
                <ShoppingBag size={24} style={{ color: themeStyle.accent }} />
              </div>
              <span className="text-xs text-gray-400">Orders</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div 
                className="p-3 rounded-full" 
                style={{ backgroundColor: themeStyle.accent + '20' }}
              >
                <User size={24} style={{ color: themeStyle.accent }} />
              </div>
              <span className="text-xs text-gray-400">Profile</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Progress</span>
              <span className="text-white">75%</span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ 
                  width: '75%',
                  backgroundColor: themeStyle.accent,
                  transition: `width ${themeStyle.transitionSpeed} ease-in-out`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;