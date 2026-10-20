/**
 * DataSpeak — PostHog Metric Tile Component (MetricTile.tsx)
 * Single-value high-impact number tile inside white-on-cream card.
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
    <div className="w-full rounded-md bg-white border border-[#bfc1b7] p-6 my-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#6c6e63] uppercase tracking-wider">
          {label}
        </span>
        <div className="p-1.5 rounded bg-[#eeefe9] text-[#1078a3] border border-[#dcdfd2]">
          {icon || <Activity className="h-4 w-4" />}
        </div>
      </div>

      <div className="text-4xl font-extrabold tracking-tight text-[#23251d] tnum mb-1">
        {formattedVal}
      </div>

      {subtext && (
        <div className="flex items-center gap-1.5 text-xs text-[#6c6e63]">
          <TrendingUp className="h-3.5 w-3.5 text-[#1078a3]" />
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
