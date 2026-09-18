import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  TimerMode, TimerStatus, ThemeMode, TimerSettings, Session, DailyStats, TimerState, Toast as ToastType,
  DEFAULT_SETTINGS, DEFAULT_TIMER_STATE, AppData
} from './types';
import {
  loadData, saveData, exportData, importData, clearData,
  getTodayKey, getTodayStats, updateDailyStats, getStreak,
  formatTime, formatDuration, formatDurationShort, getDateKey
} from './store';
import { Play, Pause, RotateCcw, Sun, Moon, Monitor, BarChart3, Settings, X, Download, Upload, Trash2, Volume2, VolumeX, Bell, BellOff, ChevronLeft, Check } from 'lucide-react';

// ==================== TOAST COMPONENT ====================
function ToastContainer({ toasts, onRemove }: { toasts: ToastType[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in
            ${toast.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
            ${toast.type === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
            ${toast.type === 'info' ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
          `}
        >
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="opacity-60 hover:opacity-100" aria-label="Kapat">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ==================== CONFIRMATION MODAL ====================
function ConfirmationModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Vazgeç
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== CIRCULAR PROGRESS ====================
function CircularProgress({ progress, mode, size = 280 }: { progress: number; mode: TimerMode; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  const colors = {
    focus: 'stroke-orange-400',
    shortBreak: 'stroke-emerald-400',
    longBreak: 'stroke-blue-400',
  };
  const bgColors = {
    focus: 'stroke-orange-100 dark:stroke-orange-900/30',
    shortBreak: 'stroke-emerald-100 dark:stroke-emerald-900/30',
    longBreak: 'stroke-blue-100 dark:stroke-blue-900/30',
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className={`${bgColors[mode]} transition-colors duration-300`}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={`${colors[mode]} transition-all duration-1000 ease-linear`}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
    </svg>
  );
}

// ==================== MODE COLORS ====================
function getModeColor(mode: TimerMode) {
  switch (mode) {
    case 'focus': return { bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800', dot: 'bg-orange-400' };
    case 'shortBreak': return { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-200 dark:ring-emerald-800', dot: 'bg-emerald-400' };
    case 'longBreak': return { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', ring: 'ring-blue-200 dark:ring-blue-800', dot: 'bg-blue-400' };
  }
}

function getModeLabel(mode: TimerMode) {
  switch (mode) {
    case 'focus': return 'Odak';
    case 'shortBreak': return 'Kısa Mola';
    case 'longBreak': return 'Uzun Mola';
  }
}

// ==================== MAIN APP ====================
export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [view, setView] = useState<'timer' | 'stats' | 'settings'>('timer');
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; danger?: boolean }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });
  const [sessionComplete, setSessionComplete] = useState(false);
  const timerRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const { settings, timer, sessions, dailyStats, theme } = data;
  const todayStats = useMemo(() => getTodayStats(dailyStats), [dailyStats]);
  const streak = useMemo(() => getStreak(dailyStats), [dailyStats]);

  // Recalculate timer on mount if it was running
  useEffect(() => {
    if (timer.status === 'running' && timer.startTimestamp) {
      const now = Date.now();
      const elapsed = Math.floor((now - timer.startTimestamp) / 1000) + timer.pausedElapsed;
      const remaining = Math.max(0, timer.totalSeconds - elapsed);
      
      if (remaining <= 0) {
        // Timer completed while page was closed
        const completedSession: Session = {
          id: timer.sessionId || Date.now().toString(),
          mode: timer.mode,
          duration: timer.totalSeconds,
          startedAt: timer.startTimestamp - timer.pausedElapsed * 1000,
          completedAt: now,
          completed: true,
          actualDuration: timer.totalSeconds,
        };
        
        updateData(prev => {
          let newDailyStats = prev.dailyStats;
          newDailyStats = updateDailyStats(newDailyStats, prev.timer.mode, prev.timer.totalSeconds);
          let newPomodoroCount = prev.timer.pomodoroCount;
          if (prev.timer.mode === 'focus') newPomodoroCount += 1;
          
          return {
            ...prev,
            sessions: [...prev.sessions, completedSession],
            dailyStats: newDailyStats,
            timer: {
              ...prev.timer,
              status: 'completed' as TimerStatus,
              remainingSeconds: 0,
              pomodoroCount: newPomodoroCount,
            },
          };
        });
        setSessionComplete(true);
      } else if (remaining !== timer.remainingSeconds) {
        // Update remaining time
        updateData(prev => ({
          ...prev,
          timer: { ...prev.timer, remainingSeconds: remaining },
        }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==================== PERSISTENCE ====================
  const persistData = useCallback((newData: AppData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  // ==================== TOAST ====================
  const addToast = useCallback((message: string, type: ToastType['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration: 3000 }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ==================== THEME ====================
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.add('light');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
    }
  }, [theme]);

  // ==================== TIMER LOGIC ====================
  const tick = useCallback(() => {
    setData(prev => {
      if (prev.timer.status !== 'running' || !prev.timer.startTimestamp) return prev;
      
      const now = Date.now();
      const elapsed = Math.floor((now - prev.timer.startTimestamp) / 1000) + prev.timer.pausedElapsed;
      const remaining = Math.max(0, prev.timer.totalSeconds - elapsed);
      
      if (remaining <= 0) {
        // Timer completed
        const completedSession: Session = {
          id: prev.timer.sessionId || Date.now().toString(),
          mode: prev.timer.mode,
          duration: prev.timer.totalSeconds,
          startedAt: prev.timer.startTimestamp - prev.timer.pausedElapsed * 1000,
          completedAt: now,
          completed: true,
          actualDuration: prev.timer.totalSeconds,
        };
        
        const newSessions = [...prev.sessions, completedSession];
        let newDailyStats = prev.dailyStats;
        if (completedSession.completed) {
          newDailyStats = updateDailyStats(newDailyStats, prev.timer.mode, prev.timer.totalSeconds);
        }
        
        let newPomodoroCount = prev.timer.pomodoroCount;
        if (prev.timer.mode === 'focus') {
          newPomodoroCount += 1;
        }
        
        return {
          ...prev,
          sessions: newSessions,
          dailyStats: newDailyStats,
          timer: {
            ...prev.timer,
            status: 'completed' as TimerStatus,
            remainingSeconds: 0,
            pomodoroCount: newPomodoroCount,
          },
        };
      }
      
      return {
        ...prev,
        timer: {
          ...prev.timer,
          remainingSeconds: remaining,
        },
      };
    });
  }, []);

  // Timer interval
  useEffect(() => {
    if (timer.status === 'running') {
      lastTickRef.current = Date.now();
      timerRef.current = window.setInterval(tick, 250);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer.status, tick]);

  // Handle timer completion
  useEffect(() => {
    if (timer.status === 'completed' && !sessionComplete) {
      setSessionComplete(true);
      
      // Sound
      if (settings.soundEnabled) {
        playCompletionSound();
      }
      
      // Notification
      if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        const modeLabel = getModeLabel(timer.mode);
        new Notification('Focus Timer', {
          body: `${modeLabel} oturumu tamamlandı!`,
          icon: '🎯',
        });
      }
      
      // Auto-start next
      if (settings.autoStartNext) {
        setTimeout(() => {
          moveToNextMode();
        }, 1000);
      }
    }
  }, [timer.status]);

  // Page title
  useEffect(() => {
    if (timer.status === 'running') {
      document.title = `${formatTime(timer.remainingSeconds)} — Focus`;
    } else if (timer.status === 'paused') {
      document.title = `Duraklatıldı — Focus`;
    } else {
      document.title = 'Focus — Pomodoro Timer';
    }
  }, [timer.status, timer.remainingSeconds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (timer.status === 'idle' || timer.status === 'completed') {
            startTimer();
          } else if (timer.status === 'running') {
            pauseTimer();
          } else if (timer.status === 'paused') {
            resumeTimer();
          }
          break;
        case 'KeyR':
          resetTimer();
          break;
        case 'Digit1':
          switchMode('focus');
          break;
        case 'Digit2':
          switchMode('shortBreak');
          break;
        case 'Digit3':
          switchMode('longBreak');
          break;
        case 'KeyS':
          setView('settings');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [timer.status, timer.mode, settings]);

  // ==================== TIMER ACTIONS ====================
  const generateSessionId = () => Date.now().toString() + Math.random().toString(36).slice(2);

  const startTimer = useCallback(() => {
    const duration = getDurationForMode(timer.mode, settings);
    const sessionId = generateSessionId();
    updateData(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode: prev.timer.status === 'completed' ? prev.timer.mode : prev.timer.mode,
        status: 'running',
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: Date.now(),
        pausedElapsed: 0,
        sessionId,
      },
    }));
    setSessionComplete(false);
  }, [timer.mode, settings, timer.status]);

  const pauseTimer = useCallback(() => {
    if (timer.status !== 'running' || !timer.startTimestamp) return;
    const elapsed = Math.floor((Date.now() - timer.startTimestamp) / 1000) + timer.pausedElapsed;
    updateData(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        status: 'paused',
        pausedElapsed: elapsed,
        startTimestamp: null,
      },
    }));
  }, [timer.status, timer.startTimestamp, timer.pausedElapsed]);

  const resumeTimer = useCallback(() => {
    if (timer.status !== 'paused') return;
    updateData(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        status: 'running',
        startTimestamp: Date.now(),
      },
    }));
  }, [timer.status]);

  const resetTimer = useCallback(() => {
    setConfirmModal({
      open: true,
      title: 'Timer sıfırlansın mı?',
      message: 'Mevcut ilerleme kaybolacak.',
      confirmLabel: 'Sıfırla',
      danger: true,
      onConfirm: () => {
        const duration = getDurationForMode(timer.mode, settings);
        updateData(prev => ({
          ...prev,
          timer: {
            ...prev.timer,
            status: 'idle',
            remainingSeconds: duration,
            totalSeconds: duration,
            startTimestamp: null,
            pausedElapsed: 0,
            sessionId: null,
          },
        }));
        setSessionComplete(false);
        setConfirmModal(prev => ({ ...prev, open: false }));
        addToast('Timer sıfırlandı.', 'info');
      },
    });
  }, [timer.mode, settings]);

  const switchMode = useCallback((mode: TimerMode) => {
    if (timer.status === 'running') {
      setConfirmModal({
        open: true,
        title: 'Mod değiştirilsin mi?',
        message: 'Mevcut oturum sonlandırılacak.',
        confirmLabel: 'Değiştir',
        danger: true,
        onConfirm: () => {
          doSwitchMode(mode);
          setConfirmModal(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      doSwitchMode(mode);
    }
  }, [timer.status]);

  const doSwitchMode = (mode: TimerMode) => {
    const duration = getDurationForMode(mode, settings);
    updateData(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode,
        status: 'idle',
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: null,
        pausedElapsed: 0,
        sessionId: null,
      },
    }));
    setSessionComplete(false);
  };

  const moveToNextMode = useCallback(() => {
    let nextMode: TimerMode;
    let resetPomodoroCount = false;
    
    if (timer.mode === 'focus') {
      if (timer.pomodoroCount >= settings.longBreakAfter) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
    } else {
      nextMode = 'focus';
      if (timer.mode === 'longBreak') {
        resetPomodoroCount = true;
      }
    }
    
    const duration = getDurationForMode(nextMode, settings);
    const sessionId = generateSessionId();
    
    updateData(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        mode: nextMode,
        status: settings.autoStartNext ? 'running' : 'idle',
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: settings.autoStartNext ? Date.now() : null,
        pausedElapsed: 0,
        sessionId: settings.autoStartNext ? sessionId : null,
        pomodoroCount: resetPomodoroCount ? 0 : prev.timer.pomodoroCount,
      },
    }));
    setSessionComplete(false);
  }, [timer.mode, timer.pomodoroCount, settings]);

  // ==================== SOUND ====================
  const playCompletionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Silently fail
    }
  };

  // ==================== SETTINGS ====================
  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    updateData(prev => {
      const updated = { ...prev.settings, ...newSettings };
      let newTimer = prev.timer;
      // If timer is idle, update duration to match new settings
      if (prev.timer.status === 'idle') {
        const duration = getDurationForMode(prev.timer.mode, updated);
        newTimer = { ...prev.timer, remainingSeconds: duration, totalSeconds: duration };
      }
      return { ...prev, settings: updated, timer: newTimer };
    });
    addToast('Ayarlar kaydedildi.', 'success');
  };

  const setTheme = (newTheme: ThemeMode) => {
    updateData(prev => ({ ...prev, theme: newTheme }));
  };

  // ==================== DATA MANAGEMENT ====================
  const handleExport = () => {
    exportData(data);
    addToast('Veriler dışa aktarıldı.', 'success');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = importData(e.target?.result as string);
      if (result) {
        updateData(() => result);
        addToast('Veriler içe aktarıldı.', 'success');
      } else {
        addToast('Bu dosya geçerli bir Focus yedeği değil.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    setConfirmModal({
      open: true,
      title: 'Tüm veriler silinsin mi?',
      message: 'Tüm oturum geçmişi ve ayarlar kalıcı olarak silinecek. Bu işlem geri alınamaz.',
      confirmLabel: 'Evet, tüm verileri sil',
      danger: true,
      onConfirm: () => {
        clearData();
        setData(loadData());
        setConfirmModal(prev => ({ ...prev, open: false }));
        addToast('Tüm veriler silindi.', 'info');
      },
    });
  };

  // ==================== NOTIFICATIONS ====================
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updateSettings({ notificationsEnabled: true });
        addToast('Bildirimler etkinleştirildi.', 'success');
      } else {
        addToast('Bildirim izni reddedildi.', 'error');
      }
    } else {
      addToast('Bu tarayıcı bildirimleri desteklemiyor.', 'error');
    }
  };

  // ==================== PROGRESS CALCULATION ====================
  const progress = timer.totalSeconds > 0 ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 : 0;
  const goalProgress = settings.dailyGoalMinutes > 0 ? Math.min(100, (todayStats.totalFocusSeconds / (settings.dailyGoalMinutes * 60)) * 100) : 0;

  // ==================== RENDER ====================
  const modeColors = getModeColor(timer.mode);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Focus</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView(view === 'stats' ? 'timer' : 'stats')}
              className={`p-2 rounded-lg transition-colors ${view === 'stats' ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              aria-label="İstatistikler"
            >
              <BarChart3 size={18} />
            </button>
            <button
              onClick={() => setView(view === 'settings' ? 'timer' : 'settings')}
              className={`p-2 rounded-lg transition-colors ${view === 'settings' ? 'bg-neutral-100 dark:bg-neutral-800' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              aria-label="Ayarlar"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => {
                const themes: ThemeMode[] = ['light', 'dark', 'system'];
                const idx = themes.indexOf(theme);
                setTheme(themes[(idx + 1) % themes.length]);
              }}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Tema değiştir"
            >
              {theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {view === 'timer' && (
          <TimerView
            timer={timer}
            settings={settings}
            progress={progress}
            todayStats={todayStats}
            goalProgress={goalProgress}
            streak={streak}
            sessionComplete={sessionComplete}
            modeColors={modeColors}
            onStart={startTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
            onSwitchMode={switchMode}
            onNextMode={moveToNextMode}
          />
        )}
        {view === 'stats' && (
          <StatsView dailyStats={dailyStats} sessions={sessions} settings={settings} streak={streak} onBack={() => setView('timer')} />
        )}
        {view === 'settings' && (
          <SettingsView
            settings={settings}
            theme={theme}
            onUpdateSettings={updateSettings}
            onSetTheme={setTheme}
            onExport={handleExport}
            onImport={handleImport}
            onClearAll={handleClearAll}
            onRequestNotification={requestNotificationPermission}
            onBack={() => setView('timer')}
          />
        )}
      </main>

      {/* MODALS */}
      <ConfirmationModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
        danger={confirmModal.danger}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// ==================== HELPER ====================
function getDurationForMode(mode: TimerMode, settings: TimerSettings): number {
  switch (mode) {
    case 'focus': return settings.focusDuration * 60;
    case 'shortBreak': return settings.shortBreakDuration * 60;
    case 'longBreak': return settings.longBreakDuration * 60;
  }
}

// ==================== TIMER VIEW ====================
function TimerView({ timer, settings, progress, todayStats, goalProgress, streak, sessionComplete, modeColors, onStart, onPause, onResume, onReset, onSwitchMode, onNextMode }: {
  timer: TimerState; settings: TimerSettings; progress: number; todayStats: DailyStats;
  goalProgress: number; streak: number; sessionComplete: boolean; modeColors: any;
  onStart: () => void; onPause: () => void; onResume: () => void; onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void; onNextMode: () => void;
}) {
  const modes: TimerMode[] = ['focus', 'shortBreak', 'longBreak'];

  return (
    <div className="flex flex-col items-center">
      {/* Mode Selector */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-8 sm:mb-12" role="tablist">
        {modes.map(mode => (
          <button
            key={mode}
            role="tab"
            aria-selected={timer.mode === mode}
            onClick={() => onSwitchMode(mode)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200
              ${timer.mode === mode
                ? `${getModeColor(mode).bg} ${getModeColor(mode).text} shadow-sm`
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
          >
            {getModeLabel(mode)}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="relative flex items-center justify-center mb-6 sm:mb-8">
        <CircularProgress progress={progress} mode={timer.mode} size={280} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-6xl sm:text-7xl font-light tracking-tight font-mono tabular-nums"
            aria-live="polite"
            aria-label={`Kalan süre ${formatTime(timer.remainingSeconds)}`}
          >
            {formatTime(timer.remainingSeconds)}
          </span>
          <span className={`text-xs sm:text-sm mt-2 font-medium ${modeColors.text}`}>
            {getModeLabel(timer.mode)}
          </span>
        </div>
      </div>

      {/* Pomodoro Counter */}
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        {Array.from({ length: settings.longBreakAfter }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < timer.pomodoroCount
                ? `${modeColors.dot} scale-110`
                : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
            aria-label={`Pomodoro ${i + 1} ${i < timer.pomodoroCount ? 'tamamlandı' : 'bekliyor'}`}
          />
        ))}
        <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-2">
          {timer.pomodoroCount} / {settings.longBreakAfter}
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {timer.status === 'completed' ? (
          <button
            onClick={onNextMode}
            className={`px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
              timer.mode === 'focus' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-orange-900/30' :
              timer.mode === 'shortBreak' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/30' :
              'bg-blue-500 hover:bg-blue-600 shadow-blue-200 dark:shadow-blue-900/30'
            }`}
          >
            Sonraki moda geç →
          </button>
        ) : (
          <>
            <button
              onClick={timer.status === 'idle' ? onStart : timer.status === 'running' ? onPause : onResume}
              className={`px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                timer.status === 'running'
                  ? 'bg-neutral-700 dark:bg-neutral-300 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-neutral-200 dark:shadow-neutral-800/30'
                  : timer.mode === 'focus' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-orange-900/30' :
                  timer.mode === 'shortBreak' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/30' :
                  'bg-blue-500 hover:bg-blue-600 shadow-blue-200 dark:shadow-blue-900/30'
              }`}
              aria-label={timer.status === 'idle' ? 'Başlat' : timer.status === 'running' ? 'Duraklat' : 'Devam Et'}
            >
              {timer.status === 'idle' ? 'Başlat' : timer.status === 'running' ? 'Duraklat' : 'Devam Et'}
            </button>
            {timer.status !== 'idle' && (
              <button
                onClick={onReset}
                className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex items-center gap-1.5"
                aria-label="Sıfırla"
              >
                <RotateCcw size={14} />
                Sıfırla
              </button>
            )}
          </>
        )}
      </div>

      {/* Session Complete Message */}
      {sessionComplete && !settings.autoStartNext && (
        <div className={`mt-6 px-4 py-3 rounded-xl text-sm font-medium ${modeColors.bg} ${modeColors.text} animate-fade-in`}>
          ✓ {getModeLabel(timer.mode)} oturumu tamamlandı
        </div>
      )}

      {/* Today Stats */}
      <div className="mt-10 sm:mt-14 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Bugün</h2>
          {streak > 0 && (
            <span className="text-xs font-medium text-orange-500 dark:text-orange-400">
              🔥 {streak} günlük seri
            </span>
          )}
        </div>
        
        {/* Goal Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span>Günlük hedef</span>
            <span>{formatDuration(todayStats.totalFocusSeconds)} / {formatDuration(settings.dailyGoalMinutes * 60)}</span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                goalProgress >= 100 ? 'bg-emerald-400' : modeColors.dot
              }`}
              style={{ width: `${Math.min(100, goalProgress)}%` }}
            />
          </div>
          {goalProgress >= 100 && (
            <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-medium">
              Günlük hedef tamamlandı 🎉
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
            <p className="text-lg font-semibold">{formatDurationShort(todayStats.totalFocusSeconds)}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Toplam odak</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
            <p className="text-lg font-semibold">{todayStats.completedPomodoros}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Pomodoro</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
            <p className="text-lg font-semibold">{todayStats.completedSessions}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Oturum</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== STATS VIEW ====================
function StatsView({ dailyStats, sessions, settings, streak, onBack }: {
  dailyStats: Record<string, DailyStats>; sessions: Session[]; settings: TimerSettings; streak: number; onBack: () => void;
}) {
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days' | '30days'>('7days');

  const filteredData = useMemo(() => {
    const now = new Date();
    const entries = Object.entries(dailyStats).sort(([a], [b]) => b.localeCompare(a));
    
    switch (period) {
      case 'today': {
        const key = getDateKey(now);
        return entries.filter(([k]) => k === key);
      }
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const key = getDateKey(yesterday);
        return entries.filter(([k]) => k === key);
      }
      case '7days': {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        return entries.filter(([k]) => new Date(k) >= cutoff);
      }
      case '30days': {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 30);
        return entries.filter(([k]) => new Date(k) >= cutoff);
      }
    }
  }, [dailyStats, period]);

  const totals = useMemo(() => {
    let totalSeconds = 0;
    let totalPomodoros = 0;
    let totalSessions = 0;
    let longestDay = 0;
    let longestDayDate = '';
    
    filteredData.forEach(([date, stats]) => {
      totalSeconds += stats.totalFocusSeconds;
      totalPomodoros += stats.completedPomodoros;
      totalSessions += stats.completedSessions;
      if (stats.totalFocusSeconds > longestDay) {
        longestDay = stats.totalFocusSeconds;
        longestDayDate = date;
      }
    });
    
    const days = filteredData.length || 1;
    const avgDaily = totalSeconds / days;
    
    return { totalSeconds, totalPomodoros, totalSessions, avgDaily, longestDay, longestDayDate };
  }, [filteredData]);

  // Weekly chart data (last 7 days)
  const chartData = useMemo(() => {
    const days = [];
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = getDateKey(date);
      const stats = dailyStats[key];
      days.push({
        date: key,
        label: dayNames[date.getDay()],
        seconds: stats?.totalFocusSeconds || 0,
      });
    }
    return days;
  }, [dailyStats]);

  const maxChartSeconds = Math.max(...chartData.map(d => d.seconds), 1);

  // Heatmap data (last 90 days)
  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = getDateKey(date);
      const stats = dailyStats[key];
      days.push({
        date: key,
        seconds: stats?.totalFocusSeconds || 0,
        pomodoros: stats?.completedPomodoros || 0,
      });
    }
    return days;
  }, [dailyStats]);

  // Recent sessions
  const recentSessions = useMemo(() => {
    return sessions
      .filter(s => s.completed)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 20);
  }, [sessions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Geri">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">İstatistikler</h2>
      </div>

      {/* Period Filter */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-fit">
        {([['today', 'Bugün'], ['yesterday', 'Dün'], ['7days', 'Son 7 gün'], ['30days', 'Son 30 gün']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              period === key ? 'bg-white dark:bg-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
          <p className="text-2xl font-semibold">{formatDuration(totals.totalSeconds)}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Toplam odak</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
          <p className="text-2xl font-semibold">{totals.totalPomodoros}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Toplam oturum</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
          <p className="text-2xl font-semibold">{formatDuration(Math.round(totals.avgDaily))}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Günlük ortalama</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
          <p className="text-2xl font-semibold">{formatDuration(totals.longestDay)}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">En uzun gün</p>
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">🔥 {streak} günlük seri</p>
          <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">Arka arkaya odaklanılan gün sayısı</p>
        </div>
      )}

      {/* Weekly Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Günlük odak süresi</h3>
        <div className="flex items-end gap-2 h-32">
          {chartData.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end h-24">
                <div
                  className="w-full bg-orange-300 dark:bg-orange-600 rounded-t-sm transition-all duration-500 min-h-[2px]"
                  style={{ height: `${(day.seconds / maxChartSeconds) * 100}%` }}
                  title={`${formatDate(day.date)}: ${formatDuration(day.seconds)}`}
                />
              </div>
              <span className="text-[10px] text-neutral-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Odak takvimi</h3>
        <div className="flex flex-wrap gap-1">
          {heatmapData.map((day) => {
            const intensity = day.seconds === 0 ? 0 : day.seconds < 1800 ? 1 : day.seconds < 3600 ? 2 : day.seconds < 7200 ? 3 : 4;
            return (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm transition-colors ${
                  intensity === 0 ? 'bg-neutral-100 dark:bg-neutral-800' :
                  intensity === 1 ? 'bg-orange-200 dark:bg-orange-900/50' :
                  intensity === 2 ? 'bg-orange-300 dark:bg-orange-700/60' :
                  intensity === 3 ? 'bg-orange-400 dark:bg-orange-600' :
                  'bg-orange-500 dark:bg-orange-500'
                }`}
                title={`${formatDate(day.date)}: ${formatDuration(day.seconds)} — ${day.pomodoros} oturum`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-neutral-400">
          <span>Az</span>
          <div className="flex gap-0.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-200 dark:bg-orange-900/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-300 dark:bg-orange-700/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500 dark:bg-orange-500" />
          </div>
          <span>Çok</span>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Son oturumlar</h3>
        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Henüz tamamlanmış oturum yok.</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">İlk odak oturumunu başlat!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentSessions.map(session => {
              const color = getModeColor(session.mode);
              const time = new Date(session.completedAt || session.startedAt);
              return (
                <div key={session.id} className="flex items-center gap-3 py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${color.dot}`} />
                  <span className="text-sm font-medium flex-1">{getModeLabel(session.mode)}</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {Math.round(session.actualDuration / 60)} dk
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== SETTINGS VIEW ====================
function SettingsView({ settings, theme, onUpdateSettings, onSetTheme, onExport, onImport, onClearAll, onRequestNotification, onBack }: {
  settings: TimerSettings; theme: ThemeMode;
  onUpdateSettings: (s: Partial<TimerSettings>) => void;
  onSetTheme: (t: ThemeMode) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onRequestNotification: () => void;
  onBack: () => void;
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Validate
    if (localSettings.focusDuration < 1 || localSettings.focusDuration > 180) {
      return;
    }
    if (localSettings.shortBreakDuration < 1 || localSettings.shortBreakDuration > 60) {
      return;
    }
    if (localSettings.longBreakDuration < 1 || localSettings.longBreakDuration > 120) {
      return;
    }
    onUpdateSettings(localSettings);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Geri">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">Ayarlar</h2>
      </div>

      {/* Timer Settings */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Timer</h3>
        <div className="space-y-4">
          <SettingInput
            label="Odak süresi"
            value={localSettings.focusDuration}
            min={1} max={180}
            unit="dakika"
            onChange={v => setLocalSettings(prev => ({ ...prev, focusDuration: v }))}
          />
          <SettingInput
            label="Kısa mola"
            value={localSettings.shortBreakDuration}
            min={1} max={60}
            unit="dakika"
            onChange={v => setLocalSettings(prev => ({ ...prev, shortBreakDuration: v }))}
          />
          <SettingInput
            label="Uzun mola"
            value={localSettings.longBreakDuration}
            min={1} max={120}
            unit="dakika"
            onChange={v => setLocalSettings(prev => ({ ...prev, longBreakDuration: v }))}
          />
          <SettingInput
            label="Uzun mola öncesi Pomodoro"
            value={localSettings.longBreakAfter}
            min={1} max={10}
            unit="oturum"
            onChange={v => setLocalSettings(prev => ({ ...prev, longBreakAfter: v }))}
          />
          <SettingToggle
            label="Otomatik sonraki moda geç"
            checked={localSettings.autoStartNext}
            onChange={v => setLocalSettings(prev => ({ ...prev, autoStartNext: v }))}
          />
          <div className="pt-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Değişiklikleri kaydet
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Bildirimler</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tarayıcı bildirimleri</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Oturum tamamlandığında bildirim al</p>
            </div>
            <button
              onClick={onRequestNotification}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                settings.notificationsEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {settings.notificationsEnabled ? 'Açık' : 'İzin ver'}
            </button>
          </div>
          <SettingToggle
            label="Sesli bildirim"
            checked={settings.soundEnabled}
            onChange={v => onUpdateSettings({ soundEnabled: v })}
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Görünüm</h3>
        <div className="flex gap-2">
          {([['light', 'Açık', Sun], ['dark', 'Koyu', Moon], ['system', 'Sistem', Monitor]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => onSetTheme(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                theme === key
                  ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800'
                  : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-200 dark:hover:border-neutral-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Daily Goal */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Günlük Hedef</h3>
        <SettingInput
          label="Günlük odak hedefi"
          value={settings.dailyGoalMinutes}
          min={15} max={600}
          unit="dakika"
          onChange={v => onUpdateSettings({ dailyGoalMinutes: v })}
        />
      </section>

      {/* Data */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Veri</h3>
        <div className="space-y-3">
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <Download size={16} />
            Verileri dışa aktar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <Upload size={16} />
            Verileri içe aktar
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          <button
            onClick={onClearAll}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left rounded-lg border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <Trash2 size={16} />
            Tüm verileri sil
          </button>
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold mb-4">Klavye Kısayolları</h3>
        <div className="space-y-2 text-sm">
          {[
            ['Space', 'Başlat / Duraklat'],
            ['R', 'Sıfırla'],
            ['1', 'Odak modu'],
            ['2', 'Kısa mola'],
            ['3', 'Uzun mola'],
            ['S', 'Ayarlar'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">{key}</kbd>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ==================== SETTING INPUT ====================
function SettingInput({ label, value, min, max, unit, onChange }: {
  label: string; value: number; min: number; max: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-neutral-700 dark:text-neutral-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          className="w-16 px-2 py-1.5 text-sm text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-700"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400 w-12">{unit}</span>
      </div>
    </div>
  );
}

// ==================== SETTING TOGGLE ====================
function SettingToggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 ${
          checked ? 'bg-orange-400' : 'bg-neutral-200 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            checked ? 'translate-x-[18px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
