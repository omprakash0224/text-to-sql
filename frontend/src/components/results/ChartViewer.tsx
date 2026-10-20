/**
 * DataSpeak — PostHog Dynamic Chart Viewer (ChartViewer.tsx)
 * High-contrast Recharts container supporting Bar, Line, and Donut/Pie charts.
 * Features white card on cream canvas, PostHog palette, and dark tooltip.
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

// PostHog High-Contrast Data Palette from DESIGN-posthog.md
const POSTHOG_CHART_SERIES = [
  '#1d4ed8', // Royal Blue
  '#f7a501', // PostHog Amber
  '#1078a3', // Teal
  '#7c44a6', // Purple
  '#2c8c66', // Green
  '#cd4239', // Coral
  '#6c6e63', // Muted Olive
];

export const ChartViewer: React.FC<ChartViewerProps> = ({
  config,
  rows,
  columns,
}) => {
  const initialType: ChartType =
    config?.type && config.type !== 'none' ? config.type : 'bar';

  const [activeChartType, setActiveChartType] = useState<ChartType>(initialType);

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

  const chartData = rows.slice(0, 20).map((row) => ({
    ...row,
    [xKey]: String(row[xKey] ?? 'Unknown'),
    [yKey]: typeof row[yKey] === 'number' ? row[yKey] : Number(row[yKey]) || 0,
  }));

  if (rows.length === 0 || columns.length < 2) {
    return null;
  }

  // PostHog Dark Tooltip (#23251d)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md bg-[#23251d] text-white p-3 shadow-lg border border-[#33342d] text-xs">
          <p className="font-bold text-neutral-100 mb-1">{label}</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 tnum">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color || POSTHOG_CHART_SERIES[0] }}
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
    <div className="w-full rounded-md bg-white border border-[#bfc1b7] p-6 my-4 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-[#dcdfd2]">
        <div>
          <h3 className="text-base font-bold text-[#23251d] tracking-tight">
            {config?.title || `${yKey.replace(/_/g, ' ').toUpperCase()} by ${xKey.replace(/_/g, ' ')}`}
          </h3>
          <p className="text-xs text-[#6c6e63]">Visualized query results from database session</p>
        </div>

        {/* Chart Type Segmented Switcher */}
        <div className="flex items-center gap-1 bg-[#e5e7e0] p-1 rounded-md border border-[#bfc1b7]">
          <button
            type="button"
            onClick={() => setActiveChartType('bar')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
              activeChartType === 'bar'
                ? 'bg-white text-[#23251d] shadow-2xs border border-[#bfc1b7]'
                : 'text-[#4d4f46] hover:text-[#23251d]'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#1d4ed8]" />
            <span className="hidden sm:inline">Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartType('line')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
              activeChartType === 'line'
                ? 'bg-white text-[#23251d] shadow-2xs border border-[#bfc1b7]'
                : 'text-[#4d4f46] hover:text-[#23251d]'
            }`}
            title="Line Chart"
          >
            <LineIcon className="h-3.5 w-3.5 text-[#f7a501]" />
            <span className="hidden sm:inline">Line</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartType('pie')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
              activeChartType === 'pie'
                ? 'bg-white text-[#23251d] shadow-2xs border border-[#bfc1b7]'
                : 'text-[#4d4f46] hover:text-[#23251d]'
            }`}
            title="Pie / Donut Chart"
          >
            <PieIcon className="h-3.5 w-3.5 text-[#1078a3]" />
            <span className="hidden sm:inline">Donut</span>
          </button>
        </div>
      </div>

      {/* Render Chart Area */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcdfd2" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#4d4f46' }}
                tickLine={false}
                axisLine={{ stroke: '#bfc1b7' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#4d4f46' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
              />
              <Tooltip content={renderCustomTooltip} />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#1078a3' }}
              />
            </LineChart>
          ) : activeChartType === 'pie' ? (
            <PieChart>
              <Tooltip content={renderCustomTooltip} />
              <Legend
                formatter={(val) => <span className="text-xs text-[#23251d] font-semibold">{val}</span>}
              />
              <Pie
                data={chartData.slice(0, 7)}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {chartData.slice(0, 7).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={POSTHOG_CHART_SERIES[index % POSTHOG_CHART_SERIES.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dcdfd2" vertical={false} />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#4d4f46' }}
                tickLine={false}
                axisLine={{ stroke: '#bfc1b7' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#4d4f46' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => (typeof val === 'number' && val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val))}
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`bar-cell-${index}`}
                    fill={POSTHOG_CHART_SERIES[index % POSTHOG_CHART_SERIES.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6c6e63] pt-2 border-t border-[#dcdfd2]">
        <span className="flex items-center gap-1">
          <SlidersHorizontal className="h-3 w-3" /> Showing top {Math.min(chartData.length, 20)} records
        </span>
        <span className="font-mono text-[10px]">Data-dense PostHog analytics view</span>
      </div>
    </div>
  );
};
