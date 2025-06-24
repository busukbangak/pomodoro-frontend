import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { getToken, getSettings } from '../lib/api';
import type { UserSettings } from '../lib/api';
import { incrementLocalStats, getLocalStatsEntries } from '../pages/Stats';
import { loadLocalSettings } from '../pages/Settings';
import { mergeUserSyncData, getUserSyncData } from '../lib/api';
import { isMergePendingStorage } from '../contexts/RefreshContext';

const DEFAULTS = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreak: false,
  autoStartPomodoro: false,
};

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro' },
  { key: 'short', label: 'Short Break' },
  { key: 'long', label: 'Long Break' },
];

type ModeKey = 'pomodoro' | 'short' | 'long';

export default function Timer() {
  const [mode, setMode] = useState<ModeKey>('pomodoro');
  const [durations, setDurations] = useState({
    pomodoro: DEFAULTS.pomodoroDuration * 60,
    short: DEFAULTS.shortBreakDuration * 60,
    long: DEFAULTS.longBreakDuration * 60,
  });
  const [autoStartBreak, setAutoStartBreak] = useState(DEFAULTS.autoStartBreak);
  const [autoStartPomodoro, setAutoStartPomodoro] = useState(DEFAULTS.autoStartPomodoro);
  const [secondsLeft, setSecondsLeft] = useState(durations.pomodoro);
  const [isRunning, setIsRunning] = useState(false);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Fetch user settings on mount and when login state changes
  useEffect(() => {
    if (getToken()) {
      getSettings()
        .then((settings: UserSettings) => {
          setDurations({
            pomodoro: settings.pomodoroDuration < 1
              ? Math.round(settings.pomodoroDuration * 60)
              : (settings.pomodoroDuration || DEFAULTS.pomodoroDuration) * 60,
            short: settings.shortBreakDuration < 1
              ? Math.round(settings.shortBreakDuration * 60)
              : (settings.shortBreakDuration || DEFAULTS.shortBreakDuration) * 60,
            long: settings.longBreakDuration < 1
              ? Math.round(settings.longBreakDuration * 60)
              : (settings.longBreakDuration || DEFAULTS.longBreakDuration) * 60,
          });
          setAutoStartBreak(settings.autoStartBreak ?? DEFAULTS.autoStartBreak);
          setAutoStartPomodoro(settings.autoStartPomodoro ?? DEFAULTS.autoStartPomodoro);
        })
        .catch(() => {
          // Always fall back to local settings on any error, not just offline
          const settings = loadLocalSettings();
          setDurations({
            pomodoro: settings.pomodoroDuration < 1
              ? Math.round(settings.pomodoroDuration * 60)
              : (settings.pomodoroDuration || DEFAULTS.pomodoroDuration) * 60,
            short: settings.shortBreakDuration < 1
              ? Math.round(settings.shortBreakDuration * 60)
              : (settings.shortBreakDuration || DEFAULTS.shortBreakDuration) * 60,
            long: settings.longBreakDuration < 1
              ? Math.round(settings.longBreakDuration * 60)
              : (settings.longBreakDuration || DEFAULTS.longBreakDuration) * 60,
          });
          setAutoStartBreak(settings.autoStartBreak ?? DEFAULTS.autoStartBreak);
          setAutoStartPomodoro(settings.autoStartPomodoro ?? DEFAULTS.autoStartPomodoro);
        });
    } else {
      const settings = loadLocalSettings();
      setDurations({
        pomodoro: settings.pomodoroDuration < 1
          ? Math.round(settings.pomodoroDuration * 60)
          : (settings.pomodoroDuration || DEFAULTS.pomodoroDuration) * 60,
        short: settings.shortBreakDuration < 1
          ? Math.round(settings.shortBreakDuration * 60)
          : (settings.shortBreakDuration || DEFAULTS.shortBreakDuration) * 60,
        long: settings.longBreakDuration < 1
          ? Math.round(settings.longBreakDuration * 60)
          : (settings.longBreakDuration || DEFAULTS.longBreakDuration) * 60,
      });
      setAutoStartBreak(settings.autoStartBreak ?? DEFAULTS.autoStartBreak);
      setAutoStartPomodoro(settings.autoStartPomodoro ?? DEFAULTS.autoStartPomodoro);
    }
    // eslint-disable-next-line
  }, [getToken()]);

  // Update timer when mode or durations change
  useEffect(() => {
    setSecondsLeft(durations[mode]);
    if (!pendingAutoStart) {
      setIsRunning(false);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setMessage(null);
  }, [mode, durations]);

  // Handle pending auto-start after mode change
  useEffect(() => {
    if (pendingAutoStart) {
      setIsRunning(true);
      setPendingAutoStart(false);
    }
  }, [mode, pendingAutoStart]);

  // Timer countdown logic with auto-start
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          clearInterval(intervalRef.current!);
          // Only trigger if prev === 1 (not 0)
          if (mode === 'pomodoro' && prev === 1) {
            incrementLocalStats(durations.pomodoro / 60);
            setMessage('Pomodoro recorded!');
            if (getToken() && navigator.onLine) {
              // Sync only unsynced local stats (without _id) to backend
              const localStats = getLocalStatsEntries();
              function hasId(entry: object): entry is { _id: string } {
                return typeof (entry as { _id?: unknown })._id === 'string';
              }
              const unsynced = localStats.filter(entry => !hasId(entry));
              if (unsynced.length > 0) {
                mergeUserSyncData({ stats: { completed: unsynced } }).then(() => {
                  getUserSyncData().then(({ stats }) => {
                    if (!isMergePendingStorage()) {
                      localStorage.setItem('pomodoro-stats', JSON.stringify(stats.completed));
                    }
                  });
                });
              }
            }
            // Auto-start break if enabled
            if (autoStartBreak) {
              setMode('short');
              setPendingAutoStart(true);
            }
          } else if ((mode === 'short' || mode === 'long') && autoStartPomodoro) {
            setMode('pomodoro');
            setPendingAutoStart(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, autoStartBreak, autoStartPomodoro]);

  const handleStartStop = () => {
    if (!isRunning && secondsLeft === 0) {
      // If timer is at 0, reset to mode duration and start
      setSecondsLeft(durations[mode]);
      setIsRunning(true);
      setMessage(null);
      return;
    }
    setIsRunning((prev) => !prev);
    setMessage(null);
  };

  const handleReset = () => {
    setSecondsLeft(durations[mode]);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMessage(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {MODES.map((m) => (
          <Button
            key={m.key}
            variant={mode === m.key ? 'default' : 'ghost'}
            onClick={() => setMode(m.key as ModeKey)}
            className="capitalize"
          >
            {m.label}
          </Button>
        ))}
      </div>
      <div className="text-6xl font-mono tabular-nums select-none">
        {formatTime(secondsLeft)}
      </div>
      <div className="flex gap-4">
        <Button onClick={handleStartStop}>
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
      {message && <div className="text-sm text-center mt-2 text-muted-foreground">{message}</div>}
    </div>
  );
} 