/**
 * DataSpeak — Blocked Notice Banner (DESIGN.md)
 * Shown in place of results when a query attempts DDL/DML mutation.
 * Features 4px solid red rail, clear plain-English explanation, and zero bypass controls.
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react';

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
      className="w-full rounded-xl bg-[#f7d6d3] border border-[#cd4239] border-l-4 border-l-[#cd4239] p-5 shadow-sm my-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-1 rounded-lg bg-white/60 text-[#cd4239] shrink-0 mt-0.5">
          <ShieldAlert className="h-5 w-5" />
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-[#86241d] tracking-tight mb-1.5">
            I can't do that: it would change your data
          </h3>

          <p className="text-sm text-[#0d0d0d] leading-relaxed mb-2.5">
            {reason ||
              'Your request contains operations that attempt to insert, update, delete, or alter database schemas. DataSpeak is strictly read-only to protect your data.'}
          </p>

          <p className="text-xs font-semibold text-[#86241d] tracking-wide uppercase mb-4">
            🛡️ Nothing was run. Your database is completely unchanged.
          </p>

          {/* Offending Statement Peek (Sanitized) */}
          {blockedSql && (
            <div className="mb-4 rounded-lg bg-[#23251d] text-white p-3 font-mono text-xs overflow-x-auto border border-neutral-700">
              <span className="text-neutral-400 select-none mr-2">-- Refused query:</span>
              <span className="text-[#ff8b82] font-semibold">{blockedSql}</span>
            </div>
          )}

          {/* Safe Action Triggers (Zero Override) */}
          <div className="flex flex-wrap items-center gap-3">
            {onEditQuestion && (
              <button
                type="button"
                onClick={onEditQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-white border border-[#dddddd] text-[#0d0d0d] hover:bg-[#f8fafc] active:bg-[#efeeec] transition-colors shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#0075de]" />
                Edit my question
              </button>
            )}

            <div className="inline-flex items-center gap-1 text-xs text-[#615d59]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Read-only queries (SELECT) are always safe to run.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
