import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { getSettings, saveSettings, getToken, exportServerBackup, importServerBackup } from '../lib/api';
import type { UserSettings } from '../lib/api';
import { useRefresh, isMergePendingStorage } from '../contexts/RefreshContext';
import { exportBackup, importBackup, type BackupData } from '../lib/backup';
import { Download, Upload, AlertTriangle, Clock, Target, Zap } from 'lucide-react';

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
  if (isMergePendingStorage()) return;
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
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoggedIn = Boolean(getToken());
  const { refreshKey, triggerRefresh } = useRefresh();

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
          saveLocalSettings(settings);
        })
        .catch(() => {
          if (!navigator.onLine) {
            setError('No network: offline, cannot sync now.');
            const localSettings = loadLocalSettings();
            setPomodoroDuration(localSettings.pomodoroDuration);
            setShortBreakDuration(localSettings.shortBreakDuration);
            setLongBreakDuration(localSettings.longBreakDuration);
            setAutoStartBreak(localSettings.autoStartBreak);
            setAutoStartPomodoro(localSettings.autoStartPomodoro);
          } else {
            setError('Failed to load settings');
          }
        })
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
  }, [isLoggedIn, refreshKey, isMergePendingStorage()]);

  useEffect(() => {
    const handleOffline = () => setError('No network: offline, cannot sync now.');
    const handleOnline = () => setError(null);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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
      lastUpdated: new Date().toISOString(),
    };
    try {
      saveLocalSettings(settings);
      if (isLoggedIn && navigator.onLine) {
        await saveSettings(settings);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      if (isLoggedIn && navigator.onLine) {
        // Use server backup for logged-in users
        const serverBackup = await exportServerBackup();
        const blob = new Blob([JSON.stringify(serverBackup, null, 2)], {
          type: 'application/json',
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setBackupMessage('Server backup exported successfully!');
      } else {
        // Use local backup for offline or non-logged-in users
        exportBackup();
        setBackupMessage('Local backup exported successfully!');
      }
      setTimeout(() => setBackupMessage(null), 3000);
    } catch {
      setError('Failed to export backup');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackupLoading(true);
    setError(null);
    setBackupMessage(null);

    try {
      const backup = await importBackup(file);
      
      // Store backup and open confirmation dialog
      setPendingBackup(backup);
      setConfirmDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup');
    } finally {
      setBackupLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;

    setBackupLoading(true);
    setError(null);
    setBackupMessage(null);

    try {
      if (isLoggedIn && navigator.onLine) {
        // Use server restore for logged-in users
        await importServerBackup({
          settings: pendingBackup.settings,
          stats: pendingBackup.stats,
        });
        setBackupMessage('Server backup restored successfully!');
        
        // Also save to local storage for consistency
        saveLocalSettings(pendingBackup.settings);
        localStorage.setItem('pomodoro-stats', JSON.stringify(pendingBackup.stats.completed));
      } else {
        // Use local restore for offline or non-logged-in users
        const { restoreFromBackup } = await import('../lib/backup');
        restoreFromBackup(pendingBackup);
        setBackupMessage('Local backup restored successfully!');
      }
      
      // Update form state
      setPomodoroDuration(pendingBackup.settings.pomodoroDuration);
      setShortBreakDuration(pendingBackup.settings.shortBreakDuration);
      setLongBreakDuration(pendingBackup.settings.longBreakDuration);
      setAutoStartBreak(pendingBackup.settings.autoStartBreak);
      setAutoStartPomodoro(pendingBackup.settings.autoStartPomodoro);
      
      // Trigger refresh to update other components
      triggerRefresh();
      
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setBackupLoading(false);
      setConfirmDialogOpen(false);
      setPendingBackup(null);
    }
  };

  const handleCancelRestore = () => {
    setConfirmDialogOpen(false);
    setPendingBackup(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
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

          {/* Backup Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportBackup}
                disabled={backupLoading}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup
              </Button>
              
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                  disabled={backupLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={backupLoading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {backupLoading ? 'Importing...' : 'Import Backup'}
                </Button>
              </div>
              
              {backupMessage && (
                <div className="text-green-600 text-center text-sm flex items-center justify-center gap-1">
                  <span>✓</span>
                  {backupMessage}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground text-center mt-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Importing will replace your current settings and stats
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter />
      </Card>

      {/* Backup Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Backup Restore
            </DialogTitle>
            <DialogDescription>
              This will replace your current settings and stats with the backup data.
            </DialogDescription>
          </DialogHeader>
          
          {pendingBackup && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Backup Date:</span>
                  <span>{new Date(pendingBackup.timestamp).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Completed Pomodoros:</span>
                  <span>{pendingBackup.stats.completed.length}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Total Focus Time:</span>
                  <span>{formatDuration(pendingBackup.stats.completed.reduce((sum, entry) => sum + entry.pomodoroDuration, 0))}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Version:</span>
                  <span className="text-muted-foreground">{pendingBackup.version}</span>
                </div>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Warning:</strong> This action cannot be undone. Your current settings and statistics will be permanently replaced.
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancelRestore}
              disabled={backupLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRestore}
              disabled={backupLoading}
            >
              {backupLoading ? 'Restoring...' : 'Restore Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings; 