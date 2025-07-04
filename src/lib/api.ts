import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Token management
export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

// Add token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register
export async function register(email: string, password: string) {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
}

// Login
export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  if (res.data.token) setToken(res.data.token);
  return res.data;
}

// Get completed pomodoros count
export async function getCompletedPomodoros() {
  const res = await api.get('/stats/completed');
  return res.data;
}

// Record a completed pomodoro
export async function completePomodoro(pomodoroDuration?: number) {
  const res = await api.post('/stats/complete', { pomodoroDuration });
  return res.data;
}

// Get all completed pomodoros with timestamps
export async function getAllCompletedPomodoros() {
  const res = await api.get('/stats/completed/all');
  return res.data.completed as { timestamp: string }[];
}

// UserSettings type
export interface UserSettings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
  lastUpdated?: string;
}

// Get user settings
export async function getSettings() {
  const res = await api.get('/settings');
  return res.data;
}

// Save user settings
export async function saveSettings(settings: Partial<UserSettings>) {
  const res = await api.post('/settings', settings);
  return res.data;
}

// Reset all completed pomodoros
export async function resetCompletedPomodoros() {
  const res = await api.post('/stats/reset');
  return res.data;
}

// Add multiple completed pomodoros with timestamps and durations
export async function addCompletedPomodorosWithTimestamps(entries: { timestamp: string; pomodoroDuration: number }[]) {
  const res = await api.post('/stats/complete/bulk', { entries });
  return res.data;
}

// Get all user data (settings + stats)
export async function getUserSyncData() {
  const res = await api.get('/stats/sync');
  return res.data; // { settings, stats }
}

// Merge local data into user account
export async function mergeUserSyncData(data: { settings?: Partial<UserSettings & { lastUpdated?: string }>; stats?: { completed: { timestamp: string; pomodoroDuration: number }[] } }) {
  const res = await api.post('/stats/sync', data);
  return res.data; // { settings, stats }
}

// Export backup from server (for logged-in users)
export async function exportServerBackup() {
  const res = await api.get('/stats/backup');
  return res.data; // { version, timestamp, settings, stats }
}

// Import backup to server (for logged-in users)
export async function importServerBackup(backupData: { settings: UserSettings; stats: { completed: { timestamp: string; pomodoroDuration: number }[] } }) {
  const res = await api.post('/stats/backup', backupData);
  return res.data; // { message, settings, stats }
} 