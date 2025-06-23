import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { getSettings, saveSettings, getToken } from '../lib/api';
import type { UserSettings } from '../lib/api';

const LOCAL_KEY = 'pomodoro-settings';
const DEFAULTS: UserSettings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreak: false,
  autoStartPomodoro: false,
};

export function loadLocalSettings(): UserSettings {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveLocalSettings(settings: UserSettings) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
}

const Settings: React.FC = () => {
  const [pomodoroDuration, setPomodoroDuration] = useState(DEFAULTS.pomodoroDuration);
  const [shortBreakDuration, setShortBreakDuration] = useState(DEFAULTS.shortBreakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(DEFAULTS.longBreakDuration);
  const [autoStartBreak, setAutoStartBreak] = useState(DEFAULTS.autoStartBreak);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(DEFAULTS.autoStartPomodoro);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = Boolean(getToken());

  // Load settings on mount or login state change
  useEffect(() => {
    setError(null);
    setLoading(true);
    if (isLoggedIn) {
      getSettings()
        .then((settings: UserSettings) => {
          setPomodoroDuration(settings.pomodoroDuration);
          setShortBreakDuration(settings.shortBreakDuration);
          setLongBreakDuration(settings.longBreakDuration);
          setAutoStartBreak(settings.autoStartBreak);
          setAutoStartPomodoro(settings.autoStartPomodoro);
        })
        .catch(() => setError('Failed to load settings'))
        .finally(() => setLoading(false));
    } else {
      const settings = loadLocalSettings();
      setPomodoroDuration(settings.pomodoroDuration);
      setShortBreakDuration(settings.shortBreakDuration);
      setLongBreakDuration(settings.longBreakDuration);
      setAutoStartBreak(settings.autoStartBreak);
      setAutoStartPomodoro(settings.autoStartPomodoro);
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const settings: UserSettings = {
      pomodoroDuration,
      shortBreakDuration,
      longBreakDuration,
      autoStartBreak,
      autoStartPomodoro,
    };
    try {
      if (isLoggedIn) {
        await saveSettings(settings);
      } else {
        saveLocalSettings(settings);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div className="grid gap-3">
            <Label htmlFor="pomodoro">Pomodoro Duration (minutes)</Label>
            <Input
              id="pomodoro"
              type="number"
              min={1}
              value={pomodoroDuration}
              onChange={e => setPomodoroDuration(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="shortBreak">Short Break Duration (minutes)</Label>
            <Input
              id="shortBreak"
              type="number"
              min={1}
              value={shortBreakDuration}
              onChange={e => setShortBreakDuration(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="longBreak">Long Break Duration (minutes)</Label>
            <Input
              id="longBreak"
              type="number"
              min={1}
              value={longBreakDuration}
              onChange={e => setLongBreakDuration(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="autoStartBreak" checked={autoStartBreak} onCheckedChange={setAutoStartBreak} disabled={loading} />
            <Label htmlFor="autoStartBreak">Auto-start break after Pomodoro</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="autoStartPomodoro" checked={autoStartPomodoro} onCheckedChange={setAutoStartPomodoro} disabled={loading} />
            <Label htmlFor="autoStartPomodoro">Auto-start Pomodoro after break</Label>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
          {saved && <div className="text-green-600 text-center text-sm">Settings saved!</div>}
          {error && <div className="text-destructive text-center text-sm">{error}</div>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  );
};

export default Settings; 