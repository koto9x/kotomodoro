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
      // Store the old digit for the flip-away animation
      setPrevDigit(currentDigit);
      // Update to new digit immediately (static halves show new value)
      setCurrentDigit(digit);
      setIsFlipping(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Animation completes in 400ms total (200ms top + 200ms bottom w/ 200ms delay)
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

function SingleDigit({ current, previous, isFlipping }: {
  current: string;
  previous: string;
  isFlipping: boolean;
}) {
  return (
    <div className="relative w-12 h-20 sm:w-14 sm:h-24" style={{ perspective: '800px' }}>
      {/* Static top half - shows NEW digit top half */}
      <div className="absolute inset-0 h-1/2 bg-black border border-b-0 border-zinc-800 rounded-t-md overflow-hidden">
        <div className="h-full w-full relative">
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl font-mono font-bold text-white leading-none">
            {current}
          </span>
        </div>
      </div>

      {/* Static bottom half - shows NEW digit bottom half */}
      <div className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden">
        <div className="h-full w-full relative">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl font-mono font-bold text-white leading-none">
            {current}
          </span>
        </div>
      </div>

      {/* Animated top flap - flips DOWN showing OLD digit, reveals new top half behind it */}
      {isFlipping && (
        <div
          className="absolute inset-0 h-1/2 bg-black border border-b-0 border-zinc-800 rounded-t-md overflow-hidden z-10"
          style={{
            transformOrigin: 'bottom center',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            animation: 'flip-top 0.2s ease-in forwards',
          }}
        >
          <div className="h-full w-full relative">
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl font-mono font-bold text-white leading-none">
              {previous}
            </span>
          </div>
          {/* Shadow overlay - darkens as flap folds away */}
          <div
            className="absolute inset-0 bg-black opacity-0"
            style={{ animation: 'flip-shadow-in 0.2s linear forwards' }}
          />
        </div>
      )}

      {/* Animated bottom flap - flips UP revealing NEW digit bottom half */}
      {isFlipping && (
        <div
          className="absolute inset-0 top-1/2 h-1/2 bg-black border border-t-0 border-zinc-800 rounded-b-md overflow-hidden z-10"
          style={{
            transformOrigin: 'top center',
            backfaceVisibility: 'hidden',
            willChange: 'transform',
            animation: 'flip-bottom 0.2s ease-out 0.2s forwards',
            transform: 'rotateX(90deg)',
          }}
        >
          <div className="h-full w-full relative">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl sm:text-4xl font-mono font-bold text-white leading-none">
              {current}
            </span>
          </div>
          {/* Shadow overlay - lightens as flap unfolds */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            style={{ animation: 'flip-shadow-out 0.2s linear 0.2s forwards' }}
          />
        </div>
      )}

      {/* Divider line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800 z-20" />
    </div>
  );
}
