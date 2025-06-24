import React, { useEffect, useState } from 'react';
import { getCompletedPomodoros, getAllCompletedPomodoros, getToken } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useRefresh, isMergePendingStorage } from '../contexts/RefreshContext';

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
  const [count, setCount] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = Boolean(getToken());
  const { refreshKey } = useRefresh();

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
          const validEntries = Array.isArray(allData)
            ? allData.filter((e: unknown): e is { timestamp: string; pomodoroDuration: number } =>
                typeof e === 'object' &&
                e !== null &&
                'timestamp' in e &&
                typeof (e as { timestamp: string }).timestamp === 'string' &&
                'pomodoroDuration' in e &&
                typeof (e as { pomodoroDuration: number }).pomodoroDuration === 'number')
            : [];
          const total = validEntries.reduce((sum, entry) => sum + entry.pomodoroDuration, 0);
          setTotalDuration(total);
          if (!isMergePendingStorage()) {
            localStorage.setItem('pomodoro-stats', JSON.stringify(validEntries));
          }
        })
        .catch((err) => {
          function isLocalPomodoroEntry(e: unknown): e is LocalPomodoroEntry {
            return (
              typeof e === 'object' &&
              e !== null &&
              'timestamp' in e &&
              typeof (e as { timestamp: string }).timestamp === 'string' &&
              'pomodoroDuration' in e &&
              typeof (e as { pomodoroDuration: number }).pomodoroDuration === 'number'
            );
          }
          const localEntriesRaw = loadLocalStats();
          const localEntries: LocalPomodoroEntry[] = Array.isArray(localEntriesRaw)
            ? localEntriesRaw.filter(isLocalPomodoroEntry)
            : [];
          setCount(localEntries.length);
          setTotalDuration(localEntries.reduce((total, entry) => total + entry.pomodoroDuration, 0));
          
          if (!navigator.onLine) {
            setError('Offline mode: showing local stats');
          } else if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
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
  }, [isLoggedIn, refreshKey, isMergePendingStorage()]);

  useEffect(() => {
    const handleOffline = () => {
      if (error && error.includes('Failed to load stats')) {
        setError('Offline mode: showing local stats');
      }
    };
    const handleOnline = () => {
      if (error && error.includes('Offline mode')) {
        setError(null);
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [error]);

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
        {count !== null && totalDuration !== null && !loading && (
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
        {error && <div className="text-destructive text-center mt-6">{error}</div>}
      </CardContent>
    </Card>
  );
};

export default Stats; 