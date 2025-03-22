'use client';

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { FlipDigit } from './flip-digit';
import { differenceInSeconds, addMinutes, format, addHours, differenceInMilliseconds } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, Timer, Play, Pause, CheckCircle2, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Clock, AlarmClockOff as ClockOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound, SoundType } from '@/contexts/sound-context';
import { AnimatePresence, motion } from 'framer-motion';

const DEFAULT_POMODORO_LENGTH = 25;

function useIsomorphicLayoutEffect(effect: () => void | (() => void), deps?: React.DependencyList) {
  const isBrowser = typeof window !== 'undefined';
  
  if (isBrowser) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useLayoutEffect(effect, deps);
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useEffect(effect, deps);
}

type UrgencyLevel = 'normal' | 'notice' | 'warning' | 'urgent' | 'critical';

function getUrgencyLevel(timeLeftMs: number): UrgencyLevel {
  if (timeLeftMs <= 5 * 60 * 1000) return 'critical';
  if (timeLeftMs <= 15 * 60 * 1000) return 'urgent';
  if (timeLeftMs <= 30 * 60 * 1000) return 'warning';
  if (timeLeftMs <= 60 * 60 * 1000) return 'notice';
  return 'normal';
}

interface TimeUnit {
  value: number;
  label: string;
  show: boolean;
}

function getTimeUnits(timeLeftMs: number): TimeUnit[] {
  const days = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
  
  const units = [
    { value: days, label: 'days', show: days > 0 },
    { value: hours, label: 'hours', show: hours > 0 || days > 0 },
    { value: minutes, label: 'minutes', show: true },
    { value: seconds, label: 'seconds', show: true }
  ];
  
  // Filter out unnecessary units for Pomodoro mode
  if (window.__POMODORO_MODE) {
    return units.filter(unit => ['minutes', 'seconds'].includes(unit.label));
  }
  
  return units;
}

