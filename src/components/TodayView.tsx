import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, Calendar, Sparkles, Dumbbell, Brain, Heart, BookOpen, Coins, Award, Trophy,
  Edit2, Save, HelpCircle, RotateCcw, Plus, Trash2
} from 'lucide-react';
import { Habit, HabitCompletion, HabitProgress } from '../types';

interface TodayViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  progress: HabitProgress[];
  onToggleHabit: (habitId: string, date: string) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateProgress: (habitId: string, date: string, value: number) => void;
  userName: string;
  onClearDayCompletions: (date: string) => void;
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
  subtaskCompletions: { [key: string]: boolean };
  onAddSubtask: (habitId: string, text: string) => void;
  onDeleteSubtask: (habitId: string, subtaskId: string) => void;
  onToggleSubtask: (subtaskId: string, date: string) => void;
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

const formatMinutes = (minutes: number): string => {
  if (minutes === 0) return '0 mins';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    if (mins > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${hrs} hr`;
  }
  return `${mins} min`;
};

const playCompletionSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      
      gainNode.gain.setValueAtTime(0, start);
      gainNode.gain.linearRampToValueAtTime(0.12, start + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    
    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.3, 'sine'); // C5
    playTone(659.25, now + 0.08, 0.3, 'sine'); // E5
    playTone(783.99, now + 0.16, 0.4, 'sine'); // G5
  } catch (err) {
    console.debug('AudioContext not allowed or not supported', err);
  }
};

export default function TodayView({
  habits,
  completions,
  progress,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onUpdateProgress,
  userName,
  onClearDayCompletions,
  bgTheme,
  subtaskCompletions,
  onAddSubtask,
  onDeleteSubtask,
  onToggleSubtask
}: TodayViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<{ [habitId: string]: string }>({});

  const handleAddSubtaskSubmit = (habitId: string) => {
    const text = newSubtaskInputs[habitId] || '';
    if (!text.trim()) return;
    onAddSubtask(habitId, text.trim());
    setNewSubtaskInputs(prev => ({ ...prev, [habitId]: '' }));
  };

  // Dynamic glassmorphic background configurations matching user request
  const getPanelClass = (additionalClasses = '', borderOverride = '') => {
    if (bgTheme === 'light_blue') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-xs ${additionalClasses}`;
    }
    if (bgTheme === 'light_pink') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-xs ${additionalClasses}`;
    }
    return `bg-white rounded-2xl border ${borderOverride || 'border-neutral-100'} shadow-xs ${additionalClasses}`;
  };

  const getHabitItemClass = () => {
    if (bgTheme === 'light_blue') {
      return 'bg-white/90 backdrop-blur-xs text-neutral-800 rounded-2xl p-5 border border-sky-200/80 shadow-xs transition-all flex flex-col space-y-4';
    }
    if (bgTheme === 'light_pink') {
      return 'bg-white/90 backdrop-blur-xs text-neutral-800 rounded-2xl p-5 border border-pink-200/80 shadow-xs transition-all flex flex-col space-y-4';
    }
    return 'bg-neutral-100 text-neutral-800 rounded-2xl p-5 border border-neutral-200 shadow-sm transition-all flex flex-col space-y-4';
  };

  const getInnerPanelClass = () => {
    if (bgTheme === 'light_blue') {
      return 'bg-white/95 rounded-xl p-3 border border-sky-100 flex flex-row items-center justify-between gap-3';
    }
    if (bgTheme === 'light_pink') {
      return 'bg-white/95 rounded-xl p-3 border border-pink-100 flex flex-row items-center justify-between gap-3';
    }
    return 'bg-white rounded-xl p-3 border border-neutral-200 flex flex-row items-center justify-between gap-3';
  };

  // Generate date carousel items (last 7 days)
  const getDatesCarousel = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isToday = d.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      dates.push({
        iso: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday
      });
    }
    return dates;
  };

  const datesCarousel = getDatesCarousel();

  // Retrieve current metrics
  const isHabitCompletedForDate = (habitId: string, date: string): boolean => {
    return completions.some(c => c.habitId === habitId && c.date === date);
  };

  const getHabitProgressValue = (habitId: string, date: string): number => {
    const record = progress.find(p => p.habitId === habitId && p.date === date);
    return record ? record.value : 0;
  };

  const selectedCompletionsCount = habits.filter(h => isHabitCompletedForDate(h.id, selectedDate)).length;
  const selectedCompletionRate = habits.length > 0 
    ? Math.round((selectedCompletionsCount / habits.length) * 100) 
    : 0;

  const handleUpdateHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editingHabit.name.trim()) return;
    onEditHabit(editingHabit);
    setEditingHabit(null);
  };

  const getCategoryDetails = (catName: string) => {
    const found = CATEGORIES.find(c => c.name === catName);
    return found || { icon: HelpCircle, color: 'text-neutral-500 bg-neutral-50 border-neutral-100' };
  };

  const selectedDateLabel = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) return 'Today';
    
    const dateObj = new Date(selectedDate + 'T00:00:00');
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8" id="today-view-root">
      {/* Dynamic Status Progress Card */}
      <div className={getPanelClass("p-4 sm:p-6 flex flex-row justify-between items-center gap-3 sm:gap-4 w-full")}>
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-extrabold text-neutral-800 tracking-tight flex items-center gap-1.5 sm:gap-2">
            Hello, {userName || 'Dreamer'} <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 animate-pulse" />
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-neutral-700 mt-1 truncate">
            {selectedDate === new Date().toISOString().split('T')[0] 
              ? "Let's track and log your custom habits." 
              : `Viewing log entries for ${selectedDateLabel()}`}
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[9px] sm:text-xs font-bold text-neutral-700 block leading-tight">Daily Accomplishment</span>
            <span className="text-xs sm:text-sm font-black text-neutral-750">{selectedCompletionsCount} of {habits.length} ({selectedCompletionRate}%)</span>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                className="text-neutral-100"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                className="text-neutral-905 transition-all duration-500 ease-out text-violet-600"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - selectedCompletionRate / 100)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-bold text-neutral-700">{selectedCompletionRate}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Week Carousel */}
      <div className={getPanelClass("p-4")}>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Track Schedule
          </h3>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
            {selectedDateLabel()}
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {datesCarousel.map((item) => {
            const isSelected = item.iso === selectedDate;
            const dayComps = habits.filter(h => isHabitCompletedForDate(h.id, item.iso)).length;
            const completionRate = habits.length > 0 ? (dayComps / habits.length) : 0;
            
            return (
              <button
                key={item.iso}
                id={`date-${item.iso}`}
                onClick={() => setSelectedDate(item.iso)}
                className={`py-3 px-1.5 rounded-xl flex flex-col items-center justify-between transition-all outline-hidden text-center cursor-pointer ${
                  isSelected 
                    ? 'bg-neutral-900 text-white shadow-xs scale-102 font-medium' 
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-100'
                }`}
              >
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {item.dayName}
                </span>
                <span className="text-sm font-extrabold my-1 leading-none">{item.dayNum}</span>
                <div className="flex gap-0.5 mt-0.5 items-center justify-center">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    completionRate === 1 
                      ? 'bg-emerald-500' 
                      : completionRate >= 0.5 
                        ? 'bg-violet-500' 
                        : completionRate > 0 
                          ? 'bg-amber-400' 
                          : 'bg-neutral-300'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Habit Output List (Styled EXACTLY per standard screenshot) */}
      <div className="space-y-4" id="essential-habits-output-list">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-neutral-800 uppercase tracking-wider">
            Essential Habits for {selectedDateLabel()} ({habits.length})
          </h3>
        </div>

        {habits.length === 0 && (
          <div className="bg-neutral-50 rounded-2xl p-10 text-center border-dashed border-2 border-neutral-200 flex flex-col items-center">
            <Award className="w-10 h-10 text-neutral-300 mb-2 animate-bounce" />
            <span className="text-sm font-bold text-neutral-600 block">No Active Habits</span>
            <span className="text-xs text-neutral-400 mt-1 max-w-sm">
              Configure habit elements in the Settings page to begin.
            </span>
          </div>
        )}

        <div className="space-y-3.5">
          {habits.map((habit) => {
            const isCompleted = isHabitCompletedForDate(habit.id, selectedDate);
            const progressVal = getHabitProgressValue(habit.id, selectedDate);
            const catInfo = getCategoryDetails(habit.category);

            let percent = 0;
            if (habit.habitType === 'quantity') {
              percent = Math.min(100, Math.round((progressVal / (habit.quantityGoal || 1)) * 100));
            } else if (habit.habitType === 'time') {
              percent = Math.min(100, Math.round((progressVal / (habit.timeGoal || 1)) * 100));
            } else if (habit.habitType === 'on_off') {
              percent = isCompleted ? 100 : 0;
            }

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={habit.id}
                className={getHabitItemClass()}
              >
                {/* Visual Header Grid */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl border ${catInfo.color}`}>
                      {React.createElement(catInfo.icon, { className: 'w-4.5 h-4.5' })}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-extrabold tracking-tight ${isCompleted ? 'text-neutral-450 line-through' : 'text-neutral-900'}`}>
                          {habit.name}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-md border border-neutral-300">
                          {habit.category}
                        </span>
                      </div>
                      
                      {/* Formatted metadata matching the user image list */}
                      <span className="text-[10px] uppercase font-bold tracking-widest text-violet-605 block mt-1">
                        {habit.habitType === 'quantity' && `counter • Goal: ${habit.quantityGoal} ${habit.quantityUnit}`}
                        {habit.habitType === 'time' && `timer • Goal: ${formatMinutes(habit.timeGoal || 0)}`}
                        {habit.habitType === 'on_off' && `on/off`}
                      </span>
                    </div>
                  </div>

                  {/* Operational Settings: Delete on same row */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      id={`btn-delete-${habit.id}`}
                      onClick={() => onDeleteHabit(habit.id)}
                      className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Progress Meter with check mark only */}
                <div className={getInnerPanelClass()}>
                  
                  {/* Simplistic check mark only controller */}
                  <div className="flex items-center gap-3">
                    <button
                      id={`btn-complete-${habit.id}`}
                      onClick={() => {
                        const nextComplete = !isCompleted;
                        if (nextComplete) {
                          playCompletionSound();
                        }
                        onToggleHabit(habit.id, selectedDate);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                        isCompleted
                          ? `border-emerald-500 bg-emerald-500 text-white shadow-xs`
                          : `border-neutral-300 hover:border-neutral-400 bg-neutral-50 text-transparent`
                      }`}
                      title={isCompleted ? "Completed! Tap to undo" : "Tap to complete"}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </button>
                    
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">
                        {isCompleted ? 'Completed For Today' : 'Mark Completed'}
                      </span>
                      <span className="text-sm font-black text-neutral-700 block mt-0.5 uppercase tracking-wide">
                        {habit.habitType === 'quantity' && `Goal: ${habit.quantityGoal} ${habit.quantityUnit}`}
                        {habit.habitType === 'time' && `Goal: ${formatMinutes(habit.timeGoal || 0)}`}
                        {habit.habitType === 'on_off' && `Checkoff challenge`}
                      </span>
                    </div>
                  </div>

                  {/* Micro horizontal status progress line or percentage replaced by an animated Trophy */}
                  <div className="shrink-0 flex items-center pr-1.5">
                    <motion.div
                      key={isCompleted ? "trophy-active" : "trophy-inactive"}
                      animate={isCompleted ? {
                        scale: [1, 1.4, 0.9, 1.25, 1],
                        rotate: [0, -15, 15, -8, 8, 0],
                      } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-amber-100 border-amber-300 text-amber-500 shadow-xs'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-300'
                      }`}
                      title={isCompleted ? "Completed Trophy unlocked!" : "Trophy locked"}
                    >
                      <Trophy className={`w-5 h-5 ${isCompleted ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    </motion.div>
                  </div>
                </div>

                {/* Optional Subtasks Section */}
                <div className="mt-2 space-y-3 pt-2 border-t border-dashed border-neutral-200/80">
                  {/* List of existing subtasks */}
                  {(habit.subtasks || []).map((subtask) => {
                    const isSubtaskChecked = !!subtaskCompletions[`${selectedDate}_${subtask.id}`];
                    return (
                      <div key={subtask.id} className="flex items-center gap-3 w-full animate-fadeIn">
                        <div className="flex-1 bg-white rounded-xl p-3 border border-neutral-200 flex items-center justify-between gap-3 shadow-3xs">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onToggleSubtask(subtask.id, selectedDate)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer ${
                                isSubtaskChecked
                                  ? 'border-neutral-300 bg-neutral-100 text-neutral-500'
                                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            </button>
                            <span className={`text-xs font-bold transition-all ${isSubtaskChecked ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                              {subtask.text}
                            </span>
                          </div>
                        </div>
                        {/* Red circular delete button matching the screenshot */}
                        <button
                          type="button"
                          onClick={() => onDeleteSubtask(habit.id, subtask.id)}
                          className="w-10 h-10 rounded-full bg-[#E12C2C] text-white flex items-center justify-center hover:bg-red-700 transition-all font-bold shadow-md cursor-pointer shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add action row (maximum of 3 subtasks) */}
                  {(!habit.subtasks || habit.subtasks.length < 3) ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1 bg-white rounded-xl p-2 px-3 border border-neutral-150 flex items-center gap-3 shadow-3xs">
                        <button
                          type="button"
                          onClick={() => handleAddSubtaskSubmit(habit.id)}
                          className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 flex items-center justify-center transition-colors shrink-0 shadow-3xs cursor-pointer"
                          title="Create optional task"
                        >
                          <Plus className="w-4.5 h-4.5 stroke-[3]" />
                        </button>
                        <input
                          type="text"
                          placeholder="Add task optional"
                          value={newSubtaskInputs[habit.id] || ''}
                          onChange={(e) => setNewSubtaskInputs({ ...newSubtaskInputs, [habit.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtaskSubmit(habit.id);
                            }
                          }}
                          className="flex-1 bg-transparent text-xs font-bold text-neutral-800 outline-hidden placeholder-neutral-400 border-none h-8 py-1"
                        />
                      </div>
                      
                      {/* Subtask draft helper delete or reset icon when typing */}
                      <button
                        type="button"
                        onClick={() => setNewSubtaskInputs({ ...newSubtaskInputs, [habit.id]: '' })}
                        className={`w-10 h-10 rounded-full bg-[#E12C2C] text-white flex items-center justify-center transition-all font-bold shadow-md cursor-pointer shrink-0 ${
                          newSubtaskInputs[habit.id] ? 'opacity-100 scale-100' : 'opacity-40 scale-100 hover:opacity-100'
                        }`}
                        title="Clear typing"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-neutral-400 capitalize text-center py-1 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                      Maximum 3 tasks reached total. Remove a task to unlock slots.
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {habits.length > 0 && (
          <div className="flex justify-center pt-4" id="clear-day-completions-container">
            <button
              id="btn-clear-day-completions"
              onClick={() => onClearDayCompletions(selectedDate)}
              className="flex items-center gap-2 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-bold hover:text-neutral-800 text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all cursor-pointer shadow-3xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear all check marks for this day
            </button>
          </div>
        )}
      </div>

      {/* Modern Dialog sheet for editing a habit's properties seamlessly (Matches screenshot layout Edit action) */}
      <AnimatePresence>
        {editingHabit && (
          <div className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-neutral-950/65 backdrop-blur-xs p-0 sm:p-4 animate-none">
            <motion.div
              initial={{ translateY: '100%' }}
              animate={{ translateY: '0%' }}
              exit={{ translateY: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden max-h-[92vh]"
            >
              <div className="p-5 border-b border-neutral-150 flex justify-between items-center bg-neutral-25">
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Edit2 className="w-4 h-4 text-indigo-600" /> Edit Habit Parameters
                  </h3>
                  <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Change parameters such as target metrics or colors.</p>
                </div>
                <button
                  id="btn-close-edit-dialog"
                  onClick={() => setEditingHabit(null)}
                  className="text-neutral-400 hover:text-neutral-600 p-1.5 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpdateHabitSubmit} className="p-5 space-y-4 overflow-y-auto bg-neutral-25/40">
                {/* Habit Name */}
                <div className="space-y-1">
                  <label htmlFor="edit-habit-name" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Habit Name</label>
                  <input
                    id="edit-habit-name"
                    type="text"
                    required
                    value={editingHabit.name}
                    onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                    className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-lg px-2.5 py-2 outline-hidden bg-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label htmlFor="edit-habit-desc" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Description</label>
                  <input
                    id="edit-habit-desc"
                    type="text"
                    value={editingHabit.description}
                    onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                    className="w-full text-xs border border-neutral-200 focus:border-neutral-900 rounded-lg px-2.5 py-2 outline-hidden bg-white"
                  />
                </div>

                {/* Category & Accent selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="edit-habit-category" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Category</label>
                    <select
                      id="edit-habit-category"
                      value={editingHabit.category}
                      onChange={(e) => setEditingHabit({ ...editingHabit, category: e.target.value })}
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2 bg-white"
                    >
                      {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="edit-habit-color" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Accent Color</label>
                    <select
                      id="edit-habit-color"
                      value={editingHabit.color}
                      onChange={(e) => setEditingHabit({ ...editingHabit, color: e.target.value })}
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2 bg-white"
                    >
                      {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Specific metrics modifiers */}
                {editingHabit.habitType === 'quantity' && (
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-neutral-150">
                    <div className="space-y-1">
                      <label htmlFor="edit-qty-unit" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Unit Label</label>
                      <input
                        id="edit-qty-unit"
                        type="text"
                        required
                        value={editingHabit.quantityUnit || ''}
                        onChange={(e) => setEditingHabit({ ...editingHabit, quantityUnit: e.target.value })}
                        className="w-full text-xs border border-neutral-200 rounded-lg py-1 px-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="edit-qty-max" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Max Goal</label>
                      <input
                        id="edit-qty-max"
                        type="number"
                        required
                        value={editingHabit.quantityGoal || ''}
                        onChange={(e) => setEditingHabit({ ...editingHabit, quantityGoal: parseInt(e.target.value) || 1 })}
                        className="w-full text-xs border border-neutral-200 rounded-lg py-1 px-2 font-bold"
                      />
                    </div>
                  </div>
                )}

                {editingHabit.habitType === 'time' && (
                  <div className="bg-white p-3 rounded-lg border border-neutral-150 space-y-1">
                    <label htmlFor="edit-time-min" className="text-[10px] font-extrabold text-neutral-400 block uppercase font-bold">Target Goal (Total Minutes)</label>
                    <input
                      id="edit-time-min"
                      type="number"
                      required
                      value={editingHabit.timeGoal || ''}
                      onChange={(e) => setEditingHabit({ ...editingHabit, timeGoal: parseInt(e.target.value) || 1 })}
                      className="w-full text-xs border border-neutral-200 rounded-lg p-2 font-bold"
                    />
                  </div>
                )}

                <button
                  id="btn-save-habit-changes"
                  type="submit"
                  className="w-full bg-neutral-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs hover:bg-neutral-800 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save Habit Parameters
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
