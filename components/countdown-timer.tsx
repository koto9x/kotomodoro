'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, CheckCircle2, XCircle, Volume2, VolumeX } from 'lucide-react';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSound } from '@/contexts/sound-context';
import { useTimer } from '@/hooks/use-timer';
import { storage } from '@/lib/storage';
import { AnimatePresence, motion } from 'framer-motion';
import type { DisplaySettings } from '@/lib/timer-types';

import { TimerDisplay } from './timer-display';
import { TimerControls } from './timer-controls';
import { PomodoroStatus } from './pomodoro-status';
import { TargetTimePicker } from './target-time-picker';
import { SettingsPanel } from './settings-panel';

const CountdownTimer = () => {
  const { soundEnabled, toggleSound } = useSound();
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => storage.getDisplaySettings());
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const timer = useTimer();

  // Update current time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const updateDisplaySettings = useCallback((partial: Partial<DisplaySettings>) => {
    setDisplaySettings(prev => {
      const next = { ...prev, ...partial };
      storage.saveDisplaySettings(next);
      return next;
    });
  }, []);

  const handleStartPomodoro = () => {
    setShowTaskDialog(true);
  };

  const handleConfirmPomodoro = () => {
    setShowTaskDialog(false);
    timer.initializePomodoro();
  };

  return (
    <div className={cn(
      "flex flex-col items-center w-full min-h-screen p-4 transition-colors duration-1000",
      timer.isPomodoroMode && "bg-background",
      !timer.isPomodoroMode && {
        "bg-background": timer.urgencyLevel === 'normal',
        "bg-blue-950/20 dark:bg-blue-900/20": timer.urgencyLevel === 'notice',
        "bg-amber-950/20 dark:bg-amber-900/20": timer.urgencyLevel === 'warning',
        "bg-orange-950/30 dark:bg-orange-900/30": timer.urgencyLevel === 'urgent',
        "bg-red-950/40 dark:bg-red-900/40": timer.urgencyLevel === 'critical',
      }
    )}>
      {/* Top bar: sound + settings */}
      <Sheet>
        <SheetTrigger asChild>
          <div className="absolute top-6 right-4 flex gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 sm:h-10 sm:w-10"
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
            >
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 sm:h-4 sm:w-4" />
              ) : (
                <VolumeX className="h-5 w-5 sm:h-4 sm:w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 sm:h-10 sm:w-10"
            >
              <Settings2 className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </SheetTrigger>
        <SettingsPanel
          settings={timer.settings}
          displaySettings={displaySettings}
          onUpdateSettings={timer.updateSettings}
          onUpdateDisplaySettings={updateDisplaySettings}
        />
      </Sheet>

      {/* Task dialog for Pomodoro */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="w-[90vw] max-w-[400px] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl text-center">
              What are you working on?
            </DialogTitle>
            <DialogDescription className="text-center text-base sm:text-sm">
              Name your task to help stay focused during this Pomodoro session.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-6 py-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmPomodoro();
            }}
          >
            <Input
              aria-label="Task description"
              placeholder="e.g., Write documentation"
              value={timer.currentTask}
              onChange={(e) => timer.setCurrentTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmPomodoro();
                }
              }}
              className="h-12 text-base px-4 rounded-lg"
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="h-12 text-base w-full sm:w-auto order-2 sm:order-1"
                onClick={() => {
                  setShowTaskDialog(false);
                  timer.setCurrentTask('');
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 text-base w-full sm:w-auto order-1 sm:order-2"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Start Pomodoro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Phase transition visual cues */}
      <AnimatePresence>
        {timer.showWorkEndCue && (
          <motion.div
            className="fixed inset-0 bg-red-500/20 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {timer.showBreakEndCue && (
          <motion.div
            className="fixed inset-0 bg-green-500/20 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* Main content - vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto gap-4">
        {/* Pomodoro status badge */}
        {timer.isPomodoroMode && (
          <PomodoroStatus
            isRunning={timer.isRunning}
            pomodoroPhase={timer.pomodoroPhase}
            pomodoroCount={timer.pomodoroCount}
            targetCount={timer.settings.targetPomodoroCount}
          />
        )}

        {/* Current time above flip clock */}
        <div className="text-sm font-mono text-zinc-500 tracking-wider">
          {currentTime ? format(currentTime, displaySettings.use24HourTime ? 'HH:mm:ss' : 'hh:mm:ss a') : ''}
        </div>

        {/* Flip clock display */}
        <TimerDisplay
          timeLeft={timer.timeLeft}
          showSeconds={displaySettings.showSeconds}
        />

        {/* Task input (pomodoro mode) */}
        {timer.isPomodoroMode && (
          <div className="w-full">
            <Input
              placeholder="What are you working on?"
              value={timer.currentTask}
              onChange={(e) => timer.setCurrentTask(e.target.value)}
              className="text-center h-12 sm:h-10 text-base sm:text-sm"
            />
          </div>
        )}

        {/* Control buttons */}
        <TimerControls
          isPomodoroMode={timer.isPomodoroMode}
          isRunning={timer.isRunning}
          pomodoroPhase={timer.pomodoroPhase}
          onStartPomodoro={handleStartPomodoro}
          onPause={timer.pauseTimer}
          onResume={timer.resumeTimer}
          onSkip={timer.skipToNextPhase}
          onStop={timer.stopPomodoro}
          onStopCountdown={timer.stopCountdown}
        />

        {/* Target time picker */}
        <TargetTimePicker
          targetDate={timer.targetDate}
          isPomodoroMode={timer.isPomodoroMode}
          onSetTargetTime={timer.setTargetTime}
        />
      </div>

      {/* Current date/time pinned near bottom */}
      <div className="pb-6 pt-4">
        <div className="text-xs font-mono text-zinc-600 text-center">
          {currentTime ? format(currentTime, displaySettings.use24HourTime ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd hh:mm:ss a') : ''}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
