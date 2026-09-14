import React from 'react';

export interface NexusLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Official Nexus Focus Brand Symbol:
 * Precision 3D Stacked Layers (Placas empilhadas em camadas).
 * - Layer 1 (Top): Satin dark carbon diamond plate with beveled specular edge
 * - White Slit 1: High-intensity white ambient light bar
 * - Layer 2 (Middle): Brushed metallic titanium plate with chevron contour
 * - White Slit 2: High-intensity white ambient light bar
 * - Layer 3 (Bottom): Satin dark carbon plate with chevron contour
 * - Ground Reflection: Subtle floor mirror reflection
 */
export function NexusFocusLogo({ className = "w-8 h-8", style }: NexusLogoProps) {
  return (
    <svg 
      className={className} 
      style={style}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Top Plate Gradient (Deep satin carbon) */}
        <linearGradient id="nexusTopPlate" x1="50" y1="14" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38383e" />
          <stop offset="45%" stopColor="#1e1e22" />
          <stop offset="100%" stopColor="#0d0d0f" />
        </linearGradient>

        {/* Top Plate Specular Highlight */}
        <linearGradient id="nexusTopBevel" x1="20" y1="16" x2="80" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="40%" stopColor="#a1a1aa" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </linearGradient>

        {/* Middle Plate Gradient (Titanium Metallic Gray) */}
        <linearGradient id="nexusMidPlate" x1="50" y1="42" x2="50" y2="67" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e4e4e7" />
          <stop offset="35%" stopColor="#b4b4bb" />
          <stop offset="100%" stopColor="#6e6e77" />
        </linearGradient>

        {/* Bottom Plate Gradient (Deep satin carbon) */}
        <linearGradient id="nexusBotPlate" x1="50" y1="57" x2="50" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38383e" />
          <stop offset="45%" stopColor="#1e1e22" />
          <stop offset="100%" stopColor="#0d0d0f" />
        </linearGradient>

        {/* Slit Glow Gradient */}
        <linearGradient id="slitGlowGrad" x1="22" y1="0" x2="78" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
        </linearGradient>

        {/* Floor Reflection Gradient */}
        <linearGradient id="reflectionGrad" x1="50" y1="84" x2="50" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a1a1aa" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#71717a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </linearGradient>

        <filter id="slitGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g id="nexus-stacked-plates">
        {/* 1. Floor Reflection */}
        <path
          d="M 26 86 L 48.8 96.2 C 49.5 96.5 50.5 96.5 51.2 96.2 L 74 86 C 74.8 85.6 75.8 86.2 75.2 87 L 51.2 98.2 C 50.5 98.5 49.5 98.5 48.8 98.2 L 24.8 87 C 24.2 86.2 25.2 85.6 26 86 Z"
          fill="url(#reflectionGrad)"
        />

        {/* 2. Bottom Plate: Rounded Chevron in Satin Carbon */}
        <path
          d="M 21.2 59.8 L 48.5 73.8 C 49.4 74.3 50.6 74.3 51.5 73.8 L 78.8 59.8 C 80.6 58.9 82.5 61.2 81.2 62.6 L 52.6 79.8 C 51 80.8 49 80.8 47.4 79.8 L 18.8 62.6 C 17.5 61.2 19.4 58.9 21.2 59.8 Z"
          fill="url(#nexusBotPlate)"
          stroke="#52525b"
          strokeWidth="0.6"
        />

        {/* White Light Slit 2 (Between Middle and Bottom Plate) */}
        <path
          d="M 24 59.2 L 49.2 72 C 49.7 72.3 50.3 72.3 50.8 72 L 76 59.2"
          stroke="url(#slitGlowGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#slitGlowFilter)"
        />

        {/* 3. Middle Plate: Rounded Chevron in Metallic Titanium Gray */}
        <path
          d="M 21.2 44.8 L 48.5 58.8 C 49.4 59.3 50.6 59.3 51.5 58.8 L 78.8 44.8 C 80.6 43.9 82.5 46.2 81.2 47.6 L 52.6 64.8 C 51 65.8 49 65.8 47.4 64.8 L 18.8 47.6 C 17.5 46.2 19.4 43.9 21.2 44.8 Z"
          fill="url(#nexusMidPlate)"
          stroke="#e4e4e7"
          strokeWidth="0.6"
        />

        {/* White Light Slit 1 (Between Top and Middle Plate) */}
        <path
          d="M 24 44.2 L 49.2 57 C 49.7 57.3 50.3 57.3 50.8 57 L 76 44.2"
          stroke="url(#slitGlowGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#slitGlowFilter)"
        />

        {/* 4. Top Plate: Isometric Rounded Rhombus/Diamond */}
        <path
          d="M 47.4 14.8 C 49 13.8 51 13.8 52.6 14.8 L 81.2 31.4 C 82.8 32.4 82.8 34.6 81.2 35.6 L 52.6 52.2 C 51 53.2 49 53.2 47.4 52.2 L 18.8 35.6 C 17.2 34.6 17.2 32.4 18.8 31.4 Z"
          fill="url(#nexusTopPlate)"
          stroke="#71717a"
          strokeWidth="0.75"
        />
        {/* Top Plate Bevel Specular Sheen */}
        <path
          d="M 47.4 14.8 C 49 13.8 51 13.8 52.6 14.8 L 81.2 31.4 C 82.8 32.4 82.8 34.6 81.2 35.6 L 52.6 52.2 C 51 53.2 49 53.2 47.4 52.2 L 18.8 35.6 C 17.2 34.6 17.2 32.4 18.8 31.4 Z"
          fill="url(#nexusTopBevel)"
        />
        {/* Top Plate Specular Edge Highlight Stroke */}
        <path
          d="M 19.5 31.8 L 48 15.4 C 49.2 14.7 50.8 14.7 52 15.4 L 80.5 31.8"
          stroke="#ffffff"
          strokeWidth="0.9"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// Aliases for compatibility
export const AuraLogo = NexusFocusLogo;
export const StackedPlatesLogo = NexusFocusLogo;
export const SpartanCrownLogo = NexusFocusLogo;
export default NexusFocusLogo;
