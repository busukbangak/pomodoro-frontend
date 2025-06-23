import React, { useEffect, useState } from 'react';
import { getCompletedPomodoros, getToken } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const Stats: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoggedIn = Boolean(getToken());

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
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
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Please log in to view your statistics.</div>
        </CardContent>
      </Card>
    );
  }

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