/**
 * DataSpeak — AI Summary Callout (InsightCard.tsx)
 * Framed-sheet style: Leading every response with plain-English insights, bold figures,
 * and traceable "Based on X rows · View generated SQL" verification link.
 */

import React, { useState } from 'react';
import { Sparkles, Copy, Check, ExternalLink } from 'lucide-react';

interface InsightCardProps {
  summary: string;
  rowCount?: number;
  onViewSql?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  summary,
  rowCount,
  onViewSql,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!summary) return null;

  return (
    <div className="w-full rounded-xl bg-[#f7f8fa] border border-[#e2e4e8] p-5 my-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-white border border-[#e2e4e8] text-[#1b6c80]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-[#131416]">
            Executive summary
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-xs text-[#5d5f60] hover:text-[#131416] px-2 py-0.5 rounded hover:bg-[#ebedee] transition-colors"
          title="Copy summary text"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#1e7b4f]" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Summary Narrative Body */}
      <div className="text-sm text-[#131416] leading-relaxed font-normal mb-3">
        {summary}
      </div>

      {/* Traceability Footer */}
      <div className="pt-2.5 border-t border-[#eceef0] flex items-center justify-between text-xs text-[#5d5f60]">
        <span>
          Based on{' '}
          <strong className="text-[#131416] tnum font-semibold">
            {rowCount !== undefined ? rowCount.toLocaleString() : 'queried'}
          </strong>{' '}
          {rowCount === 1 ? 'row' : 'rows'}
        </span>

        {onViewSql && (
          <button
            type="button"
            onClick={onViewSql}
            className="inline-flex items-center gap-1 font-medium text-[#1b6c80] hover:underline"
          >
            <span>View generated SQL</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
