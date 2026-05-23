import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Volume2, Check, Smartphone, Sliders, Dumbbell, Brain, Heart, BookOpen, Coins, Clock, Sparkles, X, Info, AlertTriangle, RotateCcw
} from 'lucide-react';
import { AppSettings, Habit } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onNavigateToday: () => void;
  onResetAllData: () => void;
}

const CATEGORIES = [
  { name: 'Fitness', icon: Dumbbell, color: 'text-rose-500 bg-rose-50 border-rose-100' },
  { name: 'Mind', icon: Brain, color: 'text-violet-500 bg-violet-50 border-violet-100' },
  { name: 'Health', icon: Heart, color: 'text-teal-500 bg-teal-50 border-teal-100' },
  { name: 'Productivity', icon: BookOpen, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  { name: 'Finance', icon: Coins, color: 'text-sky-500 bg-sky-50 border-sky-100' },
];

const COLORS = [
  { name: 'rose', border: 'border-rose-200', text: 'text-rose-600', bg: 'bg-rose-500 hover:bg-rose-600' },
  { name: 'violet', border: 'border-violet-200', text: 'text-violet-600', bg: 'bg-violet-500 hover:bg-violet-600' },
  { name: 'teal', border: 'border-teal-200', text: 'text-teal-600', bg: 'bg-teal-500 hover:bg-teal-600' },
  { name: 'amber', border: 'border-amber-200', text: 'text-amber-600', bg: 'bg-amber-500 hover:bg-amber-600' },
  { name: 'sky', border: 'border-sky-200', text: 'text-sky-600', bg: 'bg-sky-500 hover:bg-sky-600' },
];

export default function SettingsView({
  settings,
  onUpdateSettings,
  onAddHabit,
  onNavigateToday,
  onResetAllData
}: SettingsViewProps) {
  const [userName, setUserName] = useState(settings.userName);
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal);
  const [isSaved, setIsSaved] = useState(false);
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Dynamic glassmorphic background configurations matching user request
  const getPanelClass = (additionalClasses = '', borderOverride = '') => {
    if (settings.bgTheme === 'light_blue') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-xs ${additionalClasses}`;
    }
    if (settings.bgTheme === 'light_pink') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-xs ${additionalClasses}`;
    }
    return `bg-white rounded-2xl border ${borderOverride || 'border-neutral-150'} shadow-xs ${additionalClasses}`;
  };

  // Form states moved from TodayView
  const [timeName, setTimeName] = useState('');
  const [timeHours, setTimeHours] = useState(1);
  const [timeMinutes, setTimeMinutes] = useState(30);
  const [timeCategory, setTimeCategory] = useState('Fitness');
  const [timeColor, setTimeColor] = useState('rose');

  const [qtyName, setQtyName] = useState('');
  const [qtyUnit, setQtyUnit] = useState('cups');
  const [qtyMaxGoal, setQtyMaxGoal] = useState(5);
  const [qtyCategory, setQtyCategory] = useState('Health');
  const [qtyColor, setQtyColor] = useState('sky');

  const [onoffName, setOnoffName] = useState('');
  const [onoffCategory, setOnoffCategory] = useState('Mind');
  const [onoffColor, setOnoffColor] = useState('violet');

  const triggerCreatedNotification = () => {
    setShowCreatedMessage(true);
    // Auto scroll to top where the notification is displayed
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Dissipate toast alert after 6 seconds
    const timer = setTimeout(() => {
      setShowCreatedMessage(false);
    }, 6000);
    return () => clearTimeout(timer);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ 
      userName: userName.trim() || 'Dreamer', 
      dailyGoal 
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  const handleCreateTimeHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeName.trim()) return;
    const totalMinutes = (timeHours * 60) + timeMinutes;
    onAddHabit({
      name: timeName.trim(),
      description: 'Time commitment target',
      category: timeCategory,
      frequency: 'daily',
      color: timeColor,
      icon: 'Clock',
      habitType: 'time',
      timeGoal: totalMinutes
    });
    setTimeName('');
    setTimeHours(1);
    setTimeMinutes(30);
    triggerCreatedNotification();
  };

  const handleCreateQuantityHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qtyName.trim()) return;
    onAddHabit({
      name: qtyName.trim(),
      description: 'Cumulative quantity tracker',
      category: qtyCategory,
      frequency: 'daily',
      color: qtyColor,
      icon: 'Heart',
      habitType: 'quantity',
      quantityGoal: qtyMaxGoal,
      quantityUnit: qtyUnit || 'units'
    });
    setQtyName('');
    setQtyUnit('cups');
    setQtyMaxGoal(5);
    triggerCreatedNotification();
  };

  const handleCreateOnOffHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onoffName.trim()) return;
    onAddHabit({
      name: onoffName.trim(),
      description: 'Simple checklist milestone',
      category: onoffCategory,
      frequency: 'daily',
      color: onoffColor,
      icon: 'Brain',
      habitType: 'on_off'
    });
    setOnoffName('');
    triggerCreatedNotification();
  };

  return (
    <div className="space-y-8" id="settings-view-container">
      {/* Dynamic Success Modal Dialog for Created Habit */}
      <AnimatePresence>
        {showCreatedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-2xl max-w-sm w-full text-center relative"
            >
              <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-full p-4 w-14 h-14 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 stroke-[3.5]" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-800 uppercase tracking-wider">Habit Created!</h3>
              <p className="text-sm font-semibold text-neutral-600 mt-2">
                Habit was created check Today page.
              </p>
              
              <div className="flex flex-col gap-2.5 mt-6">
                <button
                  id="modal-btn-navigate"
                  onClick={() => {
                    setShowCreatedMessage(false);
                    onNavigateToday();
                  }}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                >
                  Check Today Page
                </button>
                <button
                  id="modal-btn-close"
                  onClick={() => setShowCreatedMessage(false)}
                  className="w-full border border-neutral-200 hover:bg-neutral-50 font-bold py-2.5 px-4 rounded-xl text-xs text-neutral-500 uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Keep Creating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Title Header */}
      <div className="border-b border-neutral-100 pb-3">
        <h2 className="text-lg font-extrabold text-neutral-800 tracking-tight flex items-center gap-2">
          Habit Configurations & Settings <Sparkles className="w-5 h-5 text-indigo-500" />
        </h2>
        <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Customize your nickname and configure habit templates here.</p>
      </div>

      {/* Profile & preferences row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* Profile/Goal setting section */}
        <div className={getPanelClass("p-5 w-full max-w-[400px] h-full")}>
          <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-indigo-700" /> Profile Configurations
          </h3>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* UserName Input */}
            <div className="space-y-1">
              <label htmlFor="settings-username" className="text-xs font-bold text-neutral-500 block">CHOSEN NICKNAME</label>
              <input
                id="settings-username"
                type="text"
                placeholder="e.g., Luis, Guillermo"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-xl px-3 py-2.5 outline-hidden transition-all bg-neutral-50/50 animate-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-save-profile"
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Saved Successfully!
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sound Preferences Section */}
        <div className={getPanelClass("p-5 w-full max-w-[400px] h-full flex flex-col justify-between")}>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2 mb-4">
              <Volume2 className="w-4 h-4 text-indigo-700" /> Sound Preferences
            </h3>

            <div className="py-2.5">
              {/* Sounds */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-700 block">Sound</span>
                </div>
                <button
                  id="toggle-settings-sound"
                  type="button"
                  onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                    settings.soundEnabled ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Background Theme Card */}
        <div className={getPanelClass("p-5 w-full max-w-[400px] h-full")}>
          <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-indigo-700" /> App Background
          </h3>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-neutral-500 block uppercase tracking-wider">Background Theme</span>
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: None */}
              <button
                id="btn-bg-theme-none"
                type="button"
                onClick={() => onUpdateSettings({ bgTheme: 'none' })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                  settings.bgTheme === 'none' || !settings.bgTheme
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-3xs font-bold scale-[1.02]'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                }`}
              >
                <div className="w-full h-8 rounded-lg bg-neutral-100 border border-neutral-200 mb-1 flex items-center justify-center text-[10px] text-neutral-400 font-mono">
                  None
                </div>
                <span className="text-[9px] font-bold leading-tight block truncate">Plain Minimal</span>
              </button>

              {/* Option 2: Light Blue */}
              <button
                id="btn-bg-theme-blue"
                type="button"
                onClick={() => onUpdateSettings({ bgTheme: 'light_blue' })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                  settings.bgTheme === 'light_blue'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-3xs font-bold scale-[1.02]'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                }`}
              >
                <div className="w-full h-8 rounded-lg bg-sky-200 border border-sky-300 mb-1 flex items-center justify-center text-[9px] text-sky-850 font-mono overflow-hidden">
                  <span className="text-[8px] opacity-75 leading-tight font-bold text-sky-700">Blue</span>
                </div>
                <span className="text-[9px] font-bold leading-tight block truncate">Light Blue</span>
              </button>

              {/* Option 3: Light Pink */}
              <button
                id="btn-bg-theme-pink"
                type="button"
                onClick={() => onUpdateSettings({ bgTheme: 'light_pink' })}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center cursor-pointer ${
                  settings.bgTheme === 'light_pink'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-3xs font-bold scale-[1.02]'
                    : 'border-neutral-200 hover:border-neutral-400 bg-white text-neutral-700'
                }`}
              >
                <div className="w-full h-8 rounded-lg bg-pink-100 border border-pink-200 mb-1 flex items-center justify-center text-[9px] text-pink-850 font-mono overflow-hidden">
                  <span className="text-[8px] opacity-75 leading-tight font-bold text-pink-600">Pink</span>
                </div>
                <span className="text-[9px] font-bold leading-tight block truncate">Light Pink</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Your Habit Wizards (Moved to the Setting page) */}
      <div className="space-y-4" id="habits-creation-panel">
        <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider px-1">
          Configure Your Habits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: TIME Habit Creation */}
          <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  TIME
                </span>
                <Clock className="w-4 h-4 text-rose-600" />
              </div>
              
              <form onSubmit={handleCreateTimeHabit} className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="time-name" className="text-[10px] font-extrabold text-neutral-400 block uppercase">Habit Name</label>
                  <input
                    id="time-name"
                    type="text"
                    required
                    placeholder="e.g., Gym Workout, Active Running"
                    value={timeName}
                    onChange={(e) => setTimeName(e.target.value)}
                    className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-lg px-2.5 py-2 outline-hidden bg-neutral-50"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-neutral-400 block uppercase">Target Goal</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="time-hours" className="sr-only">Hours</label>
                      <input
                        id="time-hours"
                        type="number"
                        min="0"
                        max="23"
                        placeholder="Hr"
                        value={timeHours || ''}
                        onChange={(e) => setTimeHours(parseInt(e.target.value) || 0)}
                        className="w-full text-xs border border-neutral-200 text-center rounded-lg py-1.5 bg-neutral-50 font-bold"
                      />
                      <span className="text-[9px] text-neutral-400 block text-center mt-1">Hours</span>
                    </div>
                    <div>
                      <label htmlFor="time-minutes" className="sr-only">Minutes</label>
                      <input
                        id="time-minutes"
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Min"
                        value={timeMinutes || ''}
                        onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 0)}
                        className="w-full text-xs border border-neutral-200 text-center rounded-lg py-1.5 bg-neutral-50 font-bold"
                      />
                      <span className="text-[9px] text-neutral-400 block text-center mt-1">Min</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label htmlFor="time-cat-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Category</label>
                    <select
                      id="time-cat-select"
                      value={timeCategory}
                      onChange={(e) => setTimeCategory(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="time-color-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Accent</label>
                    <select
                      id="time-color-select"
                      value={timeColor}
                      onChange={(e) => setTimeColor(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  id="btn-create-time-habit"
                  type="submit"
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  CREATE HABIT
                </button>
              </form>
            </div>
            
            <p className="text-[11px] text-neutral-600 font-bold italic pt-2 border-t border-neutral-100">
              "If you go to the gym and want it as a habit set a time habit."
            </p>
          </div>

          {/* Card 2: Count Habit Creation */}
          <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Count
                </span>
                <Heart className="w-4 h-4 text-sky-600" />
              </div>

              <form onSubmit={handleCreateQuantityHabit} className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="qty-name" className="text-[10px] font-extrabold text-neutral-400 block uppercase">Habit Name</label>
                  <input
                    id="qty-name"
                    type="text"
                    required
                    placeholder="e.g., Water Intake, Medicine"
                    value={qtyName}
                    onChange={(e) => setQtyName(e.target.value)}
                    className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-lg px-2.5 py-2 outline-hidden bg-neutral-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="qty-unit" className="text-[10px] font-extrabold text-neutral-400 block uppercase">Unit</label>
                    <input
                      id="qty-unit"
                      type="text"
                      required
                      placeholder="e.g., cups, pages"
                      value={qtyUnit}
                      onChange={(e) => setQtyUnit(e.target.value)}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 outline-hidden bg-neutral-50 text-center font-semibold animate-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="qty-max" className="text-[10px] font-extrabold text-neutral-400 block uppercase">Max Goal</label>
                    <input
                      id="qty-max"
                      type="number"
                      min="1"
                      placeholder="5"
                      value={qtyMaxGoal || ''}
                      onChange={(e) => setQtyMaxGoal(parseInt(e.target.value) || 1)}
                      className="w-full text-xs border border-neutral-200 rounded-lg px-2 py-1.5 outline-hidden bg-neutral-50 text-center font-bold animate-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label htmlFor="qty-cat-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Category</label>
                    <select
                      id="qty-cat-select"
                      value={qtyCategory}
                      onChange={(e) => setQtyCategory(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="qty-color-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Accent</label>
                    <select
                      id="qty-color-select"
                      value={qtyColor}
                      onChange={(e) => setQtyColor(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  id="btn-create-qty-habit"
                  type="submit"
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  CREATE HABIT
                </button>
              </form>
            </div>

            <p className="text-[11px] text-neutral-600 font-bold italic pt-2 border-t border-neutral-100">
              "For water consumption, medication use Count."
            </p>
          </div>

          {/* Card 3: On and Off Habit Creation */}
          <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-violet-800 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  On/Off
                </span>
                <Brain className="w-4 h-4 text-violet-600" />
              </div>

              <form onSubmit={handleCreateOnOffHabit} className="mt-4 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="onoff-name" className="text-[10px] font-extrabold text-neutral-400 block uppercase">Habit Name</label>
                  <input
                    id="onoff-name"
                    type="text"
                    required
                    placeholder="e.g., Zen Meditation, Read Book"
                    value={onoffName}
                    onChange={(e) => setOnoffName(e.target.value)}
                    className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-lg px-2.5 py-2 outline-hidden bg-neutral-50"
                  />
                </div>

                {/* Double check visual */}
                <div className="flex items-center justify-center py-3">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full p-2 animate-bounce">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label htmlFor="onoff-cat-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Category</label>
                    <select
                      id="onoff-cat-select"
                      value={onoffCategory}
                      onChange={(e) => setOnoffCategory(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="onoff-color-select" className="text-[9px] font-bold text-neutral-400 block uppercase mb-1">Accent</label>
                    <select
                      id="onoff-color-select"
                      value={onoffColor}
                      onChange={(e) => setOnoffColor(e.target.value)}
                      className="w-full text-[10px] border border-neutral-200 rounded-md p-1 bg-white font-semibold animate-none"
                    >
                      {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  id="btn-create-onoff-habit"
                  type="submit"
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2 px-3 rounded-lg hover:bg-neutral-800 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  CREATE HABIT
                </button>
              </form>
            </div>

            <p className="text-[11px] text-neutral-600 font-bold italic pt-2 border-t border-neutral-100">
              "For simple task just create and On Off check mark."
            </p>
          </div>
        </div>
      </div>

      {/* Visual System Reset Section */}
      <div className="bg-red-50/40 rounded-2xl p-5 border border-red-100 shadow-3xs" id="system-reset-section-card">
        <h3 className="text-sm font-bold tracking-tight text-red-800 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-600" /> System Factory Reset
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed mb-4">
          Permanently erase all historical progress completions, habit logs, records, score metrics, and reset everything back to baseline defaults.
        </p>
        <button
          id="btn-trigger-factory-reset"
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-3xs hover:shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Data
        </button>
      </div>

      {/* Factory Reset Confirmation Dialog Popup */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs" id="factory-reset-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-neutral-150 p-6 shadow-2xl max-w-sm w-full relative"
              id="factory-reset-modal-container"
            >
              <div className="mx-auto bg-red-100 text-red-600 rounded-full p-4 w-14 h-14 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-extrabold text-neutral-800 text-center uppercase tracking-wider">Warning: Reset All Data?</h3>
              <p className="text-xs font-semibold text-neutral-500 text-center mt-3 leading-relaxed">
                This will permanently delete all your habit checklists, completed tracking history, streak metrics, and profile custom settings. This action is irreversible.
              </p>
              
              <div className="flex flex-col gap-2 mt-6">
                <button
                  id="confirm-reset-btn"
                  onClick={() => {
                    onResetAllData();
                    setShowResetConfirm(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                >
                  Yes, Reset All Data
                </button>
                <button
                  id="cancel-reset-btn"
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full border border-neutral-200 hover:bg-neutral-50 font-bold py-2.5 px-4 rounded-xl text-xs text-neutral-500 uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Installation Instruction Block */}
      <div className={getPanelClass("p-5 flex flex-col md:flex-row gap-4 items-start")}>
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="space-y-3 w-full">
          {typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
            // iPhone/iPad specific instructions
            <div className="space-y-2">
              <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Apple iOS iPhone/iPad Installation
              </span>
              <p className="text-xs font-semibold text-neutral-800">
                To track your habits offline in full screen, you must add this app to your Home Screen using only Safari.
              </p>
              <div className="text-[11px] text-neutral-500 space-y-1.5 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-indigo-600 select-none">1.</span>
                  <span>Open this exact URL in the <strong>Safari</strong> browser (other browsers on iOS do not support standalone installation).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-indigo-600 select-none">2.</span>
                  <span>Tap the <strong>Share</strong> button <span className="inline-flex items-center justify-center border border-neutral-200 px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-mono font-bold">↑</span> in the center of the bottom navigation bar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-indigo-600 select-none">3.</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong> <span className="inline-flex items-center justify-center border border-neutral-200 px-1.5 py-0.5 rounded bg-neutral-100 text-[10px] font-mono font-bold">+</span> to place the tracker icon on your device.</span>
                </div>
              </div>
            </div>
          ) : (
            // General / Desktop / Android instructions for when published and downloading
            <div className="space-y-2 pt-0.5">
              <span className="inline-block text-[9px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Add App to Home Screen
              </span>
              <p className="text-xs font-semibold text-neutral-800">
                Install this Habit Tracker to your device's Home Screen for offline, native full-screen tracking.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-neutral-550 pt-1">
                <div className="space-y-1.5 sm:border-r sm:border-neutral-200/55 sm:pr-4">
                  <span className="font-bold text-[10px] text-indigo-700 block uppercase tracking-wider">iPhone & iPad (Safari Only):</span>
                  <p className="leading-relaxed">
                    Open this link in <strong>Safari</strong>, tap the <strong>Share</strong> button <span className="text-neutral-700 font-bold">↑</span>, then select <strong>"Add to Home Screen"</strong> <span className="text-neutral-700 font-bold">+</span>. This app runs best on iOS using Safari only.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-[10px] text-indigo-700 block uppercase tracking-wider">Android & Desktop (Chrome/Edge):</span>
                  <p className="leading-relaxed">
                    Look for the <strong>Install Icon</strong> <span className="text-neutral-700 font-bold">⊕</span> or computer screen icon in your browser address bar, or open the browser menu and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
