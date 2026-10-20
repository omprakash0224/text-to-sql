/**
 * DataSpeak — PostHog AI Narrative Summary (InsightCard.tsx)
 * Pastel blue callout banner (#dceaf6) with inline emoji, scientist mascot marginalia,
 * bold takeaways, and traceable "Based on X rows · View Generated SQL" verification link.
 */

import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { HedgehogMascot } from '../common/HedgehogMascot';

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
    <div className="w-full rounded-md bg-[#dceaf6] border border-[#2c84e0]/30 p-5 my-4 transition-colors">
      {/* Header with Mascot Marginalia */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base select-none">💡</span>
          <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider">
            AI Narrative Insight
          </span>
        </div>

        <div className="flex items-center gap-2">
          <HedgehogMascot pose="scientist" size={28} className="hidden sm:inline-block" />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-[#4d4f46] hover:text-[#23251d] px-2 py-1 rounded hover:bg-white/60 transition-colors border border-transparent hover:border-[#bfc1b7]"
            title="Copy insight summary"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#2c8c66]" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[11px] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Summary Narrative Body */}
      <div className="text-[15px] text-[#23251d] leading-relaxed font-normal mb-3.5">
        {summary}
      </div>

      {/* Traceability Footer */}
      <div className="pt-2.5 border-t border-[#2c84e0]/20 flex items-center justify-between text-xs text-[#4d4f46]">
        <span>
          Based on{' '}
          <strong className="text-[#23251d] tnum font-bold">
            {rowCount !== undefined ? rowCount.toLocaleString() : 'queried'}
          </strong>{' '}
          {rowCount === 1 ? 'row' : 'rows'}
        </span>

        {onViewSql && (
          <button
            type="button"
            onClick={onViewSql}
            className="inline-flex items-center gap-1 font-semibold text-[#1078a3] hover:underline"
          >
            <span>View Generated SQL</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
