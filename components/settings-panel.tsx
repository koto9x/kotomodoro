'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TimerSettings, DisplaySettings } from '@/lib/timer-types';

interface SettingsPanelProps {
  settings: TimerSettings;
  displaySettings: DisplaySettings;
  onUpdateSettings: (s: Partial<TimerSettings>) => void;
  onUpdateDisplaySettings: (s: Partial<DisplaySettings>) => void;
}

export function SettingsPanel({
  settings,
  displaySettings,
  onUpdateSettings,
  onUpdateDisplaySettings,
}: SettingsPanelProps) {
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Settings</SheetTitle>
      </SheetHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label>Pomodoro Sessions</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target-pomodoros">Target Sessions</Label>
              <Input
                id="target-pomodoros"
                type="number"
                min="1"
                max="12"
                value={settings.targetPomodoroCount}
                onChange={(e) => onUpdateSettings({
                  targetPomodoroCount: Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pomodoro Timer</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="work-duration">Work (minutes)</Label>
              <Input
                id="work-duration"
                type="number"
                min="1"
                max="1440"
                value={settings.pomodoroLength}
                onChange={(e) => onUpdateSettings({
                  pomodoroLength: Math.min(1440, Math.max(1, parseInt(e.target.value) || 1))
                })}
              />
              <span className="text-xs text-muted-foreground mt-1 block">
                {settings.pomodoroLength >= 60 && (
                  `${Math.floor(settings.pomodoroLength / 60)}h ${settings.pomodoroLength % 60}m`
                )}
              </span>
            </div>
            <div>
              <Label htmlFor="break-duration">Break (minutes)</Label>
              <Input
                id="break-duration"
                type="number"
                min="1"
                max="60"
                value={settings.shortBreakLength}
                onChange={(e) => onUpdateSettings({
                  shortBreakLength: Math.min(60, Math.max(1, parseInt(e.target.value) || 1))
                })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-seconds">Show Seconds</Label>
          <Switch
            id="show-seconds"
            checked={displaySettings.showSeconds}
            onCheckedChange={(checked) => onUpdateDisplaySettings({ showSeconds: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="24hour-time">Use 24-hour Time</Label>
          <Switch
            id="24hour-time"
            checked={displaySettings.use24HourTime}
            onCheckedChange={(checked) => onUpdateDisplaySettings({ use24HourTime: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-start-breaks">Auto-start Breaks</Label>
          <Switch
            id="auto-start-breaks"
            checked={settings.autoStartBreaks}
            onCheckedChange={(checked) => onUpdateSettings({ autoStartBreaks: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-start-pomodoros">Auto-start Pomodoros</Label>
          <Switch
            id="auto-start-pomodoros"
            checked={settings.autoStartPomodoros}
            onCheckedChange={(checked) => onUpdateSettings({ autoStartPomodoros: checked })}
          />
        </div>
      </div>
    </SheetContent>
  );
}
