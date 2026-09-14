import React from 'react';

/**
 * Official Nexus Focus Brand Symbol:
 * 3 Stacked Floating Layers / Plates (Isometric Rounded Rhombus & Chevrons).
 * Precision monochrome corporate design conforming to official brand guidelines.
 */
export interface NexusFocusLogoProps {
  className?: string;
  style?: React.CSSProperties;
  variant?: 'auto' | 'dark' | 'light';
}

export function NexusFocusLogo({ className = "w-8 h-8", style, variant = 'auto' }: NexusFocusLogoProps) {
  const topFill = variant === 'dark' 
    ? 'url(#nexusLayerPrimaryDark)' 
    : variant === 'light' 
      ? 'url(#nexusLayerPrimaryLight)' 
      : undefined;

  const midFill = variant === 'dark' 
    ? 'url(#nexusLayerAccentDark)' 
    : variant === 'light' 
      ? 'url(#nexusLayerAccentLight)' 
      : undefined;

  const botFill = variant === 'dark' 
    ? 'url(#nexusLayerBaseDark)' 
    : variant === 'light' 
      ? 'url(#nexusLayerBaseLight)' 
      : undefined;

  return (
    <svg 
      className={className} 
      style={style}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Dark Theme Gradients (White / Platinum / Titanium Slate) */}
        <linearGradient id="nexusLayerPrimaryDark" x1="20" y1="12" x2="80" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="nexusLayerAccentDark" x1="20" y1="40" x2="80" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="nexusLayerBaseDark" x1="20" y1="61" x2="80" y2="91" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        {/* Light Theme Gradients (Dark Graphite / Titanium Grey) */}
        <linearGradient id="nexusLayerPrimaryLight" x1="20" y1="12" x2="80" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
        <linearGradient id="nexusLayerAccentLight" x1="20" y1="40" x2="80" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8E939C" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="nexusLayerBaseLight" x1="20" y1="61" x2="80" y2="91" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#27272A" />
          <stop offset="100%" stopColor="#09090B" />
        </linearGradient>
      </defs>

      {/* Top Plate (Isometric Rounded Rhombus) */}
      <path
        d="M 21.5 29 L 46.5 14 Q 50 12 53.5 14 L 78.5 29 Q 82 31 78.5 33 L 53.5 48 Q 50 50 46.5 48 L 21.5 33 Q 18 31 21.5 29 Z"
        fill={topFill}
        className={variant === 'auto' ? 'fill-[url(#nexusLayerPrimaryLight)] dark:fill-[url(#nexusLayerPrimaryDark)] transition-colors' : undefined}
      />

      {/* Middle Plate (Floating Titanium Rounded Chevron) */}
      <path
        d="M 21.5 40 L 46.5 55 Q 50 57 53.5 55 L 78.5 40 Q 82.5 46.5 78.5 53 L 53.5 68 Q 50 70 46.5 68 L 21.5 53 Q 17.5 46.5 21.5 40 Z"
        fill={midFill}
        className={variant === 'auto' ? 'fill-[url(#nexusLayerAccentLight)] dark:fill-[url(#nexusLayerAccentDark)] transition-colors' : undefined}
      />

      {/* Bottom Plate (Floating Base Rounded Chevron) */}
      <path
        d="M 21.5 61 L 46.5 76 Q 50 78 53.5 76 L 78.5 61 Q 82.5 67.5 78.5 74 L 53.5 89 Q 50 91 46.5 89 L 21.5 74 Q 17.5 67.5 21.5 61 Z"
        fill={botFill}
        className={variant === 'auto' ? 'fill-[url(#nexusLayerBaseLight)] dark:fill-[url(#nexusLayerBaseDark)] transition-colors' : undefined}
      />
    </svg>
  );
}

// Aliases for compatibility
export const AuraLogo = NexusFocusLogo;
export const SpartanCrownLogo = NexusFocusLogo;
export default NexusFocusLogo;
