/**
 * DataSpeak — Loading Skeletons (LoadingSkeleton.tsx)
 * Shimmer skeletons for AI summary, data table, and charts with PostHog styling.
 */

import React from 'react';

export const SummarySkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-md bg-[#dceaf6] border border-[#2c84e0]/30 p-6 my-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">💡</span>
        <div className="h-3 w-32 rounded ph-shimmer" />
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-11/12 rounded ph-shimmer" />
        <div className="h-4 w-4/5 rounded ph-shimmer" />
        <div className="h-4 w-2/3 rounded ph-shimmer" />
      </div>
      <div className="mt-4 pt-3 border-t border-[#2c84e0]/20 flex items-center justify-between">
        <div className="h-3 w-32 rounded ph-shimmer" />
        <div className="h-3 w-16 rounded ph-shimmer" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-md bg-white border border-[#bfc1b7] p-6 my-4">
      <div className="flex justify-between items-center mb-6">
        <div className="h-5 w-48 rounded ph-shimmer" />
        <div className="h-8 w-32 rounded-md ph-shimmer" />
      </div>
      <div className="h-64 w-full rounded-md bg-[#eeefe9] flex items-end justify-around p-4 gap-3">
        <div className="w-8 h-24 rounded-t bg-[#bfc1b7]/40" />
        <div className="w-8 h-40 rounded-t bg-[#bfc1b7]/40" />
        <div className="w-8 h-56 rounded-t bg-[#bfc1b7]/40" />
        <div className="w-8 h-32 rounded-t bg-[#bfc1b7]/40" />
        <div className="w-8 h-48 rounded-t bg-[#bfc1b7]/40" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-md bg-white border border-[#bfc1b7] overflow-hidden my-4">
      <div className="h-14 border-b border-[#bfc1b7] px-4 flex items-center justify-between">
        <div className="h-4 w-32 rounded ph-shimmer" />
        <div className="h-8 w-24 rounded-md ph-shimmer" />
      </div>
      <div className="h-10 bg-[#eeefe9] border-b border-[#dcdfd2] flex items-center px-4 gap-4">
        <div className="h-3 w-1/4 rounded ph-shimmer" />
        <div className="h-3 w-1/4 rounded ph-shimmer" />
        <div className="h-3 w-1/4 rounded ph-shimmer" />
        <div className="h-3 w-1/4 rounded ph-shimmer" />
      </div>
      <div className="divide-y divide-[#dcdfd2]">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="h-11 px-4 flex items-center gap-4">
            <div className="h-3 w-1/4 rounded ph-shimmer" />
            <div className="h-3 w-1/4 rounded ph-shimmer" />
            <div className="h-3 w-1/4 rounded ph-shimmer" />
            <div className="h-3 w-1/4 rounded ph-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
};
