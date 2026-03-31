'use client';

import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/lib/timer-types';

interface UrgencyStatusProps {
  targetDate: Date | null;
  isRunning: boolean;
  isPomodoroMode: boolean;
  urgencyLevel: UrgencyLevel;
}

const URGENCY_BAR_COLORS: Record<UrgencyLevel, string> = {
  normal: 'bg-emerald-500',
  notice: 'bg-blue-500',
  warning: 'bg-amber-500',
  urgent: 'bg-orange-500',
  critical: 'bg-red-500',
};

const URGENCY_BAR_BG: Record<UrgencyLevel, string> = {
  normal: 'bg-emerald-500/10',
  notice: 'bg-blue-500/10',
  warning: 'bg-amber-500/10',
  urgent: 'bg-orange-500/10',
  critical: 'bg-red-500/10',
};

const URGENCY_TEXT_COLORS: Record<UrgencyLevel, string> = {
  normal: 'text-emerald-400/60',
  notice: 'text-blue-400/60',
  warning: 'text-amber-400/60',
  urgent: 'text-orange-400/60',
  critical: 'text-red-400/60',
};

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  normal: 'plenty of time',
  notice: 'coming up',
  warning: 'getting close',
  urgent: 'almost time',
  critical: 'now',
};

function getProgressPercent(targetDate: Date): number {
  const remaining = targetDate.getTime() - Date.now();
  if (remaining <= 0) return 100;
  const totalWindow = 60 * 60 * 1000;
  const elapsed = totalWindow - Math.min(remaining, totalWindow);
  return Math.round((elapsed / totalWindow) * 100);
}

export function UrgencyStatus({
  targetDate,
  isRunning,
  isPomodoroMode,
  urgencyLevel,
}: UrgencyStatusProps) {
  if (isPomodoroMode || !isRunning || !targetDate) return null;

  const progress = getProgressPercent(targetDate);

  return (
    <div className="w-full space-y-1.5">
      <div className={cn(
        "w-full h-1 rounded-full overflow-hidden transition-colors duration-1000",
        URGENCY_BAR_BG[urgencyLevel],
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-linear",
            URGENCY_BAR_COLORS[urgencyLevel],
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={cn(
        "text-xs font-mono text-center transition-colors duration-1000",
        URGENCY_TEXT_COLORS[urgencyLevel],
      )}>
        {URGENCY_LABELS[urgencyLevel]}
      </div>
    </div>
  );
}
