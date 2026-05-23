import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Sparkles, TrendingUp, Settings as SettingsIcon, CheckCircle2, 
  Flame, Award, Smartphone, Github, Heart, LayoutDashboard
} from 'lucide-react';

import lightBlueBg from './assets/images/light_blue_bg_1779491889250.png';
import lightPinkBg from './assets/images/light_pink_bg_1779491909327.png';

import { Habit, HabitCompletion, HabitProgress, AppSettings, ViewType } from './types';
import TodayView from './components/TodayView';
import InsightsView from './components/InsightsView';
import TrendsView from './components/TrendsView';
import SettingsView from './components/SettingsView';
import { getVal, setVal, clearAllVal, delVal } from './lib/db';


// Default initial habits matching the screenshot exactly
const SEED_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Water Intake',
    description: 'Track daily hydration count against physical quota',
    category: 'Health',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'sky',
    icon: 'Heart',
    habitType: 'quantity',
    quantityGoal: 15,
    quantityUnit: 'cups'
  },
  {
    id: 'habit-2',
    name: 'Exercise',
    description: 'Active gym workouts, morning yoga, or jogging duration',
    category: 'Fitness',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'rose',
    icon: 'Dumbbell',
    habitType: 'time',
    timeGoal: 120
  },
  {
    id: 'habit-3',
    name: 'Meditation',
    description: 'Focused silent box breathing or guided zazen',
    category: 'Mind',
    frequency: 'daily',
    createdAt: new Date().toISOString(),
    color: 'violet',
    icon: 'Brain',
    habitType: 'on_off'
  }
];

// Seed generator for past completions and progress (28 days)
const generateSeedCompletionsAndProgress = (): { completions: HabitCompletion[], progress: HabitProgress[] } => {
  const completionsList: HabitCompletion[] = [];
  const progressList: HabitProgress[] = [];
  const today = new Date();
  
  // Seed past 28 days
  for (let i = 28; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    SEED_HABITS.forEach((h) => {
      let isComplete = false;
      let progressVal = 0;
      
      if (h.habitType === 'on_off') {
        isComplete = Math.random() < 0.75;
        progressVal = isComplete ? 1 : 0;
      } else if (h.habitType === 'quantity') {
        const goal = h.quantityGoal || 15;
        // give them random counts between 8 and 17 cups
        progressVal = Math.floor(Math.random() * 10) + 8;
        isComplete = progressVal >= goal;
      } else if (h.habitType === 'time') {
        const goal = h.timeGoal || 120;
        // random minutes between 60 and 140 minutes
        progressVal = Math.floor(Math.random() * 90) + 60;
        isComplete = progressVal >= goal;
      }

      if (isComplete) {
        completionsList.push({
          habitId: h.id,
          date: dateStr
        });
      }

      progressList.push({
        habitId: h.id,
        date: dateStr,
        value: progressVal
      });
    });
  }
  return { completions: completionsList, progress: progressList };
};

const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Luis',
  dailyGoal: 75, // 75% target consistency
  reminderTime: '21:00',
  soundEnabled: true,
  hapticFeedback: true,
  bgTheme: 'none'
};

