/**
 * DataSpeak — PostHog Blocked Notice Banner (BlockedNotice.tsx)
 * Shown in place of results when a query attempts DDL/DML mutations.
 * Features 4px solid red rail, Hedgehog warning mascot, clear explanation, and zero bypass controls.
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react';
import { HedgehogMascot } from './HedgehogMascot';

interface BlockedNoticeProps {
  reason?: string;
  onEditQuestion?: () => void;
  blockedSql?: string;
}

export const BlockedNotice: React.FC<BlockedNoticeProps> = ({
  reason,
  onEditQuestion,
  blockedSql,
}) => {
  return (
    <div
      role="alert"
      className="w-full rounded-md bg-[#f7d6d3] border border-[#cd4239] border-l-4 border-l-[#cd4239] p-5 my-4 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* PostHog Hedgehog Warning Mascot */}
        <div className="shrink-0 hidden sm:block">
          <HedgehogMascot pose="warning" size={56} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlert className="h-5 w-5 text-[#cd4239] sm:hidden" />
            <h3 className="text-base font-bold text-[#23251d] tracking-tight">
              I can't do that: it would change your data
            </h3>
          </div>

          <p className="text-sm text-[#4d4f46] leading-relaxed mb-2.5">
            {reason ||
              'Your request contains operations that attempt to insert, update, delete, or alter database schemas. DataSpeak is strictly read-only to guarantee database safety.'}
          </p>

          <p className="text-xs font-bold text-[#cd4239] tracking-wide uppercase mb-3.5">
            Nothing was run. Your database is completely unchanged.
          </p>

          {/* Offending Statement Peek (Sanitized) */}
          {blockedSql && (
            <div className="mb-4 rounded-md bg-[#23251d] text-white p-3 font-mono text-xs overflow-x-auto border border-[#33342d]">
              <span className="text-[#9b9c92] select-none mr-2">-- Refused statement:</span>
              <span className="text-[#ff8b82] font-semibold">{blockedSql}</span>
            </div>
          )}

          {/* Safe Action Triggers (Zero Override) */}
          <div className="flex flex-wrap items-center gap-3">
            {onEditQuestion && (
              <button
                type="button"
                onClick={onEditQuestion}
                className="posthog-button-secondary text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#1d4ed8]" />
                <span>Edit my question</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 text-xs text-[#6c6e63]">
              <HelpCircle className="h-3.5 w-3.5 text-[#1078a3]" />
              <span>Read-only queries (SELECT) are always safe to run.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
