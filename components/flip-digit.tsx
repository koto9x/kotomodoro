'use client';

import { useEffect, useState, useRef } from 'react';
import { useSound } from '@/contexts/sound-context';

interface FlipDigitProps {
  digit: number;
  unit: string;
  visible?: boolean;
}

export function FlipDigit({ digit, unit, visible = true }: FlipDigitProps) {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setPrevDigit(digit);
        setIsFlipping(false);
      }, 600);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [digit, prevDigit]);
  
  if (!visible) return null;
  
  const formattedCurrent = digit.toString().padStart(2, '0');
  const formattedPrevious = prevDigit.toString().padStart(2, '0');
  
  return (
    <div className="flex flex-col items-center transition-all duration-300">
      <div className="flex gap-1">
        <SingleDigit 
          current={formattedCurrent[0]} 
          previous={formattedPrevious[0]} 
          isFlipping={isFlipping && formattedCurrent[0] !== formattedPrevious[0]} 
        />
        <SingleDigit 
          current={formattedCurrent[1]} 
          previous={formattedPrevious[1]} 
          isFlipping={isFlipping && formattedCurrent[1] !== formattedPrevious[1]} 
        />
      </div>
      <span className="mt-2 text-xs font-mono uppercase tracking-wider text-zinc-400 transition-opacity duration-300">
        {unit}
      </span>
    </div>
  );
}

function SingleDigit({ current, previous, isFlipping }: { 
  current: string;
  previous: string;
  isFlipping: boolean;
}) {
  return (
    <div className="relative w-12 h-20 sm:w-14 sm:h-24">
      {/* Container with perspective for 3D effect */}
      <div className="w-full h-full perspective-[800px]">
        {/* Top half - showing current digit top half */}
        <div className="absolute inset-0 h-1/2 bg-black border border-zinc-800 rounded-t-md overflow-hidden">
          <div className="absolute inset-0 flex justify-center items-end">
            {/* CRITICAL: This shows only top half of digit by positioning */}
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white leading-none" 
                 style={{ transform: 'translateY(50%)' }}>
              {current}
            </div>
          </div>
        </div>
        
        {/* Bottom half - showing current digit bottom half */}
        <div className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden">
          <div className="absolute inset-0 flex justify-center items-start">
            {/* CRITICAL: This shows only bottom half of digit by positioning */}
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white leading-none" 
                 style={{ transform: 'translateY(-50%)' }}>
              {current}
            </div>
          </div>
        </div>
        
        {/* Animated top flap */}
        {isFlipping && (
          <div 
            className="absolute inset-0 h-1/2 bg-black border border-zinc-800 rounded-t-md overflow-hidden z-10"
            style={{
              transformOrigin: 'bottom',
              animation: 'flip-top-half 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          >
            <div className="absolute inset-0 flex justify-center items-end">
              {/* Shows only top half of previous digit */}
              <div className="text-2xl sm:text-4xl font-mono font-bold text-white leading-none" 
                   style={{ transform: 'translateY(50%)' }}>
                {previous}
              </div>
            </div>
            {/* Shadow overlay */}
            <div className="absolute inset-0 bg-black opacity-0" 
                 style={{ animation: 'fade-in 0.6s linear forwards' }}></div>
          </div>
        )}
        
        {/* Animated bottom flap */}
        {isFlipping && (
          <div 
            className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden z-10"
            style={{
              transformOrigin: 'top',
              transform: 'rotateX(90deg)',
              animation: 'flip-bottom-half 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              animationDelay: '0.3s',
            }}
          >
            <div className="absolute inset-0 flex justify-center items-start">
              {/* Shows only bottom half of current digit */}
              <div className="text-2xl sm:text-4xl font-mono font-bold text-white leading-none" 
                   style={{ transform: 'translateY(-50%)' }}>
                {current}
              </div>
            </div>
            {/* Shadow overlay */}
            <div className="absolute inset-0 bg-black opacity-100" 
                 style={{ animation: 'fade-out 0.6s linear forwards', animationDelay: '0.3s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}