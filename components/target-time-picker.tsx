'use client';

import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TargetTimePickerProps {
  targetDate: Date | null;
  isPomodoroMode: boolean;
  onSetTargetTime: (date: Date) => void;
}

export function TargetTimePicker({
  targetDate,
  isPomodoroMode,
  onSetTargetTime,
}: TargetTimePickerProps) {
  const mounted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  if (isPomodoroMode) return null;

  return (
    <div className="w-full">
      <label
        htmlFor="datetime-input"
        className="text-xs font-mono text-zinc-500 mb-1.5 flex items-center gap-1.5 pl-1"
      >
        <CalendarClock className="w-3 h-3" />
        Target Time
      </label>
      <input
        ref={inputRef}
        id="datetime-input"
        type="datetime-local"
        onChange={(e) => {
          if (!mounted.current) return;
          const newDate = new Date(e.target.value);
          if (!isNaN(newDate.getTime())) {
            onSetTargetTime(newDate);
          }
        }}
        className={cn(
          "w-full h-12 sm:h-10 px-4 py-2 rounded-md",
          "text-base sm:text-sm font-mono",
          "bg-background text-foreground",
          "border border-input",
          "appearance-none",
          "box-border",
        )}
        style={{ maxWidth: '100%' }}
        value={targetDate ? format(targetDate, "yyyy-MM-dd'T'HH:mm") : ''}
      />
    </div>
  );
}
