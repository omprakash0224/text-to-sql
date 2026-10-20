/**
 * DataSpeak — Loading Skeletons
 * Shimmer skeletons for AI summary, data table, and charts.
 */

import React from 'react';

export const SummarySkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-[#eaf3fc] border border-[#c9e0f6] p-6 shadow-sm my-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 rounded-full shimmer" />
        <div className="h-3 w-24 rounded shimmer" />
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-11/12 rounded shimmer" />
        <div className="h-4 w-4/5 rounded shimmer" />
        <div className="h-4 w-2/3 rounded shimmer" />
      </div>
      <div className="mt-4 pt-3 border-t border-[#c9e0f6]/60 flex items-center justify-between">
        <div className="h-3 w-32 rounded shimmer" />
        <div className="h-3 w-16 rounded shimmer" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-white border border-[#e6e6e6] p-6 shadow-sm my-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 w-48 rounded shimmer" />
        <div className="h-7 w-32 rounded-md shimmer" />
      </div>
      <div className="h-64 w-full rounded-lg shimmer flex items-end justify-around p-4 gap-3">
        <div className="w-8 h-24 rounded-t bg-black/5" />
        <div className="w-8 h-40 rounded-t bg-black/5" />
        <div className="w-8 h-56 rounded-t bg-black/5" />
        <div className="w-8 h-32 rounded-t bg-black/5" />
        <div className="w-8 h-48 rounded-t bg-black/5" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-white border border-[#dddddd] overflow-hidden shadow-sm my-4">
      <div className="h-14 border-b border-[#dddddd] px-4 flex items-center justify-between">
        <div className="h-4 w-32 rounded shimmer" />
        <div className="h-8 w-24 rounded-md shimmer" />
      </div>
      <div className="h-10 bg-[#f6f5f4] border-b border-[#eeeeec] flex items-center px-4 gap-4">
        <div className="h-3 w-1/4 rounded shimmer" />
        <div className="h-3 w-1/4 rounded shimmer" />
        <div className="h-3 w-1/4 rounded shimmer" />
        <div className="h-3 w-1/4 rounded shimmer" />
      </div>
      <div className="divide-y divide-[#eeeeec]">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="h-11 px-4 flex items-center gap-4">
            <div className="h-3 w-1/4 rounded shimmer" />
            <div className="h-3 w-1/4 rounded shimmer" />
            <div className="h-3 w-1/4 rounded shimmer" />
            <div className="h-3 w-1/4 rounded shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};
