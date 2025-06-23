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
export async function completePomodoro() {
  const res = await api.post('/stats/complete');
  return res.data;
}

// UserSettings type
export interface UserSettings {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
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