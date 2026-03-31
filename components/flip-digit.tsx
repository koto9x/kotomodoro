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
 * Renders a digit clipped to show only the top or bottom half.
 * The full digit is centered in a full-height container, then offset
 * so only the correct half is visible through overflow:hidden.
 */
function HalfDigit({ char, half }: { char: string; half: 'top' | 'bottom' }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        top: half === 'top' ? 0 : '-100%',
      }}
    >
      <span className="text-4xl sm:text-5xl font-mono font-bold text-white select-none">
        {char}
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
    <div className="relative w-11 h-16 sm:w-14 sm:h-20" style={{ perspective: '800px' }}>
      {/* === STATIC TOP HALF === shows current digit's top half */}
      <div className="absolute inset-0 h-1/2 overflow-hidden bg-zinc-950 border border-b-0 border-zinc-800 rounded-t-md">
        <HalfDigit char={current} half="top" />
      </div>

      {/* === STATIC BOTTOM HALF === shows current digit's bottom half */}
      <div className="absolute left-0 right-0 top-1/2 h-1/2 overflow-hidden bg-zinc-950 border border-t-0 border-zinc-800 rounded-b-md">
        <HalfDigit char={current} half="bottom" />
      </div>

      {/* === ANIMATED TOP FLAP === shows OLD digit, flips down to reveal new top */}
      {isFlipping && (
        <div
          className="absolute inset-0 h-1/2 overflow-hidden bg-zinc-950 border border-b-0 border-zinc-800 rounded-t-md z-10"
          style={{
            transformOrigin: 'bottom center',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            animation: 'flip-top 0.2s ease-in forwards',
          }}
        >
          <HalfDigit char={previous} half="top" />
          <div
            className="absolute inset-0 bg-black opacity-0"
            style={{ animation: 'flip-shadow-in 0.2s linear forwards' }}
          />
        </div>
      )}

      {/* === ANIMATED BOTTOM FLAP === reveals NEW digit bottom half */}
      {isFlipping && (
        <div
          className="absolute left-0 right-0 top-1/2 h-1/2 overflow-hidden bg-zinc-950 border border-t-0 border-zinc-800 rounded-b-md z-10"
          style={{
            transformOrigin: 'top center',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            animation: 'flip-bottom 0.2s ease-out 0.2s forwards',
            transform: 'rotateX(90deg)',
          }}
        >
          <HalfDigit char={current} half="bottom" />
          <div
            className="absolute inset-0 bg-black opacity-50"
            style={{ animation: 'flip-shadow-out 0.2s linear 0.2s forwards' }}
          />
        </div>
      )}

      {/* Divider line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-700 z-20" />
    </div>
  );
}
