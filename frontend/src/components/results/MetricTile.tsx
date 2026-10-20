/**
 * DataSpeak — Metric Tile Component (MetricTile.tsx)
 * Framed-sheet style: Scalar KPI tile adhering to app-screens.md.
 * Label above value, tabular numerals, no icons in tinted squares, zero resting shadows.
 */

import React from 'react';

interface MetricTileProps {
  label: string;
  value: string | number;
  subtext?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtext,
}) => {
  const formattedVal =
    typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(value);

  return (
    <div className="w-full rounded-xl bg-white border border-[#e2e4e8] p-5 my-3">
      <div className="text-xs font-medium text-[#5d5f60] mb-1.5 capitalize">
        {label}
      </div>

      <div className="text-[32px] font-semibold tracking-tight text-[#131416] tnum leading-tight mb-1">
        {formattedVal}
      </div>

      {subtext && (
        <div className="text-xs text-[#5d5f60]">
          {subtext}
        </div>
      )}
    </div>
  );
};
