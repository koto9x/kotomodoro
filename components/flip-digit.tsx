'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FlipDigitProps {
  digit: number;
  unit: string;
  visible?: boolean;
  compact?: boolean;
}

export function FlipDigit({ digit, unit, visible = true, compact = false }: FlipDigitProps) {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [prevDisplayDigit, setPrevDisplayDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setPrevDisplayDigit(prevDigitRef.current);
      setDisplayDigit(digit);
      prevDigitRef.current = digit;

      setIsFlipping(false);
      requestAnimationFrame(() => {
        setIsFlipping(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsFlipping(false);
        }, 700);
      });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [digit]);

  if (!visible) return null;

  const formattedCurrent = displayDigit.toString().padStart(2, '0');
  const formattedPrevious = prevDisplayDigit.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5 sm:gap-1">
        <SingleDigit
          current={formattedCurrent[0]}
          previous={formattedPrevious[0]}
          isFlipping={isFlipping && formattedCurrent[0] !== formattedPrevious[0]}
          compact={compact}
        />
        <SingleDigit
          current={formattedCurrent[1]}
          previous={formattedPrevious[1]}
          isFlipping={isFlipping && formattedCurrent[1] !== formattedPrevious[1]}
          compact={compact}
        />
      </div>
      <span className={cn(
        "font-mono uppercase tracking-wider text-zinc-400",
        compact ? "mt-1 text-[10px]" : "mt-2 text-xs",
      )}>
        {unit}
      </span>
    </div>
  );
}

function DigitFace({ char, compact }: { char: string; compact: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className={cn(
        "font-mono font-bold text-white select-none",
        compact ? "text-2xl sm:text-4xl" : "text-4xl sm:text-5xl",
      )}>
        {char}
      </span>
    </div>
  );
}

function SingleDigit({ current, previous, isFlipping, compact }: {
  current: string;
  previous: string;
  isFlipping: boolean;
  compact: boolean;
}) {
  return (
    <div className={cn(
      "relative",
      compact ? "w-8 h-12 sm:w-12 sm:h-16" : "w-11 h-16 sm:w-14 sm:h-20",
    )}>
      {/* Static top half: current digit */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        <DigitFace char={current} compact={compact} />
      </div>

      {/* Static bottom half: shows OLD digit during flip, NEW digit after */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        <DigitFace char={isFlipping ? previous : current} compact={compact} />
      </div>

      {/* Animated top flap: old digit folds down */}
      {isFlipping && (
        <div
          className="absolute inset-0 z-10"
          style={{ clipPath: 'inset(0 0 50% 0)' }}
        >
          <div
            className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
            style={{
              transformOrigin: 'center bottom',
              animation: 'flip-top 0.3s ease-in forwards',
            }}
          >
            <DigitFace char={previous} compact={compact} />
            <div
              className="absolute inset-0 bg-black opacity-0"
              style={{ animation: 'flip-shadow-in 0.3s linear forwards' }}
            />
          </div>
        </div>
      )}

      {/* Animated bottom flap: new digit unfolds */}
      {isFlipping && (
        <div
          className="absolute inset-0 z-10"
          style={{ clipPath: 'inset(50% 0 0 0)' }}
        >
          <div
            className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
            style={{
              transformOrigin: 'center top',
              transform: 'rotateX(90deg)',
              animation: 'flip-bottom 0.3s ease-out 0.3s forwards',
            }}
          >
            <DigitFace char={current} compact={compact} />
            <div
              className="absolute inset-0 bg-black opacity-50"
              style={{ animation: 'flip-shadow-out 0.3s linear 0.3s forwards' }}
            />
          </div>
        </div>
      )}

      {/* Divider line at the fold */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-700 z-20 pointer-events-none" />
    </div>
  );
}
