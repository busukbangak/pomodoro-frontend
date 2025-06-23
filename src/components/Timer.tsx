import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', duration: 3  },
  { key: 'short', label: 'Short Break', duration: 5 * 60 },
  { key: 'long', label: 'Long Break', duration: 15 * 60 },
];

type ModeKey = 'pomodoro' | 'short' | 'long';

export default function Timer() {
  const [mode, setMode] = useState<ModeKey>('pomodoro');
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Update timer when mode changes
  useEffect(() => {
    const selected = MODES.find((m) => m.key === mode)!;
    setSecondsLeft(selected.duration);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [mode]);

  // Timer countdown logic
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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    if (!isRunning && secondsLeft === 0) {
      // If timer is at 0, reset to mode duration and start
      const selected = MODES.find((m) => m.key === mode)!;
      setSecondsLeft(selected.duration);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    const selected = MODES.find((m) => m.key === mode)!;
    setSecondsLeft(selected.duration);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
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
    </div>
  );
} 