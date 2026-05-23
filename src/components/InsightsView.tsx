import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Award, Flame, Zap, Target, Calendar, Dumbbell, 
  Brain, Heart, BookOpen, Coins, CheckCircle, Lightbulb, Compass, RotateCcw
} from 'lucide-react';
import { Habit, HabitCompletion } from '../types';

interface InsightsViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  dailyGoal: number;
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}

const CATEGORIES = [
  { name: 'Fitness', icon: Dumbbell, color: 'text-rose-500', fill: 'bg-rose-500', track: 'bg-rose-50' },
  { name: 'Mind', icon: Brain, color: 'text-violet-500', fill: 'bg-violet-500', track: 'bg-violet-50' },
  { name: 'Health', icon: Heart, color: 'text-teal-500', fill: 'bg-teal-500', track: 'bg-teal-50' },
  { name: 'Productivity', icon: BookOpen, color: 'text-amber-500', fill: 'bg-amber-500', track: 'bg-amber-50' },
  { name: 'Finance', icon: Coins, color: 'text-sky-500', fill: 'bg-sky-500', track: 'bg-sky-50' },
];

export default function InsightsView({ habits, completions, dailyGoal, bgTheme }: InsightsViewProps) {
  
  // Dynamic glassmorphic background configurations matching user request
  const getPanelClass = (additionalClasses = '', borderOverride = '') => {
    if (bgTheme === 'light_blue') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-sky-200/50'} shadow-3xs ${additionalClasses}`;
    }
    if (bgTheme === 'light_pink') {
      return `glass-panel bg-white/75 backdrop-blur-md rounded-2xl ${borderOverride || 'border border-pink-200/50'} shadow-3xs ${additionalClasses}`;
    }
    return `bg-white rounded-2xl border ${borderOverride || 'border-neutral-100'} shadow-3xs ${additionalClasses}`;
  };

  const getListItemClass = () => {
    if (bgTheme === 'light_blue') {
      return 'flex items-center justify-between p-2 rounded-xl bg-white/65 border border-sky-100 hover:bg-white/85 transition-all';
    }
    if (bgTheme === 'light_pink') {
      return 'flex items-center justify-between p-2 rounded-xl bg-white/65 border border-pink-100 hover:bg-white/85 transition-all';
    }
    return 'flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100/55 transition-all';
  };

  // Calculate total historical completions count
  const totalCompletionsCount = completions.length;
  
  // Calculate Sunday to Saturday of current week to handle the weekly resets automatically
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday...
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const currentWeekDates = React.useMemo(() => {
    const start = getStartOfWeek();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, [completions]);

  // Completions that match active week dates (starts Sunday, automatically resets to 0 weekly)
  const weeklyCompletions = React.useMemo(() => {
    return completions.filter(c => currentWeekDates.includes(c.date));
  }, [completions, currentWeekDates]);

  // Today's date string under local time (automatically resets to 0 daily!)
  const todayStr = React.useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, [completions]);

  const dailyCompletions = React.useMemo(() => {
    return completions.filter(c => c.date === todayStr);
  }, [completions, todayStr]);

  // Overall 14-day rolling consistency (generic reference metric)
  const calculateOverallConsistency = () => {
    if (habits.length === 0) return 0;
    
    const uniqueDates = new Set<string>();
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      uniqueDates.add(d.toISOString().split('T')[0]);
    }
    
    let possibleCompletionsCount = habits.length * 14;
    let actualCompletionsInWindow = completions.filter(c => uniqueDates.has(c.date)).length;
    
    return Math.round((actualCompletionsInWindow / possibleCompletionsCount) * 100);
  };

  const consistencyRate = calculateOverallConsistency();

  // Habit rankings computed strictly by the quantity of check marks completed in current week (resetting daily to 0, weekly start Sunday)
  const getHabitRankings = () => {
    if (habits.length === 0) return [];
    
    return habits.map(h => {
      const count = weeklyCompletions.filter(c => c.habitId === h.id).length;
      return {
        ...h,
        completionCount: count
      };
    }).sort((a, b) => b.completionCount - a.completionCount);
  };

  const habitStats = getHabitRankings();
  const starHabit = habitStats.length > 0 && habitStats[0].completionCount > 0 ? habitStats[0] : null;

  // Category performance (using weekly completions)
  const getCategoryPerformance = () => {
    return CATEGORIES.map(cat => {
      const categoryHabits = habits.filter(h => h.category === cat.name);
      if (categoryHabits.length === 0) {
        return { ...cat, rate: 0, habitCount: 0 };
      }
      
      const categoryHabitIds = new Set(categoryHabits.map(h => h.id));
      const categoryCompletions = weeklyCompletions.filter(c => categoryHabitIds.has(c.habitId)).length;
      
      // Total potential completions in current week (7 days)
      const potential = categoryHabits.length * 7;
      const rate = Math.min(100, Math.round((categoryCompletions / potential) * 100));
      
      return {
        ...cat,
        rate,
        habitCount: categoryHabits.length
      };
    }).filter(c => c.habitCount > 0);
  };

  const categoryStats = getCategoryPerformance();

  // Streak calculations (Active streak based on daily checklist logs)
  const calculateCurrentActiveStreak = () => {
    if (completions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    let currentDateToCheck = new Date(today);
    
    while (true) {
      const dateStr = currentDateToCheck.toISOString().split('T')[0];
      const hasCompletedHabits = completions.some(c => c.date === dateStr);
      
      if (hasCompletedHabits) {
        streak++;
        currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      } else {
        // Fallback for today if they didn't check today but did check yesterday
        if (streak === 0 && dateStr === today.toISOString().split('T')[0]) {
          currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
          continue;
        }
        break;
      }
    }
    
    return streak;
  };

  const activeStreak = calculateCurrentActiveStreak();

  // Dynamic coaching advice
  const getCoachingAdvice = () => {
    if (habits.length === 0) {
      return "Start building consistency. Navigate to Today and create your first essential habit.";
    }
    if (starHabit && starHabit.completionCount > 0) {
      return `Splendid! "${starHabit.name}" is your highest scoring habit with ${starHabit.completionCount} accomplishments this week. Draw inspiration from it!`;
    }
    if (consistencyRate > dailyGoal) {
      return `Outstanding effort! You are exceeding your milestone consistency target. Keep feeding the fire!`;
    }
    return 'Checking small habits early in the morning builds momentum. Tick your habits under Today to watch this dashboard update in real-time!';
  };

  return (
    <div className="space-y-6" id="insights-view-container">
      
      {/* Visual Header with Alert */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-3" id="insights-head-wrapper">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-neutral-800 tracking-tight flex items-center gap-2">
            Performance Insights <Zap className="w-5 h-5 text-indigo-500 fill-indigo-100" />
          </h2>
          <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">
            ⚠️ <span className="text-indigo-800 font-extrabold">Weekly Reset Notice:</span> Your habit ranking metrics and checklists reset automatically weekly starting Sunday to Monday. Today's counter resets to 0 daily.
          </p>
        </div>
      </div>

      {/* Visual KPI Metrics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's check marks (Resets daily to 0) */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Completed Today</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{dailyCompletions.length}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Resets to 0 daily at midnight</p>
          </div>
        </div>

        {/* KPI 2: Active streak */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Active Streak</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
              <Flame className="w-4 h-4 fill-rose-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{activeStreak} {activeStreak === 1 ? 'day' : 'days'}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Consecutive days tracking</p>
          </div>
        </div>

        {/* KPI 3: Completions this week */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">This Week</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-bold tracking-tight text-neutral-800">{weeklyCompletions.length}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">Completions starting Sunday</p>
          </div>
        </div>

        {/* KPI 4: Top performing habit */}
        <div className={getPanelClass("p-5 flex flex-col justify-between")}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Star Performer</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
              <Award className="w-4 h-4 text-amber-500" />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-bold truncate text-neutral-800 tracking-tight">{starHabit ? starHabit.name : 'None'}</h4>
            <p className="text-[10px] text-neutral-400 mt-1">
              {starHabit ? `${starHabit.completionCount} checks this week` : 'Ranked by weekly checks'}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic coaching advise strip */}
      <div className="bg-neutral-900 rounded-2xl p-5 text-white flex items-start gap-4">
        <span className="p-2 rounded-xl bg-neutral-800 shrink-0 text-amber-400 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </span>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Coaching Wisdom</h4>
          <p className="text-xs mt-1.5 text-neutral-200 leading-relaxed font-normal">
            {getCoachingAdvice()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Category breakdown */}
        <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" /> Focus-Area Vectors
            </h3>
            <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Your current weekly focus-area completions distribution.</p>
          </div>

          <div className="space-y-4 pt-2">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No weekly completions yet. Tick off checklists on the Today page to view weekly focus scores.</p>
            ) : (
              categoryStats.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-neutral-700">
                        <CategoryIcon className={`w-3.5 h-3.5 ${cat.color}`} /> {cat.name}
                        <span className="text-[10px] text-neutral-400 font-semibold">({cat.habitCount} {cat.habitCount === 1 ? 'habit' : 'habits'})</span>
                      </span>
                      <span className="font-bold text-neutral-700">{cat.rate}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${cat.track} w-full overflow-hidden`}>
                      <div 
                        className={`h-full rounded-full ${cat.fill} transition-all duration-500`}
                        style={{ width: `${cat.rate}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Card: Relative rankings list based on Quantity check marks no matter type */}
        <div className={getPanelClass("p-5 flex flex-col justify-between space-y-4")}>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" /> Habit Rankings
            </h3>
            <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Ranked purely by total check marks logged during the current week.</p>
          </div>

          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {habitStats.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">Your list is blank. Add habits and complete checklists to view rankings here.</p>
            ) : (
              habitStats.map((h, i) => (
                <div key={h.id} className={getListItemClass()}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-neutral-400 w-5 text-center">
                      #{i + 1}
                    </span>
                    <span className="text-xs font-bold text-neutral-700 truncate min-w-0">
                      {h.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      h.completionCount > 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {h.completionCount} {h.completionCount === 1 ? 'check' : 'checks'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
