'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  playCompletionSound: () => void;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    setSoundEnabled(storage.getSoundEnabled());
  }, []);

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      storage.saveSoundEnabled(next);
      return next;
    });
  };

  const playCompletionSound = () => {
    if (!soundEnabled) return;
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      console.error('Error playing completion sound:', e);
    }
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playCompletionSound }}>
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
