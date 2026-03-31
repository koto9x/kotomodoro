export type UrgencyLevel = 'normal' | 'notice' | 'warning' | 'urgent' | 'critical';

export type PomodoroPhase = 'work' | 'break';

export interface TimeUnit {
  value: number;
  label: string;
  show: boolean;
}

export interface TimerSettings {
  pomodoroLength: number;
  shortBreakLength: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  targetPomodoroCount: number;
}

export interface DisplaySettings {
  showSeconds: boolean;
  use24HourTime: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoroLength: 25,
  shortBreakLength: 5,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  targetPomodoroCount: 4,
};

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showSeconds: true,
  use24HourTime: true,
};
