// src/components/LiveBackground.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import { motion, useReducedMotion } from "framer-motion";

function LiveBackground({ 
  backgroundColor = "#0a0a2f", 
  particleColor = "#ffd700",
  particleCount = 60,
  particleDensity = "medium",
  particleEffect = "default",
  enableInteractivity = true,
  showGradient = true,
  customSettings = {}
}) {
  // Use reduced motion preference
  const prefersReducedMotion = useReducedMotion();
  
  // Add state to force rerender when settings change
  const [forceRender, setForceRender] = useState(0);
  
  // Memoize particle settings to prevent unnecessary recalculations
  const particleSettings = useMemo(() => {
    // Reduce particle count for better performance
  const getParticleCount = () => {
      const baseCount = particleCount;
    switch (particleDensity) {
        case "low": return Math.floor(baseCount * 0.3);
        case "high": return Math.floor(baseCount * 1.5);
      case "medium":
        default: return Math.floor(baseCount * 0.8);
    }
  };

    const baseSettings = {
      number: { value: getParticleCount() },
      color: { value: particleColor },
      shape: { type: "circle" },
      opacity: { value: 0.65 },
      size: { value: { min: 1, max: 3 } }, // Reduced max size
    };

    // Simplified effects for better performance
    switch (particleEffect) {
      case "snow":
        return {
          ...baseSettings,
          move: {
            enable: true,
            speed: 1,
            direction: "bottom",
            random: false,
            straight: false,
            outModes: { default: "out" },
          },
        };
      case "bubbles":
        return {
          ...baseSettings,
          size: { value: { min: 2, max: 6 } },
          move: {
            enable: true,
            speed: 1.5,
            direction: "none",
            random: false,
            straight: false,
            outModes: { default: "bounce" },
          },
        };
      case "stars":
        return {
          ...baseSettings,
          shape: { type: "star" },
          move: {
            enable: true,
            speed: 0.2,
            direction: "none",
            random: false,
            straight: false,
            outModes: { default: "bounce" },
          },
          opacity: { 
            value: 0.5,
            anim: {
              enable: false // Disabled animation for better performance
            }
          },
          size: { 
            value: { min: 1, max: 2.5 },
            anim: {
              enable: false // Disabled animation for better performance
            }
          }
        };
      case "lines":
        return {
          ...baseSettings,
          shape: { type: "line" },
          move: {
            enable: true,
            speed: 0.8,
            direction: "none",
            random: false,
            straight: false,
            outModes: { default: "out" },
          },
          lineLinked: {
            enable: true,
            distance: 120,
            color: particleColor,
            opacity: 0.2,
            width: 1,
          },
        };
      case "default":
      default:
        return {
          ...baseSettings,
          move: {
            enable: true,
            speed: 0.8,
            direction: "none",
            random: false,
            straight: false,
            outModes: { default: "bounce" },
          },
        };
    }
  }, [particleColor, particleCount, particleDensity, particleEffect]);

  // Memoize particles init function
  const particlesInit = useCallback(async (engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.error('Error initializing particles:', error);
    }
  }, []);

  // Optimize event listener
  useEffect(() => {
    const handleWallpaperChange = () => {
      setForceRender(prev => prev + 1);
    };
    
    document.addEventListener('wallpaperChanged', handleWallpaperChange);
    return () => document.removeEventListener('wallpaperChanged', handleWallpaperChange);
  }, []);

  // Memoize gradient styles
  const gradientStyles = useMemo(() => ({
    top: {
      background: `linear-gradient(to bottom, ${particleColor}20, transparent)`,
      backdropFilter: 'blur(4px)',
    },
    bottom: {
      background: `linear-gradient(to top, ${particleColor}15, transparent)`,
      backdropFilter: 'blur(4px)',
    }
  }), [particleColor]);

  // Reduce number of floating bubbles
  const bubbleCount = prefersReducedMotion ? 4 : 6;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden" key={forceRender}>
      {/* Base solid color layer */}
      <div 
        className="absolute inset-0 z-[-2]" 
        style={{ backgroundColor: backgroundColor, opacity: 0.9 }}
      />
      
      {/* Gradient overlays - only render if enabled and not reduced motion */}
      {showGradient && !prefersReducedMotion && (
        <>
          <motion.div 
            className="absolute top-0 left-0 w-full h-60 pointer-events-none opacity-25"
            style={gradientStyles.top}
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div 
            className="absolute bottom-0 left-0 w-full h-60 pointer-events-none opacity-25"
            style={gradientStyles.bottom}
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "reverse" }}
          />
        </>
      )}

      {/* Glassmorphic floating bubbles - reduced count and simplified */}
      {!prefersReducedMotion && (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
          {[...Array(bubbleCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            initial={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
                scale: Math.random() * 0.4 + 0.4,
            }}
            animate={{
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
                scale: Math.random() * 0.4 + 0.6,
            }}
            transition={{
                duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "linear",
              repeatType: "reverse",
            }}
            style={{
                background: `radial-gradient(circle, ${particleColor}15 0%, transparent 70%)`,
                width: `${Math.random() * 200 + 100}px`,
                height: `${Math.random() * 200 + 100}px`,
                backdropFilter: 'blur(30px)',
                boxShadow: `0 4px 16px rgba(0, 0, 0, 0.1)`,
                opacity: 0.1 + (Math.random() * 0.1),
            }}
          />
        ))}
      </div>
      )}

      {/* Particles - with performance optimizations */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false, zIndex: 0 },
          background: { color: "transparent" },
          particles: particleSettings,
          interactivity: enableInteractivity && !prefersReducedMotion ? {
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: true, mode: "push" },
          },
          modes: {
              repulse: { distance: 80 },
              push: { quantity: 1 },
          },
          } : {
            events: {
              onHover: { enable: false },
              onClick: { enable: false },
            },
        },
          detectRetina: false, // Disable retina detection for better performance
          fpsLimit: 30, // Limit FPS to reduce GPU usage
          ...customSettings,
        }}
        className="absolute inset-0"
      />
      
      {/* Simplified glassmorphic overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(1px)',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
        }}
      />
    </div>
  );
}

export default React.memo(LiveBackground);
