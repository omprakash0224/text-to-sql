/**
 * DataSpeak — Metric Tile Component (MetricTile.tsx)
 * Single-value high-impact number tile with PostHog styling for scalar query results.
 */

import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

interface MetricTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtext,
  icon,
}) => {
  const formattedVal =
    typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(value);

  return (
    <div className="w-full rounded-xl bg-white border border-[#e6e6e6] p-6 shadow-2xs my-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#615d59] uppercase tracking-wider">
          {label}
        </span>
        <div className="p-1.5 rounded-lg bg-[#eaf3fc] text-[#0075de]">
          {icon || <Activity className="h-4 w-4" />}
        </div>
      </div>

      <div className="text-4xl font-bold tracking-tight text-[#0d0d0d] tnum mb-1">
        {formattedVal}
      </div>

      {subtext && (
        <div className="flex items-center gap-1.5 text-xs text-[#615d59]">
          <TrendingUp className="h-3.5 w-3.5 text-[#0075de]" />
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
