import type { TimeUnit, UrgencyLevel } from './timer-types';

export function getUrgencyLevel(timeLeftMs: number): UrgencyLevel {
  if (timeLeftMs <= 5 * 60 * 1000) return 'critical';
  if (timeLeftMs <= 15 * 60 * 1000) return 'urgent';
  if (timeLeftMs <= 30 * 60 * 1000) return 'warning';
  if (timeLeftMs <= 60 * 60 * 1000) return 'notice';
  return 'normal';
}

export function getTimeUnits(timeLeftMs: number, pomodoroMode: boolean): TimeUnit[] {
  const days = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((timeLeftMs % (60 * 1000)) / 1000);

  const units: TimeUnit[] = [
    { value: days, label: 'days', show: days > 0 },
    { value: hours, label: 'hours', show: hours > 0 || days > 0 },
    { value: minutes, label: 'minutes', show: true },
    { value: seconds, label: 'seconds', show: true },
  ];

  if (pomodoroMode) {
    return units.filter(unit => ['minutes', 'seconds'].includes(unit.label));
  }

  return units;
}
