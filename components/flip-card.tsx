'use client';

import { useEffect, useState } from 'react';

interface FlipCardProps {
  value: number;
  label: string;
  visible?: boolean;
}

export function FlipCard({ value, label, visible = true }: FlipCardProps) {
  // Get current and previous values as padded strings
  const valueStr = value.toString().padStart(2, '0');
  const [topDigit, setTopDigit] = useState(valueStr);
  const [bottomDigit, setBottomDigit] = useState(valueStr);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Handle value changes
  useEffect(() => {
    const newValueStr = value.toString().padStart(2, '0');
    if (newValueStr !== topDigit) {
      // Start flip animation
      setIsFlipping(true);
      
      // Update bottom digit immediately (will be revealed during flip)
      setBottomDigit(newValueStr);
      
      // Update top digit after animation completes
      const timer = setTimeout(() => {
        setTopDigit(newValueStr);
        setIsFlipping(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [value, topDigit]);

  if (!visible) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Main container - each card is a completely separate element */}
        <div className="flex">
          {/* First digit */}
          <SingleFlipCard 
            digit={topDigit[0]} 
            nextDigit={bottomDigit[0]} 
            isFlipping={isFlipping && topDigit[0] !== bottomDigit[0]} 
          />
          {/* Second digit */}
          <SingleFlipCard 
            digit={topDigit[1]} 
            nextDigit={bottomDigit[1]} 
            isFlipping={isFlipping && topDigit[1] !== bottomDigit[1]} 
          />
        </div>
      </div>
      <span className="mt-2 text-xs font-mono uppercase tracking-wider text-zinc-500">
        {label}
      </span>
    </div>
  );
}

// Individual card component
function SingleFlipCard({ digit, nextDigit, isFlipping }: { 
  digit: string; 
  nextDigit: string;
  isFlipping: boolean;
}) {
  return (
    <div className="relative w-12 h-24 mx-1">
      {/* Static top half (always shows current digit) */}
      <div className="absolute inset-0 h-1/2 bg-black border border-b-0 border-zinc-800 rounded-t-md overflow-hidden">
        {/* Container for top half of digit */}
        <div className="h-full w-full relative">
          {/* Digit positioned to only show top half */}
          <span 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl font-mono font-bold text-white"
          >
            {digit}
          </span>
        </div>
      </div>

      {/* Static bottom half (always shows next digit) */}
      <div className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden">
        {/* Container for bottom half of digit */}
        <div className="h-full w-full relative">
          {/* Digit positioned to only show bottom half */}
          <span 
            className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl font-mono font-bold text-white"
          >
            {nextDigit}
          </span>
        </div>
      </div>

      {/* Animated flipping top card */}
      {isFlipping && (
        <div 
          className="absolute inset-0 h-1/2 bg-black border border-b-0 border-zinc-800 rounded-t-md overflow-hidden z-10"
          style={{ 
            transformOrigin: 'bottom center',
            animation: 'flipDown 0.3s ease-in forwards'
          }}
        >
          <div className="h-full w-full relative">
            <span 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl font-mono font-bold text-white"
            >
              {digit}
            </span>
          </div>
          <div 
            className="absolute inset-0 bg-black/40"
            style={{ animation: 'fadeIn 0.3s linear forwards' }}
          />
        </div>
      )}

      {/* Animated flipping bottom card */}
      {isFlipping && (
        <div 
          className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden z-10"
          style={{ 
            transformOrigin: 'top center',
            animation: 'flipUp 0.3s 0.3s ease-out forwards',
            transform: 'rotateX(-90deg)'
          }}
        >
          <div className="h-full w-full relative">
            <span 
              className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl font-mono font-bold text-white"
            >
              {nextDigit}
            </span>
          </div>
          <div 
            className="absolute inset-0 bg-black/40"
            style={{ animation: 'fadeOut 0.3s 0.3s linear forwards' }}
          />
        </div>
      )}

      {/* Divider line between top and bottom */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800 z-20" />
    </div>
  );
}