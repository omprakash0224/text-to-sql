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
    <div className="w-full rounded-xl bg-white border border-[#bfc1b7] p-6 sm:p-8 my-6 sm:my-8 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-bold text-[#6c6e63] uppercase tracking-wider">
          {label}
        </span>
        <div className="p-2 rounded-lg bg-[#eeefe9] text-[#1078a3] border border-[#dcdfd2]">
          {icon || <Activity className="h-5 w-5" />}
        </div>
      </div>

      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#23251d] tnum mb-2">
        {formattedVal}
      </div>

      {subtext && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4d4f46] leading-relaxed">
          <TrendingUp className="h-4 w-4 text-[#1078a3]" />
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
