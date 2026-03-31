'use client';

import { useEffect, useState, useRef } from 'react';

interface FlipDigitProps {
  digit: number;
  unit: string;
  visible?: boolean;
}

export function FlipDigit({ digit, unit, visible = true }: FlipDigitProps) {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (digit !== currentDigit) {
      setPrevDigit(currentDigit);
      setCurrentDigit(digit);
      setIsFlipping(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsFlipping(false);
      }, 400);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [digit, currentDigit]);

  if (!visible) return null;

  const formattedCurrent = currentDigit.toString().padStart(2, '0');
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

/**
 * A full-size digit that is clipped to show only the top or bottom half
 * using clip-path: inset(). This is the only reliable cross-browser/mobile
 * approach — it actually removes rendering of the clipped portion.
 */
function ClippedDigit({ char, half, className, style }: {
  char: string;
  half: 'top' | 'bottom';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute inset-0 ${className || ''}`}
      style={{
        clipPath: half === 'top' ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)',
        ...style,
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-4xl sm:text-5xl font-mono font-bold text-white select-none">
          {char}
        </span>
      </div>
    </div>
  );
}

function SingleDigit({ current, previous, isFlipping }: {
  current: string;
  previous: string;
  isFlipping: boolean;
}) {
  return (
    <div className="relative w-11 h-16 sm:w-14 sm:h-20" style={{ perspective: '800px' }}>
      {/* Static top half — current digit, clipped to top 50% */}
      <ClippedDigit
        char={current}
        half="top"
        className="bg-zinc-950 border border-zinc-800 rounded-md"
      />

      {/* Static bottom half — current digit, clipped to bottom 50% */}
      <ClippedDigit
        char={current}
        half="bottom"
        className="bg-zinc-950 border border-zinc-800 rounded-md"
      />

      {/* Animated top flap — OLD digit flips down, revealing new digit behind */}
      {isFlipping && (
        <ClippedDigit
          char={previous}
          half="top"
          className="bg-zinc-950 border border-zinc-800 rounded-md z-10"
          style={{
            transformOrigin: 'center bottom',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            animation: 'flip-top 0.2s ease-in forwards',
          }}
        />
      )}

      {/* Animated bottom flap — NEW digit unfolds from top */}
      {isFlipping && (
        <ClippedDigit
          char={current}
          half="bottom"
          className="bg-zinc-950 border border-zinc-800 rounded-md z-10"
          style={{
            transformOrigin: 'center top',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            transform: 'rotateX(90deg)',
            animation: 'flip-bottom 0.2s ease-out 0.2s forwards',
          }}
        />
      )}

      {/* Divider line at the fold */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-700 z-20 pointer-events-none" />
    </div>
  );
}
