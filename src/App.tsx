import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Pomodoro from './pages/Home';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Authentication from './pages/Authentication';
import { Button } from './components/ui/button';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/mode-toggle';
import { getToken, clearToken, getSettings, saveSettings, getAllCompletedPomodoros, addCompletedPomodorosWithTimestamps, resetCompletedPomodoros } from './lib/api';
import React from 'react';
import { Dialog, DialogContent } from './components/ui/dialog';
import { LogIn, LogOut } from 'lucide-react';
import type { UserSettings } from './lib/api';
import { getLocalStatsEntries } from './pages/Stats';

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

  React.useEffect(() => {
    setIsLoggedIn(Boolean(getToken()));
  }, [location]);

  const handleSignOut = () => {
    clearToken();
    setIsLoggedIn(false);
    setAuthOpen(false);
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
    setIsLoggedIn(true);
    setAuthOpen(false);
    // Check for local settings
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const local: UserSettings = JSON.parse(raw);
        const backend: UserSettings = await getSettings();
        if (settingsDiffer(local, backend)) {
          setMergeDiff({ local, backend });
          setMergePromptOpen(true);
        }
      } catch {}
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
        }
      }
    } catch {}
  };

  // Merge action: overwrite backend with local
  const handleMergeSettings = async () => {
    if (mergeDiff) {
      await saveSettings(mergeDiff.local);
      setMergePromptOpen(false);
      setMergeDiff(null);
    }
  };

  // Skip action: just close prompt
  const handleSkipMerge = () => {
    setMergePromptOpen(false);
    setMergeDiff(null);
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

  // Merge action: add only unique local entries to backend
  const handleMergeStats = async () => {
    try {
      const localEntries = getLocalStatsEntries();
      const backendEntries = await getAllCompletedPomodoros();
      const backendTimestamps = new Set(backendEntries.map(e => new Date(e.timestamp).toISOString()));
      const uniqueLocal = localEntries.filter(e => !backendTimestamps.has(new Date(e.timestamp).toISOString()));
      if (uniqueLocal.length > 0) {
        await addCompletedPomodorosWithTimestamps(uniqueLocal);
      }
      localStorage.removeItem(LOCAL_STATS_KEY);
    } catch {}
    setMergeStatsPromptOpen(false);
    setMergeStatsDiff(null);
  };

  // Replace action: reset backend and add all local entries
  const handleReplaceStats = async () => {
    try {
      const localEntries = getLocalStatsEntries();
      await resetCompletedPomodoros();
      if (localEntries.length > 0) {
        await addCompletedPomodorosWithTimestamps(localEntries);
      }
      localStorage.removeItem(LOCAL_STATS_KEY);
    } catch {}
    setMergeStatsPromptOpen(false);
    setMergeStatsDiff(null);
  };

  // Skip action: just close prompt
  const handleSkipMergeStats = () => {
    setMergeStatsPromptOpen(false);
    setMergeStatsDiff(null);
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
              <Button onClick={handleReplaceStats} variant="destructive">Replace (Use Local)</Button>
              <Button onClick={handleSkipMergeStats} variant="outline">Skip</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}

export default App;