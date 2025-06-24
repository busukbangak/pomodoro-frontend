import type { UserSettings } from './api';

export interface BackupData {
  version: string;
  timestamp: string;
  settings: UserSettings;
  stats: {
    completed: Array<{
      timestamp: string;
      pomodoroDuration: number;
    }>;
  };
}

const BACKUP_VERSION = '1.0.0';
const LOCAL_SETTINGS_KEY = 'pomodoro-settings';
const LOCAL_STATS_KEY = 'pomodoro-stats';

// Load local settings
function loadLocalSettings(): UserSettings {
  const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
  if (!raw) {
    return {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreak: false,
      autoStartPomodoro: false,
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreak: false,
      autoStartPomodoro: false,
    };
  }
}

// Load local stats
function loadLocalStats(): Array<{ timestamp: string; pomodoroDuration: number }> {
  const raw = localStorage.getItem(LOCAL_STATS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.filter(e => 
        e && 
        typeof e.timestamp === 'string' && 
        typeof e.pomodoroDuration === 'number'
      );
    }
    return [];
  } catch {
    return [];
  }
}

// Create backup data from current local storage
export function createBackup(): BackupData {
  return {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    settings: loadLocalSettings(),
    stats: {
      completed: loadLocalStats(),
    },
  };
}

// Validate backup data structure
export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  
  const backup = data as Record<string, unknown>;
  
  // Check required fields
  if (typeof backup.version !== 'string') return false;
  if (typeof backup.timestamp !== 'string') return false;
  if (!backup.settings || typeof backup.settings !== 'object') return false;
  if (!backup.stats || typeof backup.stats !== 'object') return false;
  
  // Validate settings
  const settings = backup.settings as Record<string, unknown>;
  if (typeof settings.pomodoroDuration !== 'number') return false;
  if (typeof settings.shortBreakDuration !== 'number') return false;
  if (typeof settings.longBreakDuration !== 'number') return false;
  if (typeof settings.autoStartBreak !== 'boolean') return false;
  if (typeof settings.autoStartPomodoro !== 'boolean') return false;
  
  // Validate stats
  const stats = backup.stats as Record<string, unknown>;
  if (!Array.isArray(stats.completed)) return false;
  for (const entry of stats.completed) {
    if (!entry || typeof entry !== 'object') return false;
    const entryObj = entry as Record<string, unknown>;
    if (typeof entryObj.timestamp !== 'string') return false;
    if (typeof entryObj.pomodoroDuration !== 'number') return false;
  }
  
  return true;
}

// Restore data from backup
export function restoreFromBackup(backup: BackupData): void {
  // Save settings
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(backup.settings));
  
  // Save stats
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(backup.stats.completed));
}

// Export backup to file
export function exportBackup(): void {
  const backup = createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
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
}

// Import backup from file
export function importBackup(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (validateBackup(data)) {
          resolve(data);
        } else {
          reject(new Error('Invalid backup file format'));
        }
      } catch {
        reject(new Error('Failed to parse backup file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read backup file'));
    };
    
    reader.readAsText(file);
  });
}

// Get backup info for display
export function getBackupInfo(backup: BackupData): {
  date: string;
  pomodoroCount: number;
  totalDuration: number;
  version: string;
} {
  const totalDuration = backup.stats.completed.reduce((sum, entry) => sum + entry.pomodoroDuration, 0);
  
  return {
    date: new Date(backup.timestamp).toLocaleString(),
    pomodoroCount: backup.stats.completed.length,
    totalDuration,
    version: backup.version,
  };
} 