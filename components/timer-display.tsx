'use client';

import { FlipDigit } from './flip-digit';
import type { TimeUnit } from '@/lib/timer-types';

interface TimerDisplayProps {
  timeLeft: TimeUnit[];
  showSeconds: boolean;
}

export function TimerDisplay({ timeLeft, showSeconds }: TimerDisplayProps) {
  const visibleUnits = timeLeft.filter(
    (unit) => (unit.label !== 'seconds' || showSeconds) && unit.show
  );
  // Scale down when 4+ unit groups visible (days + hours + minutes + seconds)
  const compact = visibleUnits.length >= 4;

  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {timeLeft.map((unit) => (
          <FlipDigit
            key={unit.label}
            digit={unit.value}
            unit={unit.label}
            visible={(unit.label !== 'seconds' || showSeconds) && unit.show}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
