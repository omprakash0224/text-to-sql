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
    <div className="w-full rounded-xl bg-[#dceaf6] border border-[#2c84e0]/30 p-6 sm:p-8 my-6 sm:my-8 shadow-sm transition-colors">
      {/* Header with Mascot Marginalia */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-lg select-none">💡</span>
          <span className="text-xs font-bold text-[#1d4ed8] uppercase tracking-wider">
            AI Narrative Insight
          </span>
        </div>

        <div className="flex items-center gap-3">
          <HedgehogMascot pose="scientist" size={32} className="hidden sm:inline-block" />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-[#4d4f46] hover:text-[#23251d] px-3.5 py-1.5 rounded-lg hover:bg-white/70 transition-colors border border-transparent hover:border-[#bfc1b7] shadow-2xs"
            title="Copy insight summary"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#2c8c66]" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs font-semibold">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Summary Narrative Body (Constrained to max-w-prose, 65ch–75ch) */}
      <div className="max-w-prose text-base text-[#23251d] leading-relaxed font-normal mb-5">
        {summary}
      </div>

      {/* Traceability Footer */}
      <div className="pt-3.5 border-t border-[#2c84e0]/20 flex items-center justify-between text-xs text-[#4d4f46]">
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
            className="inline-flex items-center gap-1.5 font-bold text-[#1078a3] hover:underline"
          >
            <span>View Generated SQL</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
