/**
 * DataSpeak — AI Summary Callout (InsightCard.tsx)
 * Notion-style callout leading every response with plain-English insights, bold figures,
 * and traceable "Based on X rows · View SQL" verification link.
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
    <div className="w-full rounded-xl bg-[#eaf3fc] border border-[#c9e0f6] p-6 shadow-2xs my-4 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0075de]/10 text-[#0075de]">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-[#005bab] uppercase tracking-wider">
            AI Narrative Summary
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-xs text-[#615d59] hover:text-[#0d0d0d] p-1 rounded hover:bg-[#c9e0f6]/50 transition-colors"
          title="Copy insight summary"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#2c8c66]" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Summary Narrative Body */}
      <div className="text-[15px] text-[#0d0d0d] leading-relaxed font-normal mb-4">
        {summary}
      </div>

      {/* Traceability Footer */}
      <div className="pt-3 border-t border-[#c9e0f6]/60 flex items-center justify-between text-xs text-[#615d59]">
        <span>
          Based on{' '}
          <strong className="text-[#0d0d0d] tnum font-semibold">
            {rowCount !== undefined ? rowCount.toLocaleString() : 'queried'}
          </strong>{' '}
          {rowCount === 1 ? 'row' : 'rows'}
        </span>

        {onViewSql && (
          <button
            type="button"
            onClick={onViewSql}
            className="inline-flex items-center gap-1 font-medium text-[#0075de] hover:underline"
          >
            <span>View Generated SQL</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
