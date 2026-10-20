/**
 * DataSpeak — Loading Skeletons (LoadingSkeleton.tsx)
 * Flat grey bars without gradients or animated shifts as required by app-screens.md.
 */

import React from 'react';

export const SummarySkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-[#f7f8fa] border border-[#e2e4e8] p-5 my-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3.5 w-3.5 rounded-full skeleton-bar" />
        <div className="h-3 w-28 skeleton-bar" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-11/12 skeleton-bar" />
        <div className="h-3.5 w-4/5 skeleton-bar" />
        <div className="h-3.5 w-2/3 skeleton-bar" />
      </div>
      <div className="mt-4 pt-3 border-t border-[#eceef0] flex items-center justify-between">
        <div className="h-3 w-32 skeleton-bar" />
        <div className="h-3 w-20 skeleton-bar" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-white border border-[#e2e4e8] p-5 my-3">
      <div className="flex justify-between items-center mb-5">
        <div className="h-4 w-40 skeleton-bar" />
        <div className="h-6 w-28 skeleton-bar" />
      </div>
      <div className="h-56 w-full rounded-lg bg-[#f7f8fa] border border-[#eceef0] flex items-end justify-around p-4 gap-3">
        <div className="w-8 h-20 rounded-t skeleton-bar" />
        <div className="w-8 h-36 rounded-t skeleton-bar" />
        <div className="w-8 h-48 rounded-t skeleton-bar" />
        <div className="w-8 h-28 rounded-t skeleton-bar" />
        <div className="w-8 h-40 rounded-t skeleton-bar" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-white border border-[#e2e4e8] overflow-hidden my-3">
      <div className="h-12 border-b border-[#eceef0] px-4 flex items-center justify-between">
        <div className="h-3.5 w-28 skeleton-bar" />
        <div className="h-7 w-20 skeleton-bar" />
      </div>
      <div className="h-9 bg-[#f7f8fa] border-b border-[#eceef0] flex items-center px-4 gap-4">
        <div className="h-3 w-1/4 skeleton-bar" />
        <div className="h-3 w-1/4 skeleton-bar" />
        <div className="h-3 w-1/4 skeleton-bar" />
        <div className="h-3 w-1/4 skeleton-bar" />
      </div>
      <div className="divide-y divide-[#eceef0]">
        {[1, 2, 3, 4].map((row) => (
          <div key={row} className="h-10 px-4 flex items-center gap-4">
            <div className="h-3 w-1/4 skeleton-bar" />
            <div className="h-3 w-1/4 skeleton-bar" />
            <div className="h-3 w-1/4 skeleton-bar" />
            <div className="h-3 w-1/4 skeleton-bar" />
          </div>
        ))}
      </div>
    </div>
  );
};
