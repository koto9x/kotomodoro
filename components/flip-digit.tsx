'use client';

import { useEffect, useState, useRef } from 'react';

interface FlipDigitProps {
  digit: number;
  unit: string;
  visible?: boolean;
}

export function FlipDigit({ digit, unit, visible = true }: FlipDigitProps) {
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

      // Reset flip animation
      setIsFlipping(false);
      // Force a reflow so React re-mounts the animated elements
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
      <span className="mt-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
        {unit}
      </span>
    </div>
  );
}

/**
 * A full-card-sized digit centered with flexbox, clipped to half via clip-path.
 * clip-path is on the OUTER wrapper, 3D transform on inner div.
 */
function DigitFace({ char }: { char: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
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
    <div className="relative w-11 h-16 sm:w-14 sm:h-20">
      {/* Static top half: current digit */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        <DigitFace char={current} />
      </div>

      {/* Static bottom half: shows OLD digit during flip, NEW digit after */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        <DigitFace char={isFlipping ? previous : current} />
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
            <DigitFace char={previous} />
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
            <DigitFace char={current} />
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
