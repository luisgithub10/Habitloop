export interface SubTask {
  id: string;
  text: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., 'Fitness', 'Mind', 'Health', 'Productivity', 'Finance'
  frequency: 'daily' | 'weekly';
  createdAt: string; // ISO date string
  color: string; // e.g., 'violet', 'teal', 'amber', 'rose', 'sky'
  icon: string; // Lucide icon name
  habitType: 'time' | 'quantity' | 'on_off';
  timeGoal?: number; // total target minutes
  quantityGoal?: number; // target counter value
  quantityUnit?: string; // e.g., 'cups', 'pages', 'km'
  subtasks?: SubTask[];
}

export interface HabitCompletion {
  habitId: string;
  date: string; // Format: YYYY-MM-DD
}

export interface HabitProgress {
  habitId: string;
  date: string; // Format: YYYY-MM-DD
  value: number; // current progress (minutes for time, count for quantity)
}

export interface AppSettings {
  userName: string;
  dailyGoal: number; // Percentage, e.g. 80 for 80%
  reminderTime: string; // HH:MM
  soundEnabled: boolean;
  hapticFeedback: boolean;
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}

export type ViewType = 'today' | 'insights' | 'trends' | 'settings';
