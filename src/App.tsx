import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Pomodoro from './pages/Home';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Authentication from './pages/Authentication';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { getToken, clearToken, getSettings, getAllCompletedPomodoros, getUserSyncData, mergeUserSyncData } from './lib/api';
import React, { useEffect } from 'react';
import { Dialog, DialogContent } from './components/ui/dialog';
import { LogIn, LogOut } from 'lucide-react';
import type { UserSettings } from './lib/api';
import { getLocalStatsEntries } from './pages/Stats';
import { loadLocalSettings } from './pages/Settings';
import { useRefresh, isMergePendingStorage } from './contexts/RefreshContext';

const navLinks = [
  { to: '/', label: 'Pomodoro' },
  { to: '/stats', label: 'Stats' },
  { to: '/settings', label: 'Settings' },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(Boolean(getToken()));
  const [authOpen, setAuthOpen] = React.useState(false);
  const [mergePromptOpen, setMergePromptOpen] = React.useState(false);
  const [mergeDiff, setMergeDiff] = React.useState<{local: UserSettings, backend: UserSettings} | null>(null);
  const LOCAL_KEY = 'pomodoro-settings';
  const LOCAL_STATS_KEY = 'pomodoro-stats';
  const [mergeStatsPromptOpen, setMergeStatsPromptOpen] = React.useState(false);
  const [mergeStatsDiff, setMergeStatsDiff] = React.useState<{local: number, backend: number, uniqueToLocal: number} | null>(null);
  const { triggerRefresh } = useRefresh();

  React.useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, [location]);

  useEffect(() => {
    const handleOnline = async () => {
      triggerRefresh();
      if (isLoggedIn && !isMergePendingStorage()) {
        const localStats = getLocalStatsEntries();
        function hasId(entry: object): entry is { _id: string } {
          return typeof (entry as { _id?: unknown })._id === 'string';
        }
        const unsynced = localStats.filter(entry => !hasId(entry));
        if (unsynced.length > 0) {
          await mergeUserSyncData({ stats: { completed: unsynced } });
          const { stats } = await getUserSyncData();
          if (!isMergePendingStorage()) {
            localStorage.setItem('pomodoro-stats', JSON.stringify(stats.completed));
          }
          triggerRefresh();
        }
        // Settings sync
        const localSettings = loadLocalSettings();
        const { settings: backendSettings } = await getUserSyncData();
        // Compare settings (type-safe)
        const isDifferent =
          localSettings.pomodoroDuration !== backendSettings.pomodoroDuration ||
          localSettings.shortBreakDuration !== backendSettings.shortBreakDuration ||
          localSettings.longBreakDuration !== backendSettings.longBreakDuration ||
          localSettings.autoStartBreak !== backendSettings.autoStartBreak ||
          localSettings.autoStartPomodoro !== backendSettings.autoStartPomodoro;
        if (isDifferent) {
          await mergeUserSyncData({ settings: localSettings });
          const { settings } = await getUserSyncData();
          if (!isMergePendingStorage()) {
            localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
          }
          triggerRefresh();
        }
      }
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isLoggedIn, isMergePendingStorage()]);

  const handleSignOut = () => {
    clearToken();
    setIsLoggedIn(false);
    setAuthOpen(false);
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(LOCAL_STATS_KEY);
    navigate('/');
  };

  // Helper to compare settings
  function settingsDiffer(a: UserSettings, b: UserSettings) {
    return (
      a.pomodoroDuration !== b.pomodoroDuration ||
      a.shortBreakDuration !== b.shortBreakDuration ||
      a.longBreakDuration !== b.longBreakDuration ||
      a.autoStartBreak !== b.autoStartBreak ||
      a.autoStartPomodoro !== b.autoStartPomodoro
    );
  }

  // Called after login/register
  const handleAuthSuccess = async () => {
    // Set merge pending flag immediately to prevent race conditions
    localStorage.setItem('mergePending', '1');
    setIsLoggedIn(true);
    setAuthOpen(false);
    let needsSettingsMerge = false;
    let needsStatsMerge = false;
    // Check for local settings
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const local: UserSettings = JSON.parse(raw);
        const backend: UserSettings = await getSettings();
        if (settingsDiffer(local, backend)) {
          setMergeDiff({ local, backend });
          setMergePromptOpen(true);
          needsSettingsMerge = true;
        }
      } catch { /* ignore, handled by merge prompt logic */ }
    }
    // Stats merge prompt (timestamp-based)
    try {
      const localEntries = getLocalStatsEntries();
      if (localEntries.length > 0) {
        const backendEntries = await getAllCompletedPomodoros();
        const backendTimestamps = new Set(backendEntries.map(e => new Date(e.timestamp).toISOString()));
        const uniqueLocal = localEntries.filter(e => !backendTimestamps.has(new Date(e.timestamp).toISOString()));
        if (uniqueLocal.length > 0) {
          setMergeStatsDiff({
            local: localEntries.length,
            backend: backendEntries.length,
            uniqueToLocal: uniqueLocal.length,
          });
          setMergeStatsPromptOpen(true);
          needsStatsMerge = true;
        }
      }
    } catch { /* ignore, handled by merge prompt logic */ }
    // If neither prompt is needed, clear the flag and sync down
    if (!needsSettingsMerge && !needsStatsMerge) {
      localStorage.removeItem('mergePending');
      await syncDown();
    }
  };

  // Merge action: overwrite backend with local (for settings)
  const handleMergeSettings = async () => {
    if (mergeDiff) {
      const localWithTimestamp = {
        ...mergeDiff.local,
        lastUpdated: new Date().toISOString(),
      };
      await mergeUserSyncData({ settings: localWithTimestamp });
      setMergePromptOpen(false);
      setMergeDiff(null);
      // If no other merge prompt is open, clear flag then sync down
      if (!mergeStatsPromptOpen) {
        localStorage.removeItem('mergePending');
        await syncDown();
        triggerRefresh();
      }
    }
  };

  // Skip action: just close prompt and sync down if needed
  const handleSkipMerge = async () => {
    setMergePromptOpen(false);
    setMergeDiff(null);
    if (!mergeStatsPromptOpen) {
      localStorage.removeItem('mergePending');
      await syncDown();
      triggerRefresh();
    }
  };

  // Optionally: show differences (for now, just a simple list)
  const renderDiff = () => {
    if (!mergeDiff) return null;
    const { local, backend } = mergeDiff;
    const fields: { key: keyof UserSettings; label: string }[] = [
      { key: 'pomodoroDuration', label: 'Pomodoro Duration' },
      { key: 'shortBreakDuration', label: 'Short Break Duration' },
      { key: 'longBreakDuration', label: 'Long Break Duration' },
      { key: 'autoStartBreak', label: 'Auto-start Break' },
      { key: 'autoStartPomodoro', label: 'Auto-start Pomodoro' },
    ];
    return (
      <ul className="text-sm mb-2">
        {fields.map(f => (
          local[f.key] !== backend[f.key] ? (
            <li key={f.key}>
              <b>{f.label}:</b> Local = {String(local[f.key])}, Account = {String(backend[f.key])}
            </li>
          ) : null
        ))}
      </ul>
    );
  };

  // Merge action: add only unique local entries to backend (for stats)
  const handleMergeStats = async () => {
    try {
      const localEntries = getLocalStatsEntries();
      function hasId(entry: object): entry is { _id: string } {
        return typeof (entry as { _id?: unknown })._id === 'string';
      }
      const unsynced = localEntries.filter(entry => !hasId(entry));
      if (unsynced.length > 0) {
        await mergeUserSyncData({ stats: { completed: unsynced } });
      }
      // Only sync down if no other merge prompt is open, clear flag then sync
      if (!mergePromptOpen) {
        localStorage.removeItem('mergePending');
        await syncDown();
        triggerRefresh();
      }
    } catch { /* ignore, handled by merge prompt logic */ }
    setMergeStatsPromptOpen(false);
    setMergeStatsDiff(null);
  };

  // Skip action: just close prompt and sync down if needed
  const handleSkipMergeStats = async () => {
    setMergeStatsPromptOpen(false);
    setMergeStatsDiff(null);
    if (!mergePromptOpen) {
      localStorage.removeItem('mergePending');
      await syncDown();
      triggerRefresh();
    }
  };

  const renderStatsDiff = () => {
    if (!mergeStatsDiff) return null;
    const { local, backend, uniqueToLocal } = mergeStatsDiff;
    return (
      <ul className="text-sm mb-2">
        <li><b>Local:</b> {local} completed Pomodoros</li>
        <li><b>Account:</b> {backend} completed Pomodoros</li>
        <li><b>To Merge:</b> {uniqueToLocal} new from local</li>
      </ul>
    );
  };

  // Helper to sync down latest data from server
  const syncDown = async () => {
    if (isMergePendingStorage()) return; // Do not sync down if merge is pending
    const { settings, stats } = await getUserSyncData();
    if (!isMergePendingStorage()) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
      localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats.completed));
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-svh flex flex-col bg-background">
        <nav className="flex gap-2 p-4 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 items-center">
          {navLinks.map((link) => (
            <Button
              key={link.to}
              asChild
              variant={location.pathname === link.to ? 'default' : 'ghost'}
              className="capitalize"
            >
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
          <div className="flex-1" />
          {!isLoggedIn && (
            <Button variant="outline" className="ml-2" onClick={() => setAuthOpen(true)} aria-label="Login or Register">
              <LogIn className="w-5 h-5" />
            </Button>
          )}
          {isLoggedIn && (
            <Button variant="outline" onClick={handleSignOut} className="ml-2" aria-label="Sign Out">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
          <ModeToggle />
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Routes>
            <Route path="/" element={<Pomodoro />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Dialog open={authOpen} onOpenChange={setAuthOpen}>
          <DialogContent className="max-w-sm p-0">
            <Authentication setIsLoggedIn={setIsLoggedIn} onAuthSuccess={handleAuthSuccess} />
          </DialogContent>
        </Dialog>
        <Dialog open={mergePromptOpen} onOpenChange={setMergePromptOpen}>
          <DialogContent className="max-w-md">
            <div className="mb-2 font-semibold text-lg">Merge Local Settings?</div>
            <div className="mb-2 text-sm text-muted-foreground">
              We found settings saved on this device that differ from your account settings. Would you like to merge them into your account?
            </div>
            {renderDiff()}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleMergeSettings} variant="default">Merge (Use Local)</Button>
              <Button onClick={handleSkipMerge} variant="outline">Skip</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={mergeStatsPromptOpen} onOpenChange={setMergeStatsPromptOpen}>
          <DialogContent className="max-w-md">
            <div className="mb-2 font-semibold text-lg">Merge Local Statistics?</div>
            <div className="mb-2 text-sm text-muted-foreground">
              We found completed Pomodoros saved on this device that are not in your account. Would you like to add them to your account, or replace your account stats with your local stats?
            </div>
            {renderStatsDiff()}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleMergeStats} variant="default">Merge (Add Local)</Button>
              <Button onClick={handleSkipMergeStats} variant="outline">Skip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}

export default App;