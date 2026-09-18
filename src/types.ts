export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakAfter: number; // number of pomodoros before long break
  autoStartNext: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  dailyGoalMinutes: number;
}

export interface Session {
  id: string;
  mode: TimerMode;
  duration: number; // planned duration in seconds
  startedAt: number; // timestamp
  completedAt: number | null;
  completed: boolean;
  actualDuration: number; // actual seconds spent
}

export interface DailyStats {
  date: string; // ISO date YYYY-MM-DD
  totalFocusSeconds: number;
  completedPomodoros: number;
  completedSessions: number;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  startTimestamp: number | null;
  pausedElapsed: number; // seconds already elapsed when paused
  sessionId: string | null;
  pomodoroCount: number; // completed pomodoros in current cycle
}

export interface AppData {
  version: number;
  settings: TimerSettings;
  sessions: Session[];
  dailyStats: Record<string, DailyStats>;
  timer: TimerState;
  theme: ThemeMode;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakAfter: 4,
  autoStartNext: false,
  soundEnabled: true,
  notificationsEnabled: false,
  dailyGoalMinutes: 120,
};

export const DEFAULT_TIMER_STATE: TimerState = {
  mode: 'focus',
  status: 'idle',
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  startTimestamp: null,
  pausedElapsed: 0,
  sessionId: null,
  pomodoroCount: 0,
};