export default function App() {
  const [view, setView] = useState<ViewType>('today');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [progress, setProgress] = useState<HabitProgress[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [subtaskCompletions, setSubtaskCompletions] = useState<{ [key: string]: boolean }>({});

  // Swipe gesture hooks & page sliding state variables
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [pageDirection, setPageDirection] = useState<'left' | 'right' | null>(null);

  // Navigates and updates page slide direction index
  const handleSetView = (newView: ViewType) => {
    const keys: ViewType[] = ['today', 'insights', 'trends', 'settings'];
    const oldIndex = keys.indexOf(view);
    const newIndex = keys.indexOf(newView);
    if (newIndex > oldIndex) {
      setPageDirection('right');
    } else if (newIndex < oldIndex) {
      setPageDirection('left');
    }
    setView(newView);
  };

  // Wrapper updaters that write state to both IndexedDB and LocalStorage in parallel
  const updateHabitsState = async (newHabits: Habit[]) => {
    setHabits(newHabits);
    localStorage.setItem('pwa_habits_tracker_habits', JSON.stringify(newHabits));
    await setVal('pwa_habits_tracker_habits', newHabits);
  };

  const updateCompletionsState = async (newCompletions: HabitCompletion[]) => {
    setCompletions(newCompletions);
    localStorage.setItem('pwa_habits_tracker_completions', JSON.stringify(newCompletions));
    await setVal('pwa_habits_tracker_completions', newCompletions);
  };

  const updateProgressState = async (newProgress: HabitProgress[]) => {
    setProgress(newProgress);
    localStorage.setItem('pwa_habits_tracker_progress', JSON.stringify(newProgress));
    await setVal('pwa_habits_tracker_progress', newProgress);
  };

  const updateSettingsState = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pwa_habits_tracker_settings', JSON.stringify(newSettings));
    await setVal('pwa_habits_tracker_settings', newSettings);
  };

  const updateSubtaskCompletionsState = async (newVal: { [key: string]: boolean }) => {
    setSubtaskCompletions(newVal);
    localStorage.setItem('pwa_habits_tracker_subtasks', JSON.stringify(newVal));
    await setVal('pwa_habits_tracker_subtasks', newVal);
  };

  // Preheat dynamic theme background images in standard browser image cache and Cache Storage
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const urls = [lightBlueBg, lightPinkBg];
        // Standard preloading
        urls.forEach((url) => {
          const img = new Image();
          img.src = url;
        });

        // Offline pre-population for Safari & iOS PWAs standalone support
        if ('caches' in window) {
          const cache = await caches.open('habitloop-v2');
          await cache.addAll(urls);
          console.log('Preheating of theme backgrounds complete.');
        }
      } catch (e) {
        console.warn('Silent asset cache skip:', e);
      }
    };
    preloadAssets();
  }, []);

  // Initial state load from IndexedDB (with LocalStorage sync and seed generation)
  useEffect(() => {
    const loadState = async () => {
      try {
        let loadedHabits = await getVal<Habit[]>('pwa_habits_tracker_habits');
        let loadedCompletions = await getVal<HabitCompletion[]>('pwa_habits_tracker_completions');
        let loadedProgress = await getVal<HabitProgress[]>('pwa_habits_tracker_progress');
        let loadedSettings = await getVal<AppSettings>('pwa_habits_tracker_settings');
        let loadedSubtasks = await getVal<{ [key: string]: boolean }>('pwa_habits_tracker_subtasks');

        // Parallel storage synchronization logic (sync back empty indexedDB from LocalStorage)
        if (!loadedHabits) {
          const storedHabits = localStorage.getItem('pwa_habits_tracker_habits');
          if (storedHabits) {
            loadedHabits = JSON.parse(storedHabits);
            await setVal('pwa_habits_tracker_habits', loadedHabits);
          }
        }
        if (!loadedCompletions) {
          const storedCompletions = localStorage.getItem('pwa_habits_tracker_completions');
          if (storedCompletions) {
            loadedCompletions = JSON.parse(storedCompletions);
            await setVal('pwa_habits_tracker_completions', loadedCompletions);
          }
        }
        if (!loadedProgress) {
          const storedProgress = localStorage.getItem('pwa_habits_tracker_progress');
          if (storedProgress) {
            loadedProgress = JSON.parse(storedProgress);
            await setVal('pwa_habits_tracker_progress', loadedProgress);
          }
        }
        if (!loadedSettings) {
          const storedSettings = localStorage.getItem('pwa_habits_tracker_settings');
          if (storedSettings) {
            loadedSettings = JSON.parse(storedSettings);
            await setVal('pwa_habits_tracker_settings', loadedSettings);
          }
        }
        if (!loadedSubtasks) {
          const storedSubtasks = localStorage.getItem('pwa_habits_tracker_subtasks');
          if (storedSubtasks) {
            loadedSubtasks = JSON.parse(storedSubtasks);
            await setVal('pwa_habits_tracker_subtasks', loadedSubtasks);
          }
        }

        // Apply loaded values or generate fresh lists
        if (loadedHabits) {
          setHabits(loadedHabits);
        } else {
          setHabits(SEED_HABITS);
          await setVal('pwa_habits_tracker_habits', SEED_HABITS);
          localStorage.setItem('pwa_habits_tracker_habits', JSON.stringify(SEED_HABITS));
        }

        if (loadedCompletions && loadedProgress) {
          setCompletions(loadedCompletions);
          setProgress(loadedProgress);
        } else {
          const seededData = generateSeedCompletionsAndProgress();
          setCompletions(seededData.completions);
          setProgress(seededData.progress);
          await setVal('pwa_habits_tracker_completions', seededData.completions);
          await setVal('pwa_habits_tracker_progress', seededData.progress);
          localStorage.setItem('pwa_habits_tracker_completions', JSON.stringify(seededData.completions));
          localStorage.setItem('pwa_habits_tracker_progress', JSON.stringify(seededData.progress));
        }

        if (loadedSettings) {
          setSettings(loadedSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
          await setVal('pwa_habits_tracker_settings', DEFAULT_SETTINGS);
          localStorage.setItem('pwa_habits_tracker_settings', JSON.stringify(DEFAULT_SETTINGS));
        }

        if (loadedSubtasks) {
          setSubtaskCompletions(loadedSubtasks);
        } else {
          setSubtaskCompletions({});
        }
      } catch (error) {
        console.warn('IndexedDB initial load issue, syncing from LocalStorage:', error);
        // Resilient immediate LocalStorage fallback
        const storedHabits = localStorage.getItem('pwa_habits_tracker_habits');
        const storedCompletions = localStorage.getItem('pwa_habits_tracker_completions');
        const storedProgress = localStorage.getItem('pwa_habits_tracker_progress');
        const storedSettings = localStorage.getItem('pwa_habits_tracker_settings');
        const storedSubtasks = localStorage.getItem('pwa_habits_tracker_subtasks');

        setHabits(storedHabits ? JSON.parse(storedHabits) : SEED_HABITS);
        if (storedCompletions && storedProgress) {
          setCompletions(JSON.parse(storedCompletions));
          setProgress(JSON.parse(storedProgress));
        } else {
          const seededData = generateSeedCompletionsAndProgress();
          setCompletions(seededData.completions);
          setProgress(seededData.progress);
        }
        setSettings(storedSettings ? JSON.parse(storedSettings) : DEFAULT_SETTINGS);
        setSubtaskCompletions(storedSubtasks ? JSON.parse(storedSubtasks) : {});
      }
    };

    loadState();
  }, []);

  // Slide translation variants based on navigation direction
  const slideVariants = {
    enter: (direction: 'left' | 'right' | null) => ({
      x: direction === 'right' ? '100vw' : direction === 'left' ? '-100vw' : 0,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right' | null) => ({
      x: direction === 'right' ? '-100vw' : direction === 'left' ? '100vw' : 0,
      opacity: 0,
    }),
  };

  // Swiping touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distanceX = touchStart - touchEnd;
    const minSwipeDistance = 60; // 60px deliberate movement required

    // Ignore swipes if modifying active range slider inputs (workout timers, etc.)
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'range') {
      return;
    }

    if (Math.abs(distanceX) > minSwipeDistance) {
      const keys: ViewType[] = ['today', 'insights', 'trends', 'settings'];
      const currentIndex = keys.indexOf(view);

      if (distanceX > minSwipeDistance && currentIndex < keys.length - 1) {
        // Swipe Left finger direction -> slide forward (move right)
        triggerHapticImpulse();
        handleSetView(keys[currentIndex + 1]);
      } else if (distanceX < -minSwipeDistance && currentIndex > 0) {
        // Swipe Right finger direction -> slide backward (move left)
        triggerHapticImpulse();
        handleSetView(keys[currentIndex - 1]);
      }
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Play crisp ascending client-side custom synthesized check audio
  const playChimeSoundOutput = () => {
    if (!settings.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // Note 1: C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Note 2: E5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(659.25, now + 0.08);
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      // Note 3: G5
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.frequency.setValueAtTime(783.99, now + 0.16);
      gain3.gain.setValueAtTime(0.12, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);

      osc3.start(now + 0.16);
      osc3.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // Safe device haptics
  const triggerHapticImpulse = () => {
    if (settings.hapticFeedback && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (err) {
        // Silently catch sandboxed frame security constraints
      }
    }
  };

  // Toggle habit check state
  const handleToggleHabit = (habitId: string, date: string) => {
    triggerHapticImpulse();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    if (habit.habitType === 'on_off') {
      const exists = completions.some((c) => c.habitId === habitId && c.date === date);
      let updatedCompletions: HabitCompletion[];

      if (exists) {
        updatedCompletions = completions.filter((c) => !(c.habitId === habitId && c.date === date));
      } else {
        updatedCompletions = [...completions, { habitId, date }];
        setTimeout(() => playChimeSoundOutput(), 10);
      }
      updateCompletionsState(updatedCompletions);

      // Update corresponding progress
      const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
      let updatedProgress: HabitProgress[] = [...progress];
      const isCurrentlyCompleted = progress.some(p => p.habitId === habitId && p.date === date && p.value > 0);
      
      if (existsIndex >= 0) {
        updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: isCurrentlyCompleted ? 0 : 1 };
      } else {
        updatedProgress.push({ habitId, date, value: 1 });
      }
      updateProgressState(updatedProgress);
    } else {
      // For Time or Quantity, check toggle goes straight to targetGoal or 0
      const targetGoal = habit.habitType === 'quantity' ? (habit.quantityGoal || 15) : (habit.timeGoal || 120);
      
      const exists = completions.some((c) => c.habitId === habitId && c.date === date);
      let updatedCompletions: HabitCompletion[];

      if (exists) {
        updatedCompletions = completions.filter((c) => !(c.habitId === habitId && c.date === date));
      } else {
        updatedCompletions = [...completions, { habitId, date }];
        setTimeout(() => playChimeSoundOutput(), 10);
      }
      updateCompletionsState(updatedCompletions);

      const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
      let updatedProgress: HabitProgress[] = [...progress];
      const existsProgressVal = existsIndex >= 0 && progress[existsIndex].value >= targetGoal;
      
      if (existsIndex >= 0) {
        updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: existsProgressVal ? 0 : targetGoal };
      } else {
        updatedProgress.push({ habitId, date, value: targetGoal });
      }
      updateProgressState(updatedProgress);
    }
  };

  // Update progressive metrics dynamically (minutes check and counter logs)
  const handleUpdateProgress = (habitId: string, date: string, newValue: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const clampValue = Math.max(0, newValue);
    const targetGoal = habit.habitType === 'quantity' ? (habit.quantityGoal || 1) : (habit.timeGoal || 1);
    const isCompletedNow = clampValue >= targetGoal;

    let updatedProgress: HabitProgress[] = [];
    const existsIndex = progress.findIndex(p => p.habitId === habitId && p.date === date);
    if (existsIndex >= 0) {
      updatedProgress = [...progress];
      updatedProgress[existsIndex] = { ...updatedProgress[existsIndex], value: clampValue };
    } else {
      updatedProgress = [...progress, { habitId, date, value: clampValue }];
    }
    updateProgressState(updatedProgress);

    const exists = completions.some(c => c.habitId === habitId && c.date === date);
    let updatedCompletions: HabitCompletion[] = [...completions];
    if (isCompletedNow && !exists) {
      updatedCompletions.push({ habitId, date });
      setTimeout(() => playChimeSoundOutput(), 10);
    } else if (!isCompletedNow && exists) {
      updatedCompletions = completions.filter(c => !(c.habitId === habitId && c.date === date));
    }
    updateCompletionsState(updatedCompletions);
  };

  // Create custom habit
  const handleAddHabit = (newHabit: Omit<Habit, 'id' | 'createdAt'>) => {
    triggerHapticImpulse();
    const created: Habit = {
      ...newHabit,
      id: `habit-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...habits, created];
    updateHabitsState(updated);
  };

  // Edit custom habit properties
  const handleEditHabit = (editedHabit: Habit) => {
    triggerHapticImpulse();
    const updated = habits.map(h => h.id === editedHabit.id ? editedHabit : h);
    updateHabitsState(updated);
  };

  // Delete habit
  const handleDeleteHabit = (id: string) => {
    triggerHapticImpulse();
    const updatedHabits = habits.filter((h) => h.id !== id);
    const updatedCompletions = completions.filter((c) => c.habitId !== id);
    const updatedProgress = progress.filter((p) => p.habitId !== id);
    updateHabitsState(updatedHabits);
    updateCompletionsState(updatedCompletions);
    updateProgressState(updatedProgress);
  };

  // Clear achievements/progress for a single day only
  const handleClearDayCompletions = (date: string) => {
    triggerHapticImpulse();
    const updatedCompletions = completions.filter((c) => c.date !== date);
    const updatedProgress = progress.map((p) => p.date === date ? { ...p, value: 0 } : p);
    updateCompletionsState(updatedCompletions);
    updateProgressState(updatedProgress);
  };

  // Restores/clears all analytics, completions, database logs, and progress metrics to pristine state
  const handleResetAllData = () => {
    triggerHapticImpulse();
    updateCompletionsState([]);
    updateProgressState([]);
    updateHabitsState([]);
    updateSubtaskCompletionsState({});
  };

  // Save Settings
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    updateSettingsState(updated);
  };

  // Backup & Import Actions
  const handleExportDataString = () => {
    const payload = JSON.stringify({ habits, completions, progress, settings }, null, 2);
    // Create text download or copy to clipboard
    navigator.clipboard.writeText(payload)
      .then(() => alert('Tracker database JSON copied to your clipboard safely! Paste it into a text file to backup.'))
      .catch(() => alert('Export payload:\n\n' + payload));
  };

  const handleImportBackupPayload = (importStr: string): boolean => {
    try {
      const parsed = JSON.parse(importStr);
      if (parsed.habits && parsed.completions && parsed.settings) {
        updateHabitsState(parsed.habits);
        updateCompletionsState(parsed.completions);
        updateProgressState(parsed.progress || []);
        updateSettingsState(parsed.settings);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Wipe application data completely
  const handleWipeDatabase = () => {
    updateHabitsState([]);
    updateCompletionsState([]);
    updateProgressState([]);
    updateSettingsState(DEFAULT_SETTINGS);
    updateSubtaskCompletionsState({});
  };

  // Optional subtasks handlers
  const handleAddSubtask = (habitId: string, text: string) => {
    triggerHapticImpulse();
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const subtasks = h.subtasks || [];
        if (subtasks.length >= 3) return h;
        const newSubtask = {
          id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text: text.trim()
        };
        return {
          ...h,
          subtasks: [...subtasks, newSubtask]
        };
      }
      return h;
    });
    updateHabitsState(updated);
  };

  const handleDeleteSubtask = (habitId: string, subtaskId: string) => {
    triggerHapticImpulse();
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        return {
          ...h,
          subtasks: (h.subtasks || []).filter((st) => st.id !== subtaskId)
        };
      }
      return h;
    });
    updateHabitsState(updated);
  };

  const handleToggleSubtask = (subtaskId: string, date: string) => {
    triggerHapticImpulse();
    const key = `${date}_${subtaskId}`;
    const nextVal = !subtaskCompletions[key];
    const updated = {
      ...subtaskCompletions,
      [key]: nextVal
    };
    if (nextVal) {
      setTimeout(() => playChimeSoundOutput(), 10);
    }
    updateSubtaskCompletionsState(updated);
  };

  // Navigation Items
  const navItems = [
    { key: 'today', label: 'Today', icon: CheckCircle2 },
    { key: 'insights', label: 'Insights', icon: Sparkles },
    { key: 'trends', label: 'Trends', icon: TrendingUp },
    { key: 'settings', label: 'Settings', icon: SettingsIcon }
  ] as const;

  // Background images matching user request
  const bgStyle: React.CSSProperties = {
    backgroundImage: 
      settings.bgTheme === 'light_blue' 
        ? `url(${lightBlueBg})` 
        : settings.bgTheme === 'light_pink'
        ? `url(${lightPinkBg})`
        : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    backgroundColor: 
      settings.bgTheme === 'light_blue' 
        ? '#bae6fd' 
        : settings.bgTheme === 'light_pink'
        ? '#fbcfe8' 
        : undefined,
  };

  return (
    <div 
      className={`min-h-screen flex flex-col pb-20 md:pb-6 transition-all duration-300 select-none overflow-x-hidden ${
        settings.bgTheme && settings.bgTheme !== 'none' ? 'bg-transparent' : 'bg-neutral-50'
      }`} 
      style={bgStyle}
      id="app-root-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40 px-4 py-3 shadow-3xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-neutral-900 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-neutral-900">HabitLoop</h1>
            </div>
          </div>

          {/* Desktop Top Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-50 p-1 rounded-xl border border-neutral-150">
            {navItems.map((item) => {
              const active = view === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  id={`desktop-nav-${item.key}`}
                  onClick={() => handleSetView(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active 
                      ? 'bg-neutral-900 text-white shadow-3xs' 
                      : 'text-neutral-550 hover:bg-neutral-150 hover:text-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
              Cloud Offline
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 md:py-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={pageDirection}>
          <motion.div
            key={view}
            custom={pageDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {view === 'today' && (
              <TodayView
                habits={habits}
                completions={completions}
                progress={progress}
                onToggleHabit={handleToggleHabit}
                onEditHabit={handleEditHabit}
                onDeleteHabit={handleDeleteHabit}
                onUpdateProgress={handleUpdateProgress}
                userName={settings.userName}
                onClearDayCompletions={handleClearDayCompletions}
                bgTheme={settings.bgTheme}
                subtaskCompletions={subtaskCompletions}
                onAddSubtask={handleAddSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                onToggleSubtask={handleToggleSubtask}
              />
            )}
            
            {view === 'insights' && (
              <InsightsView
                habits={habits}
                completions={completions}
                dailyGoal={settings.dailyGoal}
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'trends' && (
              <TrendsView
                habits={habits}
                completions={completions}
                bgTheme={settings.bgTheme}
              />
            )}

            {view === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onAddHabit={handleAddHabit}
                onNavigateToday={() => handleSetView('today')}
                onResetAllData={handleResetAllData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Touch-Optimized Sticky Bottom Nav (Visible only on mobile devices) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-100 px-4 py-2 flex justify-around md:hidden z-40 shadow-xl pb-safe">
        {navItems.map((item) => {
          const active = view === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              id={`mobile-nav-${item.key}`}
              onClick={() => {
                triggerHapticImpulse();
                handleSetView(item.key);
              }}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg w-16 transition-all text-[10px] font-bold cursor-pointer outline-hidden ${
                active 
                  ? 'text-neutral-900 bg-neutral-50 scale-102 font-bold' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5px] text-neutral-900' : 'stroke-[2px]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

