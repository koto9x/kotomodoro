import type { TimerSettings, DisplaySettings } from './timer-types';
import { DEFAULT_TIMER_SETTINGS, DEFAULT_DISPLAY_SETTINGS } from './timer-types';

export interface SavedSession {
  remainingMs: number;
  pomodoroPhase: 'work' | 'break';
  pomodoroCount: number;
  currentTask: string;
  savedAt: number; // timestamp
}

export interface CompletedSession {
  task: string;
  phase: 'work' | 'break';
  duration: number; // minutes
  completedAt: number; // timestamp
}

// Abstract interface - swap in cloud sync later
export interface TimerStorage {
  getTimerSettings(): TimerSettings;
  saveTimerSettings(s: TimerSettings): void;
  getDisplaySettings(): DisplaySettings;
  saveDisplaySettings(s: DisplaySettings): void;
  getSoundEnabled(): boolean;
  saveSoundEnabled(enabled: boolean): void;
  getSessionState(): SavedSession | null;
  saveSessionState(s: SavedSession): void;
  clearSessionState(): void;
  addCompletedSession(s: CompletedSession): void;
  getHistory(): CompletedSession[];
}

const KEYS = {
  timerSettings: 'kotomodoro:timerSettings',
  displaySettings: 'kotomodoro:displaySettings',
  soundEnabled: 'kotomodoro:soundEnabled',
  sessionState: 'kotomodoro:sessionState',
  history: 'kotomodoro:history',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export const storage: TimerStorage = {
  getTimerSettings() {
    return { ...DEFAULT_TIMER_SETTINGS, ...safeGet(KEYS.timerSettings, {}) };
  },
  saveTimerSettings(s) {
    safeSet(KEYS.timerSettings, s);
  },
  getDisplaySettings() {
    return { ...DEFAULT_DISPLAY_SETTINGS, ...safeGet(KEYS.displaySettings, {}) };
  },
  saveDisplaySettings(s) {
    safeSet(KEYS.displaySettings, s);
  },
  getSoundEnabled() {
    return safeGet(KEYS.soundEnabled, true);
  },
  saveSoundEnabled(enabled) {
    safeSet(KEYS.soundEnabled, enabled);
  },
  getSessionState() {
    return safeGet<SavedSession | null>(KEYS.sessionState, null);
  },
  saveSessionState(s) {
    safeSet(KEYS.sessionState, s);
  },
  clearSessionState() {
    try { localStorage.removeItem(KEYS.sessionState); } catch {}
  },
  addCompletedSession(s) {
    const history = this.getHistory();
    history.push(s);
    // Keep last 100 sessions
    if (history.length > 100) history.splice(0, history.length - 100);
    safeSet(KEYS.history, history);
  },
  getHistory() {
    return safeGet<CompletedSession[]>(KEYS.history, []);
  },
};
