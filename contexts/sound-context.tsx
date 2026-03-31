'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { storage } from '@/lib/storage';

export type SoundType = 'completion' | 'phaseChange' | 'warning' | 'start';
export type VibrationPattern = 'gentle' | 'medium' | 'strong' | 'urgent';

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type: SoundType) => void;
  playCompletionSound: () => void;
  vibrate: (pattern: VibrationPattern) => void;
  requestNotificationPermission: () => Promise<boolean>;
  sendNotification: (title: string, body: string) => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

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

function createSounds(ctx: AudioContext): Record<SoundType, () => void> {
  return {
    // Pleasant ascending three-note chime (C5-E5-G5)
    completion: () => {
      playTone(ctx, [{ freq: 523, time: 0 }], 0.3, 'sine', 0.12);
      playTone(ctx, [{ freq: 659, time: 0.15 }], 0.3, 'sine', 0.12);
      playTone(ctx, [{ freq: 784, time: 0.30 }], 0.5, 'sine', 0.15);
    },

    // Two-tone transition sound
    phaseChange: () => {
      playTone(ctx, [
        { freq: 440, time: 0 },
        { freq: 660, time: 0.15 },
      ], 0.4, 'sine', 0.1);
    },

    // Two quick alert pulses
    warning: () => {
      playTone(ctx, [{ freq: 880, time: 0 }], 0.15, 'triangle', 0.12);
      playTone(ctx, [{ freq: 880, time: 0.2 }], 0.15, 'triangle', 0.12);
    },

    // Soft confirmation click
    start: () => {
      playTone(ctx, [{ freq: 600, time: 0 }, { freq: 800, time: 0.05 }], 0.15, 'sine', 0.08);
    },
  };
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundsRef = useRef<Record<SoundType, () => void> | null>(null);

  // Create a persistent AudioContext on first user interaction
  useEffect(() => {
    function initAudio() {
      if (audioCtxRef.current) {
        // Resume if suspended (iOS requirement)
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        return;
      }
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        soundsRef.current = createSounds(ctx);
      } catch {
        // AudioContext not available
      }
    }

    // Resume/init on any user gesture — required for iOS
    const events = ['touchstart', 'touchend', 'click', 'keydown'];
    events.forEach(e => document.addEventListener(e, initAudio, { once: false, passive: true }));

    return () => {
      events.forEach(e => document.removeEventListener(e, initAudio));
    };
  }, []);

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
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // Resume if suspended (can happen after iOS background)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    try {
      if (soundsRef.current) {
        soundsRef.current[type]();
      }
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }, [soundEnabled]);

  const playCompletionSound = useCallback(() => {
    playSound('completion');
  }, [playSound]);

  const vibrate = useCallback((pattern: VibrationPattern) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;
    const patterns: Record<VibrationPattern, number | number[]> = {
      gentle: [50, 50, 50],
      medium: [100, 50, 100, 50, 100],
      strong: [200, 100, 200, 100, 200, 100, 200],
      urgent: [300, 100, 300, 100, 300, 100, 300, 100, 300],
    };
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      // vibrate may throw on some browsers
    }
  }, []);

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
      vibrate,
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
