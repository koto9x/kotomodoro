'use client';

import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TargetTimePickerProps {
  targetDate: Date | null;
  isPomodoroMode: boolean;
  use24HourTime: boolean;
  onSetTargetTime: (date: Date) => void;
}

export function TargetTimePicker({
  targetDate,
  isPomodoroMode,
  onSetTargetTime,
}: TargetTimePickerProps) {
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  return (
    <div className={cn(
      "w-full transition-all duration-300",
      isPomodoroMode ? "opacity-0 invisible h-0" : "opacity-100 visible"
    )}>
      <Input
        id="datetime-input"
        type="datetime-local"
        onChange={(e) => {
          if (!mounted.current) return;
          const newDate = new Date(e.target.value);
          if (!isNaN(newDate.getTime())) {
            onSetTargetTime(newDate);
          }
        }}
        className="w-full text-base sm:text-sm h-12 sm:h-10 px-4 py-2 bg-background border rounded-md"
        value={targetDate && !isPomodoroMode ? format(targetDate, "yyyy-MM-dd'T'HH:mm") : ''}
      />
    </div>
  );
}
