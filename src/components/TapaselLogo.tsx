import React from 'react';

interface TapaselLogoProps {
  className?: string;
  isDarkTheme?: boolean;
}

export default function TapaselLogo({ className = "h-9", isDarkTheme = true }: TapaselLogoProps) {
  return (
    <svg 
      viewBox="0 0 350 78" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* 
        Stylized "TPS" Emblem
        Now dynamically colored using our theme's primary brand variable
      */}
      {/* 
        Stylized "TPS" Emblem
        Now dynamically colored using our theme's corporate brand variable (Red)
      */}
      <g>
        {/* The top bar of T which wraps around P & S as a continuous boundary frame */}
        <path 
          d="M 6 56 L 6 12 L 102 12 L 102 46" 
          stroke="var(--color-brand-corporate)" 
          strokeWidth="6" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
        />
        
        {/* The vertical stem of T */}
        <path 
          d="M 23 12 L 23 54" 
          stroke="var(--color-brand-corporate)" 
          strokeWidth="6" 
          strokeLinecap="square" 
        />

        {/* The letter P inside the frame */}
        <path 
          d="M 43 54 L 43 25 M 43 25 C 57 25 68 25 68 36 C 68 47 43 47 43 47" 
          stroke="var(--color-brand-corporate)" 
          strokeWidth="6" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
        />

        {/* The letter S inside the frame */}
        <path 
          d="M 92 27 L 78 27 C 75 27 72 29 72 32 C 72 35 94 34 94 42 C 94 46 90 49 84 49 L 72 49" 
          stroke="var(--color-brand-corporate)" 
          strokeWidth="6" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
        />

        {/* Continuous bottom red horizontal underline extending past emblem and underneath TAPASEL S.A.S */}
        <path 
          d="M 102 60 L 328 60" 
          stroke="var(--color-brand-corporate)" 
          strokeWidth="6" 
          strokeLinecap="square" 
        />
      </g>

      {/* 
        TAPASEL S.A.S. Text
        Main text uses bold uppercase type matching the brand slogan.
      */}
      <text 
        x="110" 
        y="45" 
        fill={isDarkTheme ? "#FFFFFF" : "var(--color-slate-900)"} 
        fontFamily="var(--font-display), system-ui, -apple-system, sans-serif"
        fontWeight="850" 
        fontSize="30" 
        letterSpacing="1.5"
      >
        TAPASEL
      </text>
      
      <text 
        x="272" 
        y="45" 
        fill={isDarkTheme ? "var(--color-brand-corporate)" : "var(--color-slate-500)"} 
        fontFamily="var(--font-mono), system-ui, -apple-system, sans-serif"
        fontWeight="700" 
        fontSize="17" 
        letterSpacing="0.8"
      >
        s.a.s
      </text>
    </svg>
  );
}
