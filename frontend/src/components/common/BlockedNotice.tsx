/**
 * DataSpeak — Blocked Notice Banner (BlockedNotice.tsx)
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
      className="w-full rounded-lg bg-[#ffedea] border border-[#c4242a] border-l-4 border-l-[#c4242a] p-4 my-3"
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-white text-[#c4242a] shrink-0 mt-0.5 border border-[#c4242a]/30">
          <ShieldAlert className="h-4 w-4" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[#831c1e] tracking-tight mb-1">
            Operation blocked: mutation prevented
          </h3>

          <p className="text-xs text-[#131416] leading-relaxed mb-2">
            {reason ||
              'Your request contains operations that attempt to insert, update, delete, or alter database schemas. DataSpeak is strictly read-only to protect your data.'}
          </p>

          <p className="text-xs font-medium text-[#831c1e] mb-3">
            Nothing was run. Your database is completely unchanged.
          </p>

          {/* Offending Statement Peek (Sanitized) */}
          {blockedSql && (
            <div className="mb-3 rounded-md bg-[#23251d] text-white p-2.5 font-mono text-xs overflow-x-auto border border-neutral-700">
              <span className="text-neutral-400 select-none mr-2">-- Refused statement:</span>
              <span className="text-[#ff8b82] font-semibold">{blockedSql}</span>
            </div>
          )}

          {/* Safe Action Triggers (Zero Override) */}
          <div className="flex flex-wrap items-center gap-3">
            {onEditQuestion && (
              <button
                type="button"
                onClick={onEditQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-white border border-[#e2e4e8] text-[#131416] hover:bg-[#f7f8fa] active:bg-[#ebedee] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#1b6c80]" />
                Edit question
              </button>
            )}

            <div className="inline-flex items-center gap-1 text-xs text-[#5d5f60]">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Read-only queries (SELECT) are always safe to run.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
