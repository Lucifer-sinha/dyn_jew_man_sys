import { useTheme } from '../contexts/ThemeContext';

/**
 * Custom hook to apply theme styles to components
 * @returns {Object} Theme utility functions and properties
 */
export function useAppTheme() {
  const {
    theme,
    setTheme,
    themeData,
    enableAnimations,
    setEnableAnimations,
    darkMode,
    setDarkMode
  } = useTheme();

  /**
   * Generate styles for an element based on the current theme
   * @param {string} variant - 'primary', 'secondary', 'accent', or 'custom'
   * @param {Object} customStyles - Additional styles to apply
   * @returns {Object} Style object
   */
  const getThemeStyles = (variant = 'primary', customStyles = {}) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: themeData.color,
          color: themeData.textColor,
          transition: enableAnimations ? 'all 0.3s ease' : 'none',
          ...customStyles
        };
      case 'secondary':
        return {
          backgroundColor: themeData.secondaryColor,
          color: themeData.textColor,
          transition: enableAnimations ? 'all 0.3s ease' : 'none',
          ...customStyles
        };
      case 'accent':
        return {
          backgroundColor: themeData.accentColor,
          color: themeData.textColor,
          transition: enableAnimations ? 'all 0.3s ease' : 'none',
          ...customStyles
        };
      case 'text':
        return {
          color: themeData.textColor,
          transition: enableAnimations ? 'color 0.3s ease' : 'none',
          ...customStyles
        };
      case 'accentText':
        return {
          color: themeData.accentColor,
          transition: enableAnimations ? 'color 0.3s ease' : 'none',
          ...customStyles
        };
      case 'custom':
      default:
        return {
          transition: enableAnimations ? 'all 0.3s ease' : 'none',
          ...customStyles
        };
    }
  };

  /**
   * Get CSS class names for themed elements
   * @param {string} variant - 'primary', 'secondary', 'accent', 'button', etc.
   * @param {string} additionalClasses - Additional CSS classes to apply
   * @returns {string} CSS class names
   */
  const getThemeClasses = (variant = 'primary', additionalClasses = '') => {
    const baseClass = `themed-${variant}`;
    return additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;
  };

  /**
   * Dynamically apply theme styles to an element
   * For use with CSS-in-JS or inline styles
   */
  const themeStyle = {
    primary: themeData.color,
    secondary: themeData.secondaryColor,
    accent: themeData.accentColor,
    text: themeData.textColor,
    glow: `0 0 15px ${themeData.accentColor}40`,
    transitionSpeed: enableAnimations ? '0.3s' : '0s',
  };

  return {
    theme,
    setTheme,
    themeData,
    darkMode,
    setDarkMode,
    enableAnimations,
    setEnableAnimations,
    themeStyle,
    getThemeStyles,
    getThemeClasses,
  };
} 