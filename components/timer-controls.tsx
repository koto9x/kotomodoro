'use client';

import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, SkipForward, Square, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PomodoroPhase } from '@/lib/timer-types';

interface TimerControlsProps {
  isPomodoroMode: boolean;
  isRunning: boolean;
  pomodoroPhase: PomodoroPhase;
  onStartPomodoro: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onStop: () => void;
  onStopCountdown: () => void;
}

export function TimerControls({
  isPomodoroMode,
  isRunning,
  pomodoroPhase,
  onStartPomodoro,
  onPause,
  onResume,
  onSkip,
  onStop,
  onStopCountdown,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md">
      {isPomodoroMode ? (
        isRunning ? (
          <Button
            variant="secondary"
            className={cn(
              "h-12 sm:h-10 text-base sm:text-sm",
              pomodoroPhase === 'work' ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-green-500/10 hover:bg-green-500/20'
            )}
            onClick={onPause}
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause {pomodoroPhase === 'work' ? 'Work' : 'Break'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={onResume}
            className={cn(
              "h-12 sm:h-10 text-base sm:text-sm",
              pomodoroPhase === 'work' ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-green-500/10 hover:bg-green-500/20'
            )}
          >
            <Play className="w-4 h-4 mr-2" />
            Resume {pomodoroPhase === 'work' ? 'Work' : 'Break'}
          </Button>
        )
      ) : (
        <Button
          variant="outline"
          className="h-12 sm:h-10 text-base sm:text-sm"
          onClick={onStartPomodoro}
        >
          <Timer className="w-4 h-4 mr-2" />
          Pomodoro
        </Button>
      )}

      {isPomodoroMode && !isRunning && (
        <Button
          variant="outline"
          className="h-12 sm:h-10 text-base sm:text-sm"
          onClick={onSkip}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Skip to {pomodoroPhase === 'work' ? 'Break' : 'Work'}
        </Button>
      )}

      {isPomodoroMode && (
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive h-12 sm:h-10 text-base sm:text-sm"
          onClick={onStop}
        >
          <Square className="w-4 h-4 mr-2" />
          Stop Session
        </Button>
      )}

      {!isPomodoroMode && (
        <Button
          variant="secondary"
          className="h-12 sm:h-10 text-base sm:text-sm"
          onClick={onStopCountdown}
          disabled={!isRunning}
        >
          <Clock className="w-4 h-4 mr-2" />
          {isRunning ? 'Stop Countdown' : 'Set Target Below'}
        </Button>
      )}
    </div>
  );
}
