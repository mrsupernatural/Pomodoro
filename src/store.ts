import { AppData, DEFAULT_SETTINGS, DEFAULT_TIMER_STATE, DailyStats } from './types';

const STORAGE_KEY = 'focus_app_data';
const CURRENT_VERSION = 1;

function getDefaultData(): AppData {
  return {
    version: CURRENT_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
    dailyStats: {},
    timer: { ...DEFAULT_TIMER_STATE },
    theme: 'system',
  };
}

function validateData(data: unknown): AppData | null {
  try {
    if (!data || typeof data !== 'object') return null;
    const d = data as Record<string, unknown>;
    if (typeof d.version !== 'number') return null;
    if (!d.settings || typeof d.settings !== 'object') return null;
    if (!Array.isArray(d.sessions)) return null;
    if (!d.dailyStats || typeof d.dailyStats !== 'object') return null;
    if (!d.timer || typeof d.timer !== 'object') return null;
    return d as unknown as AppData;
  } catch {
    return null;
  }
}

function migrateData(data: AppData): AppData {
  if (data.version < CURRENT_VERSION) {
    // Future migrations go here
    data.version = CURRENT_VERSION;
  }
  return data;
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    const validated = validateData(parsed);
    if (!validated) return getDefaultData();
    return migrateData(validated);
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save data to localStorage:', e);
  }
}

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `focus-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(json: string): AppData | null {
  try {
    const parsed = JSON.parse(json);
    const validated = validateData(parsed);
    if (!validated) return null;
    return migrateData(validated);
  } catch {
    return null;
  }
}

export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getTodayStats(dailyStats: Record<string, DailyStats>): DailyStats {
  const key = getTodayKey();
  return dailyStats[key] || { date: key, totalFocusSeconds: 0, completedPomodoros: 0, completedSessions: 0 };
}

export function updateDailyStats(dailyStats: Record<string, DailyStats>, mode: string, durationSeconds: number): Record<string, DailyStats> {
  const key = getTodayKey();
  const current = dailyStats[key] || { date: key, totalFocusSeconds: 0, completedPomodoros: 0, completedSessions: 0 };
  
  const updated = { ...current };
  updated.completedSessions += 1;
  
  if (mode === 'focus') {
    updated.totalFocusSeconds += durationSeconds;
    updated.completedPomodoros += 1;
  }
  
  return { ...dailyStats, [key]: updated };
}

export function getStreak(dailyStats: Record<string, DailyStats>): number {
  let streak = 0;
  const today = new Date();
  
  // Check if today has focus sessions
  const todayKey = getDateKey(today);
  const todayStats = dailyStats[todayKey];
  
  if (todayStats && todayStats.completedPomodoros > 0) {
    streak = 1;
  } else {
    // Check yesterday - if no activity today, streak might still be valid from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);
    const yesterdayStats = dailyStats[yesterdayKey];
    if (yesterdayStats && yesterdayStats.completedPomodoros > 0) {
      streak = 1;
    } else {
      return 0;
    }
  }
  
  // Count backwards
  let checkDate = new Date(today);
  if (todayStats && todayStats.completedPomodoros > 0) {
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 2);
  }
  
  for (let i = 0; i < 365; i++) {
    const key = getDateKey(checkDate);
    const stats = dailyStats[key];
    if (stats && stats.completedPomodoros > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 dk';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) {
    return `${hours}s ${mins}dk`;
  }
  if (hours > 0) {
    return `${hours}s`;
  }
  return `${mins} dk`;
}

export function formatDurationShort(seconds: number): string {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}
