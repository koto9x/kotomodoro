'use client';

import { useState, useEffect, useRef } from 'react';
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
  use24HourTime,
  onSetTargetTime,
}: TargetTimePickerProps) {
  const mounted = useRef(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    mounted.current = true;
    setCurrentDate(new Date());
    const interval = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, []);

  // Force re-render input when time format changes
  useEffect(() => {
    setInputKey(prev => prev + 1);
  }, [use24HourTime]);

  return (
    <div className={cn(
      "w-full max-w-xs mx-auto transition-all duration-300",
      isPomodoroMode ? "opacity-0 invisible h-0" : "opacity-100 visible"
    )}>
      <Input
        id="datetime-input"
        key={inputKey}
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
      <div className="text-sm text-muted-foreground mt-2 text-center w-full">
        Current Time: {currentDate ? format(currentDate, use24HourTime ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd hh:mm:ss a') : ''}
      </div>
    </div>
  );
}