const CountdownTimer = () => {
  const mounted = useRef(false);
  const { soundEnabled, toggleSound, playCompletionSound } = useSound();
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('normal');
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [showSeconds, setShowSeconds] = useState(false);
  const [use24HourTime, setUse24HourTime] = useState(true);
  const [inputKey, setInputKey] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showWorkEndCue, setShowWorkEndCue] = useState(false);
  const [showBreakEndCue, setShowBreakEndCue] = useState(false);
  const [settings, setSettings] = useState({
    pomodoroLength: DEFAULT_POMODORO_LENGTH, // in minutes
    shortBreakLength: 5,
    autoStartBreaks: true,
    autoStartPomodoros: true,
    targetPomodoroCount: 4,
  });

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const startPomodoro = useCallback(() => {
    setShowTaskDialog(true);
  }, []);

  const initializePomodoro = useCallback(() => {
    setIsPomodoroMode(true);
    setPomodoroPhase('work');
    setPomodoroCount(0);
    window.__POMODORO_MODE = true;
    const newTarget = addMinutes(new Date(), settings.pomodoroLength);
    setTargetDate(newTarget);
    const timeLeftMs = settings.pomodoroLength * 60 * 1000;
    setTimeLeft(getTimeUnits(timeLeftMs));
    setIsRunning(true);
    startTimer();
  }, [settings.pomodoroLength]);

  const stopPomodoro = useCallback(() => {
    setIsPomodoroMode(false);
    setIsRunning(false);
    setPomodoroPhase('work');
    window.__POMODORO_MODE = false;
  }, []);

  const startBreak = useCallback(() => {
    setPomodoroPhase('break');
    setIsRunning(false);
    const now = new Date();
    const newTarget = addMinutes(now, settings.shortBreakLength);
    setTargetDate(newTarget);
    setTimeLeft(getTimeUnits(settings.shortBreakLength * 60 * 1000));
  }, [settings.shortBreakLength, settings.autoStartBreaks]);

  const startNextPomodoro = useCallback(() => {
    setPomodoroPhase('work');
    setIsRunning(false);
    const now = new Date();
    const newTarget = addMinutes(now, settings.pomodoroLength);
    setTargetDate(newTarget);
    setTimeLeft(getTimeUnits(settings.pomodoroLength * 60 * 1000));
  }, [settings.pomodoroLength]);

  const resumeTimer = useCallback(() => {
    const now = new Date();
    const timeLeftMs = targetDate ? Math.max(0, targetDate.getTime() - now.getTime()) : 0;
    const duration = pomodoroPhase === 'work' ? settings.pomodoroLength : settings.shortBreakLength;
    const newTarget = addMinutes(now, duration);
    setTargetDate(newTarget);
    setTimeLeft(getTimeUnits(duration * 60 * 1000));
    setIsRunning(true);
  }, [targetDate, pomodoroPhase, settings.pomodoroLength, settings.shortBreakLength]);

  const skipToNextPhase = useCallback(() => {
    if (pomodoroPhase === 'work') {
      startBreak();
    } else {
      startNextPomodoro();
    }
  }, [pomodoroPhase, startBreak, startNextPomodoro]);

  useEffect(() => {
    // Initialize dates after component mounts
    const now = new Date();
    const initialTimeLeftMs = DEFAULT_POMODORO_LENGTH * 60 * 1000;
    setCurrentDate(now);
    const initialTarget = addMinutes(now, DEFAULT_POMODORO_LENGTH);
    setTargetDate(initialTarget);
    setTimeLeft(getTimeUnits(initialTimeLeftMs));
  }, []);

  useIsomorphicLayoutEffect(() => {
    // Update current time
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentDate(now);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted.current) return;

    if (!isRunning || !mounted.current || !targetDate) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const timeLeftMs = Math.max(0, targetDate.getTime() - now.getTime());
      
      if (!isPomodoroMode) {
        setUrgencyLevel(getUrgencyLevel(timeLeftMs));
      }
      
      const newTimeUnits = getTimeUnits(timeLeftMs);
      setTimeLeft(newTimeUnits);

      if (timeLeftMs === 0) {
        clearInterval(interval);
        setIsRunning(false);
        playCompletionSound();

        if (isPomodoroMode) {
          if (pomodoroPhase === 'work') {
            setShowWorkEndCue(true);
            setTimeout(() => setShowWorkEndCue(false), 1000);
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);
            
            if (newCount >= settings.targetPomodoroCount) {
              stopPomodoro();
              setCurrentTask('');
              return;
            }
            
            startBreak();
            if (settings.autoStartBreaks) {
              setIsRunning(true);
            }
          } else {
            setShowBreakEndCue(true);
            setTimeout(() => setShowBreakEndCue(false), 1000);
            
            startNextPomodoro();
            if (settings.autoStartPomodoros) {
              setIsRunning(true);
            }
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isRunning, isPomodoroMode, pomodoroPhase, settings.autoStartPomodoros, settings.targetPomodoroCount, pomodoroCount, startBreak, startPomodoro, playCompletionSound, stopPomodoro, settings.autoStartBreaks, initializePomodoro]);

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full min-h-screen p-4 space-y-4 transition-colors duration-1000",
      isPomodoroMode && "bg-background",
      !isPomodoroMode && {
        "bg-background": urgencyLevel === 'normal',
        "bg-blue-950/20 dark:bg-blue-900/20": urgencyLevel === 'notice',
        "bg-amber-950/20 dark:bg-amber-900/20": urgencyLevel === 'warning',
        "bg-orange-950/30 dark:bg-orange-900/30": urgencyLevel === 'urgent',
        "bg-red-950/40 dark:bg-red-900/40": urgencyLevel === 'critical',
      }
    )}>
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
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Pomodoro Sessions</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-pomodoros">Target Sessions</Label>
                  <Input
                    id="target-pomodoros"
                    type="number"
                    min="1"
                    max="12"
                    value={settings.targetPomodoroCount}
                    onChange={(e) => setSettings({
                      ...settings,
                      targetPomodoroCount: Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pomodoro Timer</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work-duration">Work (minutes)</Label>
                  <Input
                    id="work-duration"
                    type="number"
                    min="1" 
                    max="1440"
                    value={settings.pomodoroLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      pomodoroLength: Math.min(1440, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {settings.pomodoroLength >= 60 && (
                      `${Math.floor(settings.pomodoroLength / 60)}h ${settings.pomodoroLength % 60}m`
                    )}
                  </span>
                </div>
                <div>
                  <Label htmlFor="break-duration">Break (minutes)</Label>
                  <Input
                    id="break-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakLength}
                    onChange={(e) => setSettings({
                      ...settings,
                      shortBreakLength: Math.min(60, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-seconds">Show Seconds</Label>
              <Switch
                id="show-seconds"
                checked={showSeconds}
                onCheckedChange={setShowSeconds}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="24hour-time">Use 24-hour Time</Label>
              <Switch
                id="24hour-time"
                checked={use24HourTime}
                onCheckedChange={(checked) => {
                  setUse24HourTime(checked);
                  setInputKey(prev => prev + 1); // Force input to re-render with new format
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-breaks">Auto-start Breaks</Label>
              <Switch
                id="auto-start-breaks"
                checked={settings.autoStartBreaks}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoStartBreaks: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-start-pomodoros">Auto-start Pomodoros</Label>
              <Switch
                id="auto-start-pomodoros"
                checked={settings.autoStartPomodoros}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoStartPomodoros: checked })
                }
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
              setShowTaskDialog(false);
              initializePomodoro();
            }}
          >
            <Input
              aria-label="Task description"
              placeholder="e.g., Write documentation"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowTaskDialog(false);
                  initializePomodoro();
                }
              }}
              className="h-12 text-base px-4 rounded-lg"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button 
                type="button"
                variant="ghost" 
                className="h-12 text-base w-full sm:w-auto order-2 sm:order-1"
                onClick={() => {
                setShowTaskDialog(false);
                setCurrentTask('');
              }}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 text-base w-full sm:w-auto order-1 sm:order-2"
                onClick={() => {
                setShowTaskDialog(false);
                initializePomodoro();
              }}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Start Pomodoro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {showWorkEndCue && (
          <motion.div
            className="fixed inset-0 bg-red-500/20 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        {showBreakEndCue && (
          <motion.div
            className="fixed inset-0 bg-green-500/20 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {isPomodoroMode && (
        <div className="flex items-center justify-center gap-2">
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            pomodoroPhase === 'work' && isRunning && "bg-red-500/20 text-red-500",
            pomodoroPhase === 'break' && isRunning && "bg-green-500/20 text-green-500",
            !isRunning && "bg-zinc-500/20 text-zinc-500"
          )}>
            {!isRunning ? "Ready" : pomodoroPhase === 'work' ? "Work" : "Break"}
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {pomodoroCount + 1}/{settings.targetPomodoroCount}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-4">
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {timeLeft.map((unit, index) => (
          <FlipDigit
            key={unit.label}
            digit={unit.value}
            unit={unit.label}
            visible={(unit.label !== 'seconds' || showSeconds) && unit.show}
          />
        ))}
        </div>
      </div>

      {isPomodoroMode && (
        <div className="w-full max-w-md mb-6">
          <Input
            placeholder="What are you working on?"
            value={currentTask}
            onChange={(e) => setCurrentTask(e.target.value)}
            className="text-center h-12 sm:h-10 text-base sm:text-sm"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md">
        {/* Primary Action Button */}
        {isPomodoroMode ? (
          isRunning ? (
            <Button
              variant="secondary"
              className={cn(
                "h-12 sm:h-10 text-base sm:text-sm",
                pomodoroPhase === 'work' ? 'bg-red-500/10 hover:bg-red-500/20' : 'bg-green-500/10 hover:bg-green-500/20'
              )}
              onClick={pauseTimer}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause {pomodoroPhase === 'work' ? 'Work' : 'Break'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={resumeTimer}
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
            onClick={startPomodoro}
          >
            <Timer className="w-4 h-4 mr-2" />
            Pomodoro
          </Button>
        )}

        {/* Skip Button - Only show when paused in Pomodoro mode */}
        {isPomodoroMode && !isRunning && (
          <Button
            variant="outline"
            className="h-12 sm:h-10 text-base sm:text-sm"
            onClick={skipToNextPhase}
          >
            Skip to {pomodoroPhase === 'work' ? 'Break' : 'Work'}
          </Button>
        )}

        {/* Stop/Reset Button - Only show in Pomodoro mode */}
        {isPomodoroMode && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive h-12 sm:h-10 text-base sm:text-sm"
            onClick={stopPomodoro}
          >
            Stop Session
          </Button>
        )}

        {/* Target Time Mode Button */}
        <Button
          variant={!isPomodoroMode ? "secondary" : "outline"}
          className="h-12 sm:h-10 text-base sm:text-sm"
          onClick={() => setIsPomodoroMode(false)}
        >
          <Clock className="w-4 h-4 mr-2" />
          Target Time
        </Button>
      </div>

      <div className={cn("w-full max-w-xs mx-auto transition-all duration-300", isPomodoroMode ? "opacity-0 invisible" : "opacity-100 visible")}>
        <Input
          id="datetime-input"
          key={inputKey}
          type="datetime-local"
          onChange={(e) => {
            if (!mounted.current) return;
            const newDate = new Date(e.target.value);
            if (!isNaN(newDate.getTime())) {
              const timeLeftMs = differenceInMilliseconds(newDate, new Date());
              setUrgencyLevel(getUrgencyLevel(timeLeftMs));
              setTargetDate(newDate);
              setTimeLeft(getTimeUnits(timeLeftMs));
            }
            setIsPomodoroMode(false);
          }}
          className="w-full text-base sm:text-sm h-12 sm:h-10 px-4 py-2 bg-background border rounded-md"
          value={targetDate ? format(targetDate, "yyyy-MM-dd'T'HH:mm") : ''}
        />
        <div className="text-sm text-muted-foreground mt-2 text-center w-full">
          Current Time: {currentDate ? format(currentDate, use24HourTime ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd hh:mm:ss a') : ''}
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;