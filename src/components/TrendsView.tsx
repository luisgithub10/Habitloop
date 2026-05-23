import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, Calendar, Flame, HelpCircle, Info, TrendingUp, Sparkles, AlertCircle 
} from 'lucide-react';
import { Habit, HabitCompletion } from '../types';

interface TrendsViewProps {
  habits: Habit[];
  completions: HabitCompletion[];
  bgTheme?: 'none' | 'light_blue' | 'light_pink';
}

export default function TrendsView({ habits, completions, bgTheme }: TrendsViewProps) {
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ date: string; rate: number; index: number } | null>(null);

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

  // Generate date series for the last 14 days
  const getPast14Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dateSeries = getPast14Days();

  // Calculate completion rate per day
  const getDailyRates = () => {
    if (habits.length === 0) return dateSeries.map(date => ({ date, rate: 0, completed: 0, total: 0 }));
    
    return dateSeries.map(date => {
      const dayCompletions = completions.filter(c => c.date === date).length;
      const rate = Math.round((dayCompletions / habits.length) * 100);
      return {
        date,
        rate,
        completed: dayCompletions,
        total: habits.length
      };
    });
  };

  const dailyRates = getDailyRates();

  // Generate grid for contribution heatmap (past 28 days, grouped by 4 weeks)
  const getHeatmapGrid = () => {
    const days = [];
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const completedCount = completions.filter(c => c.date === iso).length;
      const rate = habits.length > 0 ? (completedCount / habits.length) : 0;
      days.push({
        date: iso,
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        rate,
        completedCount
      });
    }
    return days;
  };

  const heatmapDays = getHeatmapGrid();

  // Render SVG Chart Constants
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Chart plotting logic
  const getSvgCoordinates = () => {
    const points: { x: number; y: number; date: string; rate: number; index: number }[] = [];
    const chartWidth = width - (paddingX * 2);
    const chartHeight = height - (paddingY * 2);

    dailyRates.forEach((item, index) => {
      const x = paddingX + (index * (chartWidth / (dailyRates.length - 1)));
      // SVG Y starts at top, so 100% is high up (paddingY), 0% is at bottom (height - paddingY)
      const y = (height - paddingY) - (item.rate / 100 * chartHeight);
      points.push({ x, y, date: item.date, rate: item.rate, index });
    });
    return points;
  };

  const chartPoints = getSvgCoordinates();

  // Build SVG Path string
  const getSvgPath = () => {
    if (chartPoints.length === 0) return '';
    return chartPoints.reduce((acc, point, index) => {
      const cmd = index === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${point.x} ${point.y}`;
    }, '');
  };

  const svgPathString = getSvgPath();

  // Area Path string under line chart for shading
  const getAreaSvgPath = () => {
    if (chartPoints.length === 0) return '';
    return `${svgPathString} L ${chartPoints[chartPoints.length - 1].x} ${height - paddingY} L ${chartPoints[0].x} ${height - paddingY} Z`;
  };

  const areaPathString = getAreaSvgPath();

  const formatDateLabel = (isoStr: string) => {
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getIntensityColor = (rate: number) => {
    if (habits.length === 0 || rate === 0) return 'bg-neutral-100 hover:bg-neutral-200 text-neutral-400';
    if (rate === 1) return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    if (rate >= 0.7) return 'bg-violet-600 hover:bg-violet-700 text-white';
    if (rate >= 0.4) return 'bg-violet-400 hover:bg-violet-500 text-white';
    if (rate > 0) return 'bg-violet-200 hover:bg-violet-300 text-neutral-800';
    return 'bg-neutral-150 hover:bg-neutral-250 text-neutral-500';
  };

  return (
    <div className="space-y-6" id="trends-view-container">
      {/* Chart Panel */}
      <div className={getPanelClass("p-5")}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-550" /> 14-Day Velocity
            </h3>
            <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Visualize your habit completion rates consecutively over the past two weeks.</p>
          </div>
          
          {hoveredDataPoint && (
            <div className="bg-neutral-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs">
              {formatDateLabel(hoveredDataPoint.date)}: {hoveredDataPoint.rate}% completion
            </div>
          )}
        </div>

        {/* SVG Render */}
        {habits.length === 0 ? (
          <div className="h-44 bg-neutral-25 rounded-xl border border-neutral-100 flex flex-col items-center justify-center p-6 text-center">
            <BarChart3 className="w-8 h-8 text-neutral-350 mb-2" />
            <p className="text-xs text-neutral-500 font-medium">No performance index metrics found.</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Add habits in the Today view to plotting history.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto select-none no-scrollbar">
            <div className="min-w-[450px]">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                {/* Horizontal Gridlines */}
                {[0, 25, 50, 75, 100].map((level) => {
                  const chartHeight = height - (paddingY * 2);
                  const y = (height - paddingY) - (level / 100 * chartHeight);
                  return (
                    <g key={level}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#f3f4f6"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingX - 12}
                        y={y + 4}
                        className="text-[9px] font-bold text-neutral-400 font-mono"
                        textAnchor="end"
                      >
                        {level}%
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Under Line */}
                <path
                  d={areaPathString}
                  fill="url(#chart-gradient)"
                  className="transition-all duration-300"
                />

                {/* Line Path */}
                <path
                  d={svgPathString}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Linear Gradient Shader Definition */}
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Data Points / Circles with interactive hover boundaries */}
                {chartPoints.map((pt) => {
                  const isHovered = hoveredDataPoint?.index === pt.index;
                  return (
                    <g key={pt.index}>
                      {/* Interactive click/hover helper bounding box */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDataPoint({ date: pt.date, rate: pt.rate, index: pt.index })}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                      />
                      {/* Visible circle marker */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '5' : '3.5'}
                        fill={isHovered ? '#4f46e5' : '#6366f1'}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? '2' : '1.5'}
                        className="pointer-events-none transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* X Axis Date Labels */}
                {chartPoints.map((pt, idx) => {
                  // Only show 6 labels on X axis to avoid overcrowding
                  if (idx % 2 !== 0 && idx !== chartPoints.length - 1) return null;
                  return (
                    <text
                      key={idx}
                      x={pt.x}
                      y={height - 12}
                      className="text-[9px] font-bold text-neutral-400 font-mono text-center"
                      textAnchor="middle"
                    >
                      {formatDateLabel(pt.date)}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Consistency Heatmap (Past 28 Days GitHub Layout) */}
      <div className={getPanelClass("p-5")}>
        <div className="mb-4">
          <h3 className="text-sm font-bold tracking-tight text-neutral-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-550" /> 28-Day Consistency Matrix
          </h3>
          <p className="text-xs font-bold text-neutral-700 mt-1 leading-relaxed">Track your holistic active presence score grid over the past four weeks.</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {heatmapDays.map((elem) => {
            const hasCompleted = elem.completedCount > 0;
            return (
              <div
                key={elem.date}
                className="group relative aspect-square flex flex-col items-center justify-between p-1 rounded-lg border border-neutral-50/10"
              >
                <div className={`w-full h-full rounded-md flex flex-col items-center justify-center transition-all cursor-default ${getIntensityColor(elem.rate)}`}>
                  {/* Floating tooltip */}
                  <div className="opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-neutral-900 border border-neutral-800 text-white p-2 rounded-lg text-[9px] font-bold text-center z-20 shadow-lg">
                    {elem.month} {elem.dayNum} ({elem.dayName})
                    <div className="text-[8.5px] text-neutral-300 mt-0.5">
                      {elem.completedCount} completion{elem.completedCount === 1 ? '' : 's'}
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold font-mono">
                    {elem.dayNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Color Key */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-50 text-[10px] text-neutral-450 font-bold select-none">
          <span>Less Consistency</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-neutral-100" />
            <div className="w-2.5 h-2.5 rounded-sm bg-violet-200" />
            <div className="w-2.5 h-2.5 rounded-sm bg-violet-400" />
            <div className="w-2.5 h-2.5 rounded-sm bg-violet-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
          </div>
          <span>Fully Clean Streak (100%)</span>
        </div>
      </div>
      
      {/* Context Infobox */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-indigo-800">
        <Info className="w-5 h-5 shrink-0 text-indigo-500 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Dynamic Metric Calculations</h4>
          <p className="text-xs mt-1 leading-relaxed text-indigo-800">
            The 14-day velocity tracks your overall completion percentages.
            Maintain consecutive days in the green intensity box to ensure high performance grades!
          </p>
        </div>
      </div>
    </div>
  );
}
