'use client';

import { cn } from '@/lib/utils';
import type { PomodoroPhase } from '@/lib/timer-types';

interface PomodoroStatusProps {
  isRunning: boolean;
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number;
  targetCount: number;
}

export function PomodoroStatus({
  isRunning,
  pomodoroPhase,
  pomodoroCount,
  targetCount,
}: PomodoroStatusProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={cn(
        "px-2 py-1 rounded-full text-xs font-medium",
        pomodoroPhase === 'work' && isRunning && "bg-red-500/20 text-red-500",
        pomodoroPhase === 'break' && isRunning && "bg-green-500/20 text-green-500",
        !isRunning && "bg-zinc-500/20 text-zinc-500"
      )}>
        {!isRunning ? "Paused" : pomodoroPhase === 'work' ? "Work" : "Break"}
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {pomodoroCount + 1}/{targetCount}
      </span>
    </div>
  );
}
