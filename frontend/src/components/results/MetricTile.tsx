/**
 * DataSpeak — Headline Metric Tile (MetricTile.tsx)
 * Calm Analytics Workspace (docs/ui-example/code1.html)
 * Crisp white card, subtle border #e6e6e6, tabular numerals (tnum),
 * uppercase label, large high-contrast figure, and optional trend badge.
 */

import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  isPositive?: boolean;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtext,
  trend,
  isPositive = true,
}) => {
  const formattedVal =
    typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(value);

  return (
    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex flex-col gap-1">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-[#615d59]">
        {label}
      </span>
      <div className="text-[28px] font-bold text-[#0d0d0d] tracking-tight tnum mt-0.5">
        {formattedVal}
      </div>
      {(trend || subtext) && (
        <div
          className={`text-[13px] font-medium flex items-center gap-1 tnum ${
            isPositive ? 'text-[#17543b]' : 'text-[#86241d]'
          }`}
        >
          {trend && (
            <>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </>
          )}
          {subtext && !trend && <span className="text-[#615d59]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export const MetricGrid: React.FC<{
  metrics: { label: string; value: string | number; trend?: string; isPositive?: boolean }[];
}> = ({ metrics }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((m, idx) => (
        <MetricTile
          key={idx}
          label={m.label}
          value={m.value}
          trend={m.trend}
          isPositive={m.isPositive ?? true}
        />
      ))}
    </div>
  );
};
