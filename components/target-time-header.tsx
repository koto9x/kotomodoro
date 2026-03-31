'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { UrgencyLevel } from '@/lib/timer-types';

interface TargetTimeHeaderProps {
  targetDate: Date | null;
  isRunning: boolean;
  isPomodoroMode: boolean;
  urgencyLevel: UrgencyLevel;
  use24HourTime: boolean;
}

const URGENCY_TEXT_COLORS: Record<UrgencyLevel, string> = {
  normal: 'text-emerald-400',
  notice: 'text-blue-400',
  warning: 'text-amber-400',
  urgent: 'text-orange-400',
  critical: 'text-red-400',
};

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
  // Map: >60min = 0%, 0min = 100%
  const totalWindow = 60 * 60 * 1000; // 1 hour window
  const elapsed = totalWindow - Math.min(remaining, totalWindow);
  return Math.round((elapsed / totalWindow) * 100);
}

export function TargetTimeHeader({
  targetDate,
  isRunning,
  isPomodoroMode,
  urgencyLevel,
  use24HourTime,
}: TargetTimeHeaderProps) {
  // Don't show when in pomodoro mode or no active countdown
  if (isPomodoroMode || !isRunning || !targetDate) return null;

  const timeFormat = use24HourTime ? 'HH:mm' : 'h:mm a';
  const formattedTarget = format(targetDate, timeFormat);
  const formattedDate = format(targetDate, 'EEE, MMM d');
  const isToday = new Date().toDateString() === targetDate.toDateString();
  const progress = getProgressPercent(targetDate);

  return (
    <div className="w-full space-y-2">
      {/* Target time display */}
      <div className="text-center">
        <div className={cn(
          "text-2xl sm:text-3xl font-mono font-bold tracking-wider transition-colors duration-1000",
          URGENCY_TEXT_COLORS[urgencyLevel],
        )}>
          {formattedTarget}
        </div>
        <div className="text-xs font-mono text-zinc-500 mt-0.5">
          {isToday ? 'today' : formattedDate}
          <span className="mx-2">·</span>
          <span className={cn(
            "transition-colors duration-1000",
            URGENCY_TEXT_COLORS[urgencyLevel],
          )}>
            {URGENCY_LABELS[urgencyLevel]}
          </span>
        </div>
      </div>

      {/* Progress bar */}
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
    </div>
  );
}
