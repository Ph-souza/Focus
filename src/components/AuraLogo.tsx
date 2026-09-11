import React from 'react';

export function NexusFocusLogo({ className = "w-8 h-8", style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeWidth="0">
        {/* Left Leg swooping up to top right - Golden Amber gradient */}
        <path d="M15 85 L35 85 L65 15 L45 15 Z" fill="url(#amberGrad)" />
        
        {/* Crossbar going from left leg across - Deep Amber shadow */}
        <path d="M28 60 L80 60 L70 85 L15 85 Z" fill="url(#amberDark)" />

        {/* Right Leg front swooping down - Executive Platinum Silver */}
        <path d="M52 15 C45 0 65 0 75 25 L95 85 L73 85 L48 25 C45 15 50 15 52 15 Z" fill="url(#silverGrad)" />
      </g>
      <defs>
        <linearGradient id="amberGrad" x1="15" y1="85" x2="65" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24"/>
          <stop offset="1" stopColor="#d97706"/>
        </linearGradient>
        <linearGradient id="amberDark" x1="28" y1="60" x2="80" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b45309"/>
          <stop offset="0.5" stopColor="#f59e0b"/>
          <stop offset="1" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="silverGrad" x1="45" y1="15" x2="95" y2="85" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff"/>
          <stop offset="0.1" stopColor="#f8fafc"/>
          <stop offset="0.35" stopColor="#cbd5e1"/>
          <stop offset="0.6" stopColor="#f1f5f9"/>
          <stop offset="0.8" stopColor="#94a3b8"/>
          <stop offset="1" stopColor="#475569"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Backward compatibility alias
export const AuraLogo = NexusFocusLogo;

