/**
 * DataSpeak — Blocked Notice Banner (Calm Analytics Workspace)
 * Shown in place of results when a query attempts DDL/DML mutations.
 * Strict zero mutation policy with clear explanation and zero bypass controls.
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
      className="w-full rounded-lg bg-[#f7d6d3] border border-[#cd4239] border-l-4 border-l-[#cd4239] p-5 sm:p-6 my-6 shadow-xs transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-md bg-white text-[#cd4239] shrink-0 border border-[#cd4239]/20 shadow-xs">
          <ShieldAlert className="h-6 w-6 text-[#cd4239]" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[16px] font-bold text-[#86241d] tracking-tight">
              Action Blocked: Mutation Statements are Prohibited
            </h3>
          </div>

          <p className="max-w-prose text-[14px] text-[#31302e] leading-relaxed mb-3">
            {reason ||
              'Your request contains operations that attempt to insert, update, delete, or alter database schemas. DataSpeak is strictly read-only to guarantee database safety.'}
          </p>

          <p className="text-[12px] font-semibold text-[#cd4239] tracking-wider uppercase mb-4">
            Nothing was run. Your database is completely unchanged.
          </p>

          {/* Offending Statement Peek (Sanitized) */}
          {blockedSql && (
            <div className="mb-4 rounded-md bg-[#23251d] text-white p-3.5 font-mono text-[12px] overflow-x-auto border border-white/10">
              <span className="text-[#9b9c92] select-none mr-2">-- Refused statement:</span>
              <span className="text-[#ff8b82] font-semibold">{blockedSql}</span>
            </div>
          )}

          {/* Safe Action Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            {onEditQuestion && (
              <button
                type="button"
                onClick={onEditQuestion}
                className="px-3.5 py-1.5 text-[13px] font-medium rounded-md bg-surface hover:bg-surface-hover text-ink border border-hairline-strong shadow-xs inline-flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-primary" />
                <span>Edit question</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Only SELECT statements are permitted by AST analysis.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
