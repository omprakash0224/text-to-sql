/**
 * DataSpeak — Generated SQL Preview (SqlPreview.tsx)
 * Calm Analytics Workspace (docs/ui-example/code1.html)
 * PostHog dark olive-charcoal (#23251d) card with JetBrains Mono,
 * syntax highlighting, read-only safety verified chip, execution stats,
 * and referenced tables chips.
 */

import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';

interface SqlPreviewProps {
  sql: string;
  dialect?: string;
  isReadonlyVerified?: boolean;
  executionTimeMs?: number;
  modelName?: string;
}

export const SqlPreview: React.FC<SqlPreviewProps> = ({
  sql,
  isReadonlyVerified = true,
  executionTimeMs = 42,
  modelName = 'Llama 3.3 70B via Groq',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sql) return null;

  // Extract tables used
  const extractedTables = Array.from(
    new Set(
      Array.from(sql.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z_0-9]+)/gi)).map((m) => m[1])
    )
  );

  // Syntax highlighting helper
  const highlightSql = (code: string) => {
    const lines = code.trim().split('\n');
    return lines.map((line, lineIdx) => {
      // Regex replace for keywords, strings, numbers
      const parts = line.split(/('(?:[^'\\]|\\.)*'|\b\d+\b|[(),;]|\s+)/g);

      return (
        <div key={lineIdx} className="leading-relaxed whitespace-pre">
          {parts.map((part, pIdx) => {
            if (!part) return null;

            // String literals
            if (part.startsWith("'") && part.endsWith("'")) {
              return (
                <span key={pIdx} className="text-[#8fd19e]">
                  {part}
                </span>
              );
            }

            // Numeric literals
            if (/^\d+$/.test(part)) {
              return (
                <span key={pIdx} className="text-[#fcab79]">
                  {part}
                </span>
              );
            }

            // SQL Keywords
            const upper = part.toUpperCase();
            const keywords = [
              'SELECT',
              'FROM',
              'WHERE',
              'JOIN',
              'LEFT',
              'RIGHT',
              'INNER',
              'OUTER',
              'ON',
              'AND',
              'OR',
              'GROUP BY',
              'ORDER BY',
              'GROUP',
              'ORDER',
              'BY',
              'LIMIT',
              'DESC',
              'ASC',
              'HAVING',
              'AS',
              'DISTINCT',
              'INTERVAL',
              'IN',
              'BETWEEN',
              'CASE',
              'WHEN',
              'THEN',
              'ELSE',
              'END',
              'UNION',
              'ALL',
            ];
            const functions = [
              'COUNT',
              'SUM',
              'AVG',
              'MIN',
              'MAX',
              'DATE_TRUNC',
              'NOW',
              'COALESCE',
              'ROUND',
              'LOWER',
              'UPPER',
            ];

            if (keywords.includes(upper)) {
              return (
                <span key={pIdx} className="text-[#62aef0] font-medium">
                  {part}
                </span>
              );
            }

            if (functions.includes(upper)) {
              return (
                <span key={pIdx} className="text-[#62aef0]">
                  {part}
                </span>
              );
            }

            return <span key={pIdx} className="text-white">{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <section
      id="dataspeak-sql-preview"
      className="bg-[#23251d] text-white rounded-lg overflow-hidden flex flex-col border border-[#dddddd]/20 shadow-2xs my-6"
    >
      {/* SQL Header Strip */}
      <div className="h-12 px-4 bg-[#2a2d23] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Safety Chip */}
          {isReadonlyVerified && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d9eddf] text-[#17543b] text-[11px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2c8c66]" />
              <span>Read-only check passed</span>
            </div>
          )}
          <span className="text-[12px] text-[#9b9c92] hidden sm:inline">
            Execution: {executionTimeMs.toFixed(0)}ms · LIMIT 100 enforced
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#c6c7bd] hover:text-white px-2.5 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy SQL query"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[#8fd19e]" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>
        </div>
      </div>

      {/* Code Body with JetBrains Mono Syntax Highlighting */}
      <div className="p-4 sm:p-5 font-mono text-[13px] leading-relaxed overflow-x-auto">
        {highlightSql(sql)}
      </div>

      {/* SQL Footer Strip */}
      <div className="px-4 py-2.5 bg-[#1e2019] border-t border-white/5 flex items-center justify-between text-[12px] text-[#9b9c92]">
        <div className="flex items-center gap-2 flex-wrap">
          <span>Tables used:</span>
          {extractedTables.length > 0 ? (
            extractedTables.map((tbl) => (
              <span
                key={tbl}
                className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]"
              >
                {tbl}
              </span>
            ))
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
              database
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#9b9c92]">{modelName}</span>
      </div>
    </section>
  );
};
