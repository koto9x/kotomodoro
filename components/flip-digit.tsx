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
      }, 500);
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
 * clip-path is on the OUTER wrapper. Any 3D transform goes on this wrapper too,
 * but we split them: clip-path clips the resting content, and when we need to
 * animate, we use a separate wrapper pattern.
 */
function DigitFace({ char, className }: { char: string; className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center ${className || ''}`}>
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
  // The card is the full height. Each "half" is positioned absolutely to fill
  // the full card, but clip-path cuts it to show only top or bottom 50%.
  // For the animated flaps, clip-path is on an outer wrapper and the 3D
  // transform is on an inner div, so clip-path doesn't interfere with the rotation.
  return (
    <div className="relative w-11 h-16 sm:w-14 sm:h-20">
      {/* ===== STATIC TOP HALF: current digit ===== */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        <DigitFace char={current} />
      </div>

      {/* ===== STATIC BOTTOM HALF: current digit ===== */}
      <div
        className="absolute inset-0 bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        <DigitFace char={current} />
      </div>

      {/* ===== ANIMATED TOP FLAP: old digit folds down ===== */}
      {/* Outer div clips to top half. Inner div does the 3D rotation. */}
      {/* This separation is critical: clip-path on a rotating element */}
      {/* clips the rotated result, hiding the animation. */}
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
            {/* Darken as it folds away */}
            <div
              className="absolute inset-0 bg-black opacity-0"
              style={{ animation: 'flip-shadow-in 0.3s linear forwards' }}
            />
          </div>
        </div>
      )}

      {/* ===== ANIMATED BOTTOM FLAP: new digit unfolds ===== */}
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
            {/* Lighten as it unfolds */}
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
