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

export function TargetTimeHeader({
  targetDate,
  isRunning,
  isPomodoroMode,
  urgencyLevel,
  use24HourTime,
}: TargetTimeHeaderProps) {
  if (isPomodoroMode || !isRunning || !targetDate) return null;

  const timeFormat = use24HourTime ? 'HH:mm' : 'h:mm a';
  const formattedTarget = format(targetDate, timeFormat);
  const isToday = new Date().toDateString() === targetDate.toDateString();
  const formattedDate = isToday ? 'today' : format(targetDate, 'EEE, MMM d');

  return (
    <div className="text-center">
      <div className={cn(
        "text-2xl sm:text-3xl font-mono font-bold tracking-wider transition-colors duration-1000",
        URGENCY_TEXT_COLORS[urgencyLevel],
      )}>
        {formattedTarget}
      </div>
      <div className="text-xs font-mono text-zinc-500 mt-0.5">
        {formattedDate}
      </div>
    </div>
  );
}
