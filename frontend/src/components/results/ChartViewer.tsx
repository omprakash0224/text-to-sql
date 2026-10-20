/**
 * DataSpeak — Dynamic Chart Viewer (ChartViewer.tsx)
 * High-contrast Recharts container supporting Bar, Line, and Donut/Pie charts.
 * Strictly enforces DESIGN.md palette (NO red/green; 6 curated PostHog series colors).
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, SlidersHorizontal } from 'lucide-react';
import type { ChartConfig, ChartType } from '../../types';

interface ChartViewerProps {
  config?: ChartConfig;
  rows: Record<string, unknown>[];
  columns: string[];
}

// 6 Curated Categorical Series Colors from DESIGN.md (Deliberately zero red/green)
const CHART_SERIES = [
  '#0075de', // Series 1: Notion Blue
  '#f7a501', // Series 2: PostHog Amber
  '#2a9d99', // Series 3: Teal
  '#7c44a6', // Series 4: Purple
  '#62aef0', // Series 5: Sky
  '#d6409f', // Series 6: Pink
  '#a39e98', // Other: Muted Slate
];

export const ChartViewer: React.FC<ChartViewerProps> = ({
  config,
  rows,
  columns,
}) => {
  // Infer active chart type (defaulting to config recommendation, fallback to bar)
  const initialType: ChartType =
    config?.type && config.type !== 'none' ? config.type : 'bar';

  const [activeChartType, setActiveChartType] = useState<ChartType>(initialType);

  // Derive X (category/date) and Y (numeric metric) keys
  const xKey =
    config?.x_key ||
    config?.xKey ||
    columns.find((c) => {
      const name = c.toLowerCase();
      return (
        name.includes('name') ||
        name.includes('category') ||
        name.includes('date') ||
        name.includes('month') ||
        name.includes('title') ||
        name.includes('status')
      );
    }) ||
    columns[0] ||
    'name';

  const yKey =
    config?.y_key ||
    config?.yKey ||
    columns.find((c) => {
      const name = c.toLowerCase();
      return (
        name !== xKey &&
        (name.includes('total') ||
          name.includes('amount') ||
          name.includes('price') ||
          name.includes('count') ||
          name.includes('sum') ||
          name.includes('revenue') ||
          name.includes('qty'))
      );
    }) ||
    columns[1] ||
    'value';

  // Format data for chart (slice to top 20 to maintain high readability)
  const chartData = rows.slice(0, 20).map((row) => ({
    ...row,
    [xKey]: String(row[xKey] ?? 'Unknown'),
    [yKey]: typeof row[yKey] === 'number' ? row[yKey] : Number(row[yKey]) || 0,
  }));

  if (rows.length === 0 || columns.length < 2) {
    return null;
  }

  // Custom PostHog Dark Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-[#23251d] text-white p-3 shadow-xl border border-neutral-700 text-xs">
          <p className="font-semibold text-neutral-200 mb-1">{label}</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 tnum">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || CHART_SERIES[0] }}
              />
              <span className="text-neutral-400 capitalize">{entry.name}:</span>
              <span className="font-bold text-white">
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : String(entry.value)}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-xl bg-white border border-[#e6e6e6] p-6 shadow-2xs my-4 transition-all">
      {/* Header & Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[#eeeeec]">
        <div>
          <h3 className="text-base font-semibold text-[#0d0d0d] tracking-tight">
            {config?.title || `${yKey.replace(/_/g, ' ').toUpperCase()} by ${xKey.replace(/_/g, ' ')}`}
          </h3>
          <p className="text-xs text-[#615d59]">Automated data visualization with zero chartjunk</p>
        </div>

        {/* Chart Type Segmented Switcher */}
        <div className="flex items-center gap-1.5 bg-[#efeeec] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveChartType('bar')}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-all ${
              activeChartType === 'bar'
                ? 'bg-white text-[#0d0d0d] shadow-2xs'
                : 'text-[#615d59] hover:text-[#0d0d0d]'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#0075de]" />
            <span className="hidden sm:inline">Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartType('line')}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-all ${
              activeChartType === 'line'
                ? 'bg-white text-[#0d0d0d] shadow-2xs'
                : 'text-[#615d59] hover:text-[#0d0d0d]'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5 text-[#f7a501]" />
            <span className="hidden sm:inline">Line</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartType('pie')}
            className={`p-1.5 rounded-md text-xs flex items-center gap-1 font-medium transition-all ${
              activeChartType === 'pie'
                ? 'bg-white text-[#0d0d0d] shadow-2xs'
                : 'text-[#615d59] hover:text-[#0d0d0d]'
            }`}
            title="Pie / Donut Chart"
          >
            <PieIcon className="h-3.5 w-3.5 text-[#2a9d99]" />
            <span className="hidden sm:inline">Donut</span>
          </button>
        </div>
      </div>

      {/* Render Chart Area */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#615d59' }}
                tickLine={false}
                axisLine={{ stroke: '#dddddd' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#615d59' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
              />
              <Tooltip content={renderCustomTooltip} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#0075de"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0075de', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#005bab' }}
              />
            </LineChart>
          ) : activeChartType === 'pie' ? (
            <PieChart>
              <Tooltip content={renderCustomTooltip} />
              <Legend
                formatter={(val) => <span className="text-xs text-[#31302e] font-medium">{val}</span>}
              />
              <Pie
                data={chartData.slice(0, 7)}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
              >
                {chartData.slice(0, 7).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_SERIES[index % CHART_SERIES.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#615d59' }}
                tickLine={false}
                axisLine={{ stroke: '#dddddd' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#615d59' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={CHART_SERIES[index % CHART_SERIES.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#a39e98] pt-2 border-t border-[#eeeeec]">
        <span className="flex items-center gap-1">
          <SlidersHorizontal className="h-3 w-3" /> Showing top {Math.min(chartData.length, 20)} records
        </span>
        <span>Categorical Series (Zero safety colors used)</span>
      </div>
    </div>
  );
};
