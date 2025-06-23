import React, { useEffect, useState } from 'react';
import { getCompletedPomodoros, getAllCompletedPomodoros, getToken } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const LOCAL_STATS_KEY = 'pomodoro-stats';

type LocalPomodoroEntry = { 
  timestamp: string;
  pomodoroDuration: number;
};

function loadLocalStats(): LocalPomodoroEntry[] {
  const raw = localStorage.getItem(LOCAL_STATS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.filter(e => e && typeof e.timestamp === 'string' && typeof e.pomodoroDuration === 'number');
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

export function getLocalStatsTotalDuration(): number {
  return loadLocalStats().reduce((total, entry) => total + entry.pomodoroDuration, 0);
}

export function incrementLocalStats(pomodoroDuration: number) {
  const current = loadLocalStats();
  current.push({ 
    timestamp: new Date().toISOString(),
    pomodoroDuration
  });
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(current));
}

const Stats: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = Boolean(getToken());

  useEffect(() => {
    setError(null);
    setLoading(true);
    if (isLoggedIn) {
      Promise.all([
        getCompletedPomodoros(),
        getAllCompletedPomodoros()
      ])
        .then(([countData, allData]) => {
          setCount(countData.count);
          const total = allData.reduce((sum: number, entry: { timestamp: string; pomodoroDuration: number }) => sum + entry.pomodoroDuration, 0);
          setTotalDuration(total);
        })
        .catch((err) => {
          if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
            setError((err as { message: string }).message);
          } else {
            setError('Failed to load stats');
          }
        })
        .finally(() => setLoading(false));
    } else {
      const localEntries = loadLocalStats();
      setCount(localEntries.length);
      setTotalDuration(localEntries.reduce((total, entry) => total + entry.pomodoroDuration, 0));
      setLoading(false);
    }
  }, [isLoggedIn]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-center">Loading...</div>}
        {error && <div className="text-destructive text-center">{error}</div>}
        {count !== null && totalDuration !== null && !loading && !error && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl font-bold">{count}</div>
              <div className="text-muted-foreground">Completed Pomodoros</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl font-bold">{formatDuration(totalDuration)}</div>
              <div className="text-muted-foreground">Total Focus Time</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Stats; 