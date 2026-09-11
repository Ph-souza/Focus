import React from 'react';

/**
 * Official Nexus IT / Nexus Focus Brand Symbol:
 * Stylized Spartan Helmet crowned (Elmo espartano estilizado com a coroa).
 * Precision monochrome design in pure white, platinum, and deep carbon.
 */
export function NexusFocusLogo({ className = "w-8 h-8", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nexusPlatinum" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#F8FAFC" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="nexusSilverLight" x1="50" y1="0" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="nexusSteel" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      <g id="spartan-helmet-crown">
        {/* 1. The Stylized Crown on Top of Helmet */}
        <path 
          d="M50 8 L61 23 L75 16 L69 31 L31 31 L25 16 L39 23 Z" 
          fill="url(#nexusSilverLight)" 
        />
        {/* Crown Central Facet */}
        <path 
          d="M50 8 L61 23 L50 31 L39 23 Z" 
          fill="url(#nexusPlatinum)" 
          opacity="0.95"
        />
        {/* Crown Jewel Points */}
        <circle cx="50" cy="12" r="1.8" fill="#FFFFFF" />
        <circle cx="27" cy="18" r="1.4" fill="#FFFFFF" />
        <circle cx="73" cy="18" r="1.4" fill="#FFFFFF" />
        
        {/* Crown Base Crest Band */}
        <path 
          d="M23 31 L77 31 L74 36 L26 36 Z" 
          fill="url(#nexusPlatinum)" 
        />

        {/* 2. Spartan Helmet Brow & Forehead Dome */}
        <path 
          d="M26 36 L74 36 C76 36 78 38 78 41 L80 56 C80 57.5 79 58 77 58 L57 58 L54 39 L46 39 L43 58 L23 58 C21 58 20 57.5 20 56 L22 41 C22 38 24 36 26 36 Z" 
          fill="url(#nexusPlatinum)" 
        />

        {/* 3. Central Spartan Nose Guard (Nasal) */}
        <path 
          d="M46 39 L54 39 L53 68 L50 72 L47 68 Z" 
          fill="#FFFFFF" 
        />

        {/* 4. Left Spartan Cheek Guard */}
        <path 
          d="M20 58 L42 58 L37 72 L32 88 C31.5 89.5 29.5 89.5 29 88 L22 68 Z" 
          fill="url(#nexusSilverLight)" 
        />
        <path 
          d="M22 60 L35 72 L30 87 L23 68 Z" 
          fill="url(#nexusSteel)" 
          opacity="0.25"
        />

        {/* 5. Right Spartan Cheek Guard */}
        <path 
          d="M80 58 L58 58 L63 72 L68 88 C68.5 89.5 70.5 89.5 71 88 L78 68 Z" 
          fill="url(#nexusSilverLight)" 
        />
        <path 
          d="M78 60 L65 72 L70 87 L77 68 Z" 
          fill="url(#nexusSteel)" 
          opacity="0.35"
        />

        {/* 6. Iconic Spartan T-Visor Eye Slits and Breath Slot */}
        <path 
          d="M26 60 L44 60 L45 64 L28 64 Z" 
          fill="#09090b" 
        />
        <path 
          d="M74 60 L56 60 L55 64 L72 64 Z" 
          fill="#09090b" 
        />
        <path 
          d="M48 68 L52 68 L53 82 L50 85 L47 82 Z" 
          fill="#09090b" 
        />
      </g>
    </svg>
  );
}

// Aliases for compatibility
export const AuraLogo = NexusFocusLogo;
export const SpartanCrownLogo = NexusFocusLogo;
export default NexusFocusLogo;


