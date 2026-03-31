'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';

export type SoundType = 'completion' | 'phaseChange' | 'warning' | 'start';

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type: SoundType) => void;
  playCompletionSound: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string) => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

// Synthesized sounds using Web Audio API
function playTone(
  ctx: AudioContext,
  frequencies: { freq: number; time: number }[],
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;

  for (const { freq, time } of frequencies) {
    osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

const SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  // Pleasant ascending three-note chime (C5-E5-G5)
  completion: (ctx) => {
    playTone(ctx, [{ freq: 523, time: 0 }], 0.3, 'sine', 0.12);
    setTimeout(() => {
      const ctx2 = getAudioContext();
      if (ctx2) playTone(ctx2, [{ freq: 659, time: 0 }], 0.3, 'sine', 0.12);
    }, 150);
    setTimeout(() => {
      const ctx3 = getAudioContext();
      if (ctx3) playTone(ctx3, [{ freq: 784, time: 0 }], 0.5, 'sine', 0.15);
    }, 300);
  },

  // Two-tone transition sound
  phaseChange: (ctx) => {
    playTone(ctx, [
      { freq: 440, time: 0 },
      { freq: 660, time: 0.15 },
    ], 0.4, 'sine', 0.1);
  },

  // Two quick alert pulses
  warning: (ctx) => {
    playTone(ctx, [{ freq: 880, time: 0 }], 0.15, 'triangle', 0.12);
    setTimeout(() => {
      const ctx2 = getAudioContext();
      if (ctx2) playTone(ctx2, [{ freq: 880, time: 0 }], 0.15, 'triangle', 0.12);
    }, 200);
  },

  // Soft confirmation click
  start: (ctx) => {
    playTone(ctx, [{ freq: 600, time: 0 }, { freq: 800, time: 0.05 }], 0.15, 'sine', 0.08);
  },
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(storage.getSoundEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      storage.saveSoundEnabled(next);
      return next;
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      SOUNDS[type](ctx);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }, [soundEnabled]);

  const playCompletionSound = useCallback(() => {
    playSound('completion');
  }, [playSound]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // Only send when tab is not visible
    if (!document.hidden) return;
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon-192x192.png',
        tag: 'kotomodoro-timer',
      });
    } catch {
      // Notification constructor may fail in some contexts
    }
  }, []);

  return (
    <SoundContext.Provider value={{
      soundEnabled,
      toggleSound,
      playSound,
      playCompletionSound,
      requestNotificationPermission,
      sendNotification,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
