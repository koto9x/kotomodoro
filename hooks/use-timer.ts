'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { addMinutes, differenceInMilliseconds } from 'date-fns';
import { useSound } from '@/contexts/sound-context';
import { getTimeUnits, getUrgencyLevel } from '@/lib/timer-utils';
import { storage } from '@/lib/storage';
import type { TimeUnit, UrgencyLevel, PomodoroPhase, TimerSettings } from '@/lib/timer-types';
import { DEFAULT_TIMER_SETTINGS } from '@/lib/timer-types';

export interface UseTimerReturn {
  timeLeft: TimeUnit[];
  isRunning: boolean;
  isPomodoroMode: boolean;
  pomodoroPhase: PomodoroPhase;
  pomodoroCount: number;
  urgencyLevel: UrgencyLevel;
  currentTask: string;
  settings: TimerSettings;
  targetDate: Date | null;
  showWorkEndCue: boolean;
  showBreakEndCue: boolean;

  setCurrentTask: (task: string) => void;
  updateSettings: (s: Partial<TimerSettings>) => void;
  startPomodoro: () => void;
  initializePomodoro: () => void;
  stopPomodoro: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  skipToNextPhase: () => void;
  setTargetTime: (date: Date) => void;
  stopCountdown: () => void;
}

export function useTimer(): UseTimerReturn {
  const { playCompletionSound } = useSound();
  const mounted = useRef(false);
  const remainingMsRef = useRef<number | null>(null);

  // Initialize from persisted storage
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeUnit[]>([]);
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>('normal');
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>('work');
  const [currentTask, setCurrentTask] = useState('');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [showWorkEndCue, setShowWorkEndCue] = useState(false);
  const [showBreakEndCue, setShowBreakEndCue] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_TIMER_SETTINGS);

  const updateSettings = useCallback((partial: Partial<TimerSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      storage.saveTimerSettings(next);
      return next;
    });
  }, []);

  const pauseTimer = useCallback(() => {
    if (targetDate) {
      const remaining = Math.max(0, targetDate.getTime() - Date.now());
      remainingMsRef.current = remaining;
      // Persist session state when pausing in pomodoro mode
      if (isPomodoroMode) {
        storage.saveSessionState({
          remainingMs: remaining,
          pomodoroPhase: pomodoroPhase,
          pomodoroCount: pomodoroCount,
          currentTask: currentTask,
          savedAt: Date.now(),
        });
      }
    }
    setIsRunning(false);
  }, [targetDate, isPomodoroMode, pomodoroPhase, pomodoroCount, currentTask]);

  const initializePomodoro = useCallback(() => {
    setIsPomodoroMode(true);
    setPomodoroPhase('work');
    setPomodoroCount(0);
    const now = new Date();
    const newTarget = addMinutes(now, settings.pomodoroLength);
    setTargetDate(newTarget);
    remainingMsRef.current = null;
    storage.clearSessionState();
    setTimeLeft(getTimeUnits(settings.pomodoroLength * 60 * 1000, true));
    setIsRunning(true);
  }, [settings.pomodoroLength]);

  const stopPomodoro = useCallback(() => {
    setIsPomodoroMode(false);
    setIsRunning(false);
    setPomodoroPhase('work');
    remainingMsRef.current = null;
    storage.clearSessionState();
  }, []);

  const startBreak = useCallback(() => {
    setPomodoroPhase('break');
    const now = new Date();
    const newTarget = addMinutes(now, settings.shortBreakLength);
    setTargetDate(newTarget);
    remainingMsRef.current = null;
    setTimeLeft(getTimeUnits(settings.shortBreakLength * 60 * 1000, true));
  }, [settings.shortBreakLength]);

  const startNextPomodoro = useCallback(() => {
    setPomodoroPhase('work');
    const now = new Date();
    const newTarget = addMinutes(now, settings.pomodoroLength);
    setTargetDate(newTarget);
    remainingMsRef.current = null;
    setTimeLeft(getTimeUnits(settings.pomodoroLength * 60 * 1000, true));
  }, [settings.pomodoroLength]);

  const resumeTimer = useCallback(() => {
    const remaining = remainingMsRef.current;
    if (remaining !== null && remaining > 0) {
      const now = new Date();
      const newTarget = new Date(now.getTime() + remaining);
      setTargetDate(newTarget);
      setTimeLeft(getTimeUnits(remaining, isPomodoroMode));
    }
    remainingMsRef.current = null;
    storage.clearSessionState();
    setIsRunning(true);
  }, [isPomodoroMode]);

  const skipToNextPhase = useCallback(() => {
    if (pomodoroPhase === 'work') {
      startBreak();
      if (settings.autoStartBreaks) setIsRunning(true);
    } else {
      startNextPomodoro();
      if (settings.autoStartPomodoros) setIsRunning(true);
    }
    storage.clearSessionState();
  }, [pomodoroPhase, startBreak, startNextPomodoro, settings.autoStartBreaks, settings.autoStartPomodoros]);

  const setTargetTime = useCallback((date: Date) => {
    const timeLeftMs = differenceInMilliseconds(date, new Date());
    if (timeLeftMs > 0) {
      setUrgencyLevel(getUrgencyLevel(timeLeftMs));
      setTargetDate(date);
      setTimeLeft(getTimeUnits(timeLeftMs, false));
      setIsPomodoroMode(false);
      remainingMsRef.current = null;
      setIsRunning(true);
    }
  }, []);

  const stopCountdown = useCallback(() => {
    setIsRunning(false);
    remainingMsRef.current = null;
  }, []);

  // Initialize from storage on mount
  useEffect(() => {
    mounted.current = true;

    // Load persisted settings
    const savedSettings = storage.getTimerSettings();
    setSettings(savedSettings);

    // Check for a saved pomodoro session
    const savedSession = storage.getSessionState();
    if (savedSession) {
      // Session is still valid if saved less than 2 hours ago
      const age = Date.now() - savedSession.savedAt;
      if (age < 2 * 60 * 60 * 1000 && savedSession.remainingMs > 0) {
        setIsPomodoroMode(true);
        setPomodoroPhase(savedSession.pomodoroPhase);
        setPomodoroCount(savedSession.pomodoroCount);
        setCurrentTask(savedSession.currentTask);
        remainingMsRef.current = savedSession.remainingMs;
        const now = new Date();
        const newTarget = new Date(now.getTime() + savedSession.remainingMs);
        setTargetDate(newTarget);
        setTimeLeft(getTimeUnits(savedSession.remainingMs, true));
        // Don't auto-resume - let user click resume
        return () => { mounted.current = false; };
      } else {
        storage.clearSessionState();
      }
    }

    // Default display
    const now = new Date();
    const initialMs = savedSettings.pomodoroLength * 60 * 1000;
    const initialTarget = addMinutes(now, savedSettings.pomodoroLength);
    setTargetDate(initialTarget);
    setTimeLeft(getTimeUnits(initialMs, false));

    return () => { mounted.current = false; };
  }, []);

  // Main countdown interval
  useEffect(() => {
    if (!isRunning || !targetDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeLeftMs = Math.max(0, targetDate.getTime() - now.getTime());

      if (!isPomodoroMode) {
        setUrgencyLevel(getUrgencyLevel(timeLeftMs));
      }

      setTimeLeft(getTimeUnits(timeLeftMs, isPomodoroMode));

      if (timeLeftMs <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        remainingMsRef.current = null;
        playCompletionSound();

        if (isPomodoroMode) {
          if (pomodoroPhase === 'work') {
            setShowWorkEndCue(true);
            setTimeout(() => setShowWorkEndCue(false), 1000);
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);

            // Record completed work session
            storage.addCompletedSession({
              task: currentTask,
              phase: 'work',
              duration: settings.pomodoroLength,
              completedAt: Date.now(),
            });

            if (newCount >= settings.targetPomodoroCount) {
              stopPomodoro();
              setCurrentTask('');
              return;
            }

            startBreak();
            if (settings.autoStartBreaks) setIsRunning(true);
          } else {
            setShowBreakEndCue(true);
            setTimeout(() => setShowBreakEndCue(false), 1000);

            storage.addCompletedSession({
              task: currentTask,
              phase: 'break',
              duration: settings.shortBreakLength,
              completedAt: Date.now(),
            });

            startNextPomodoro();
            if (settings.autoStartPomodoros) setIsRunning(true);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isRunning, isPomodoroMode, pomodoroPhase, settings, pomodoroCount, currentTask, startBreak, startNextPomodoro, playCompletionSound, stopPomodoro]);

  return {
    timeLeft,
    isRunning,
    isPomodoroMode,
    pomodoroPhase,
    pomodoroCount,
    urgencyLevel,
    currentTask,
    settings,
    targetDate,
    showWorkEndCue,
    showBreakEndCue,
    setCurrentTask,
    updateSettings,
    startPomodoro: useCallback(() => {}, []),
    initializePomodoro,
    stopPomodoro,
    pauseTimer,
    resumeTimer,
    skipToNextPhase,
    setTargetTime,
    stopCountdown,
  };
}
