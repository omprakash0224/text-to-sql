/**
 * DataSpeak — Dynamic Chart Viewer (ChartViewer.tsx)
 * Framed-sheet chart visualizer adhering strictly to app-screens.md:
 * - One primary hue per chart (#1b6c80)
 * - Faint gridlines, square / 4px top radius on bars
 * - 4-hue palette max for categorical parts of a whole (zero red/green/purple)
 * - No redundant legends for single-series charts
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
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react';
import type { ChartConfig, ChartType } from '../../types';

interface ChartViewerProps {
  config?: ChartConfig;
  rows: Record<string, unknown>[];
  columns: string[];
}

// 4 Cohesive Chart Series Colors (Teal, Slate-Blue, Amber, Steel) - No purple, no red/green
const CHART_SERIES = [
  '#1b6c80', // Series 1: Primary Teal
  '#2f70bb', // Series 2: Slate Blue
  '#a86f0c', // Series 3: Amber
  '#4b5563', // Series 4: Steel
];

export const ChartViewer: React.FC<ChartViewerProps> = ({
  config,
  rows,
  columns,
}) => {
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

  // Format data for chart (slice to top 15 to maintain high readability)
  const chartData = rows.slice(0, 15).map((row) => ({
    ...row,
    [xKey]: String(row[xKey] ?? 'Unknown'),
    [yKey]: typeof row[yKey] === 'number' ? row[yKey] : Number(row[yKey]) || 0,
  }));

  if (rows.length === 0 || columns.length < 2) {
    return null;
  }

  // Custom Dark Tooltip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md bg-[#23251d] text-white p-2.5 shadow-overlay border border-neutral-700 text-xs">
          <p className="font-medium text-neutral-200 mb-1">{label}</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 tnum">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || CHART_SERIES[0] }}
              />
              <span className="text-neutral-400 capitalize">{entry.name}:</span>
              <span className="font-semibold text-white">
                {typeof entry.value === 'number'
                  ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                  : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-xl bg-white border border-[#e2e4e8] p-5 my-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#eceef0]">
        <div>
          <h3 className="text-xs font-semibold text-[#131416]">
            {config?.title || `${yKey.replace(/_/g, ' ')} by ${xKey.replace(/_/g, ' ')}`}
          </h3>
          <p className="text-[11px] text-[#5d5f60]">
            Showing top {chartData.length} records
          </p>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 bg-[#ebedee] p-0.5 rounded-md text-xs">
          <button
            type="button"
            onClick={() => setActiveChartType('bar')}
            className={`p-1.5 rounded transition-colors ${
              activeChartType === 'bar'
                ? 'bg-white text-[#131416] border border-[#e2e4e8]'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
            title="Bar chart"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveChartType('line')}
            className={`p-1.5 rounded transition-colors ${
              activeChartType === 'line'
                ? 'bg-white text-[#131416] border border-[#e2e4e8]'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
            title="Line chart"
          >
            <LineIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveChartType('pie')}
            className={`p-1.5 rounded transition-colors ${
              activeChartType === 'pie'
                ? 'bg-white text-[#131416] border border-[#e2e4e8]'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
            title="Donut chart"
          >
            <PieIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeChartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#5d5f60' }}
                interval={0}
                tickFormatter={(val) =>
                  String(val).length > 12 ? `${String(val).substring(0, 10)}...` : String(val)
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#5d5f60' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  typeof v === 'number' && v >= 1000
                    ? `${(v / 1000).toFixed(1)}k`
                    : String(v)
                }
              />
              <Tooltip content={renderCustomTooltip} />
              <Bar
                dataKey={yKey}
                fill={CHART_SERIES[0]}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          ) : activeChartType === 'line' ? (
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceef0" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#5d5f60' }}
                interval={0}
                tickFormatter={(val) =>
                  String(val).length > 12 ? `${String(val).substring(0, 10)}...` : String(val)
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#5d5f60' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  typeof v === 'number' && v >= 1000
                    ? `${(v / 1000).toFixed(1)}k`
                    : String(v)
                }
              />
              <Tooltip content={renderCustomTooltip} />
              <Line
                type="linear"
                dataKey={yKey}
                stroke={CHART_SERIES[0]}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_SERIES[0] }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Tooltip content={renderCustomTooltip} />
              <Pie
                data={chartData.slice(0, 6)}
                dataKey={yKey}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {chartData.slice(0, 6).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_SERIES[index % CHART_SERIES.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
