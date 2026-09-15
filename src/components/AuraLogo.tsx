import React from 'react';

/**
 * Official Nexus Focus Brand Symbol:
 * Three stacked isometric rounded plates in floating perspective (Placas empilhadas em camadas).
 * Precision monochrome corporate emblem in platinum, titanium silver, and deep carbon.
 */
export interface NexusFocusLogoProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'light' | 'dark' | 'default';
}

export function NexusFocusLogo({ className = "w-8 h-8", style, variant = 'default' }: NexusFocusLogoProps) {
  // Layer 1: Top diamond / rhombus (Width: 72, Height: 34)
  const topPlatePath = "M 45.03 17.35 Q 50.00 15.00 54.97 17.35 L 81.03 29.65 Q 86.00 32.00 81.03 34.35 L 54.97 46.65 Q 50.00 49.00 45.03 46.65 L 18.97 34.35 Q 14.00 32.00 18.97 29.65 Z";
  
  // Layer 2: Middle chevron plate (Width: 72, Height: 11, Gap: 8)
  const midPlatePath = "M 18.55 42.58 Q 14.00 40.50 14.00 45.50 L 14.00 46.50 Q 14.00 51.50 18.55 53.58 L 45.45 65.92 Q 50.00 68.00 54.55 65.92 L 81.45 53.58 Q 86.00 51.50 86.00 46.50 L 86.00 45.50 Q 86.00 40.50 81.45 42.58 L 54.55 54.92 Q 50.00 57.00 45.45 54.92 Z";
  
  // Layer 3: Bottom chevron plate (Width: 72, Height: 11, Gap: 8)
  const botPlatePath = "M 18.55 61.58 Q 14.00 59.50 14.00 64.50 L 14.00 65.50 Q 14.00 70.50 18.55 72.58 L 45.45 84.92 Q 50.00 87.00 54.55 84.92 L 81.45 72.58 Q 86.00 70.50 86.00 65.50 L 86.00 64.50 Q 86.00 59.50 81.45 61.58 L 54.55 73.92 Q 50.00 76.00 45.45 73.92 Z";

  const isDarkVariant = variant === 'dark';

  return (
    <svg 
      className={className} 
      style={style}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {isDarkVariant ? (
          <>
            {/* Top Plate Dark Obsidian / Titanium Gradient */}
            <linearGradient id="nexusDarkLayerTop" x1="14" y1="15" x2="86" y2="49" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2e3540" />
              <stop offset="50%" stopColor="#181c24" />
              <stop offset="100%" stopColor="#0f1115" />
            </linearGradient>

            {/* Middle Plate Metallic Carbon Slate Gradient */}
            <linearGradient id="nexusDarkLayerMid" x1="14" y1="40" x2="86" y2="68" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="45%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#1a202c" />
            </linearGradient>

            {/* Bottom Plate Deep Obsidian Gradient */}
            <linearGradient id="nexusDarkLayerBot" x1="14" y1="59" x2="86" y2="87" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b4252" />
              <stop offset="50%" stopColor="#242933" />
              <stop offset="100%" stopColor="#14171f" />
            </linearGradient>
          </>
        ) : (
          <>
            {/* Top Plate Platinum Gradient */}
            <linearGradient id="nexusLayerTop" x1="14" y1="15" x2="86" y2="49" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>

            {/* Middle Plate Metallic Titanium Gray Gradient */}
            <linearGradient id="nexusLayerMid" x1="14" y1="40" x2="86" y2="68" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#CBD5E1" />
              <stop offset="45%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>

            {/* Bottom Plate Platinum Gradient */}
            <linearGradient id="nexusLayerBot" x1="14" y1="59" x2="86" y2="87" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </>
        )}
      </defs>

      <g id="nexus-layered-plates">
        {/* Layer 1 - Top Solid Rhombus */}
        <path 
          d={topPlatePath} 
          fill={isDarkVariant ? "url(#nexusDarkLayerTop)" : "url(#nexusLayerTop)"}
          stroke={isDarkVariant ? "rgba(255, 255, 255, 0.25)" : undefined}
          strokeWidth={isDarkVariant ? "0.6" : undefined}
        />

        {/* Layer 2 - Middle Chevron Plate */}
        <path 
          d={midPlatePath} 
          fill={isDarkVariant ? "url(#nexusDarkLayerMid)" : "url(#nexusLayerMid)"}
          stroke={isDarkVariant ? "rgba(255, 255, 255, 0.15)" : undefined}
          strokeWidth={isDarkVariant ? "0.5" : undefined}
        />

        {/* Layer 3 - Bottom Chevron Plate */}
        <path 
          d={botPlatePath} 
          fill={isDarkVariant ? "url(#nexusDarkLayerBot)" : "url(#nexusLayerBot)"}
          stroke={isDarkVariant ? "rgba(255, 255, 255, 0.12)" : undefined}
          strokeWidth={isDarkVariant ? "0.5" : undefined}
        />
      </g>
    </svg>
  );
}

// Aliases for compatibility
export const AuraLogo = NexusFocusLogo;
export const SpartanCrownLogo = NexusFocusLogo;
export default NexusFocusLogo;
