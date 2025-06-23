import React, { useEffect, useState } from 'react';
import { getCompletedPomodoros, getToken } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const LOCAL_STATS_KEY = 'pomodoro-stats';

type LocalPomodoroEntry = { timestamp: string };

function loadLocalStats(): LocalPomodoroEntry[] {
  const raw = localStorage.getItem(LOCAL_STATS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.filter(e => e && typeof e.timestamp === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

export function getLocalStatsCount(): number {
  return loadLocalStats().length;
}

export function getLocalStatsEntries(): LocalPomodoroEntry[] {
  return loadLocalStats();
}

export function incrementLocalStats() {
  const current = loadLocalStats();
  current.push({ timestamp: new Date().toISOString() });
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(current));
}

const Stats: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = Boolean(getToken());

  useEffect(() => {
    setError(null);
    setLoading(true);
    if (isLoggedIn) {
      getCompletedPomodoros()
        .then((data) => setCount(data.count))
        .catch((err) => {
          if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
            setError((err as { message: string }).message);
          } else {
            setError('Failed to load stats');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setCount(getLocalStatsCount());
      setLoading(false);
    }
  }, [isLoggedIn]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-center">Loading...</div>}
        {error && <div className="text-destructive text-center">{error}</div>}
        {count !== null && !loading && !error && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-bold">{count}</div>
            <div className="text-muted-foreground">Completed Pomodoros</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Stats; 