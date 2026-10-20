/**
 * DataSpeak — AI Summary Callout Block (InsightCard.tsx)
 * Calm Analytics Workspace (docs/ui-example/code1.html)
 * Notion-style soft primary tint banner (#eaf3fc), border #c9e0f6,
 * sparkle icon, copy button, bullet list, and "View SQL ↓" link.
 */

import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

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

  // Extract lines / bullets if formatted with newlines or bullet characters
  const lines = summary.split('\n').filter((l) => l.trim().length > 0);
  const mainLead = lines[0] || summary;
  const bulletItems = lines.slice(1);

  return (
    <section className="bg-[#eaf3fc] border border-[#c9e0f6] rounded-lg p-5 sm:p-6 flex flex-col gap-3 shadow-2xs transition-all">
      {/* Top Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#0075de]" />
          <span className="text-[12px] font-semibold tracking-wider text-[#005bab] uppercase">
            AI Summary
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="text-[#615d59] hover:text-[#0d0d0d] text-[12px] px-2.5 py-1 rounded hover:bg-[#c9e0f6]/50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Copy summary text"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#2c8c66]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Paragraph */}
      <p className="text-[15px] sm:text-[16px] text-[#0d0d0d] leading-relaxed">
        {mainLead}
      </p>

      {/* Bulleted Insights if present */}
      {bulletItems.length > 0 && (
        <ul className="flex flex-col gap-1.5 pt-1 text-[14px] text-[#0d0d0d] leading-normal">
          {bulletItems.map((item, idx) => {
            const cleanText = item.replace(/^[-*•]\s*/, '');
            return (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0075de] mt-2 shrink-0"></span>
                <span>{cleanText}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Traceability & View SQL Footer */}
      <div className="pt-2 text-[13px] text-[#615d59] flex items-center justify-between border-t border-[#c9e0f6]/60">
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
            className="text-[#0075de] hover:underline font-medium text-[13px] cursor-pointer"
          >
            View SQL ↓
          </button>
        )}
      </div>
    </section>
  );
};
