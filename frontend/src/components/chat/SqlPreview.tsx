/**
 * DataSpeak — PostHog Transparent SQL Preview (SqlPreview.tsx)
 * Deep olive-charcoal (#23251d) code island with white text, line numbers,
 * read-only AST verification chip, copy action, and terminal mascot marginalia.
 */

import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Table as TableIcon,
} from 'lucide-react';
import { HedgehogMascot } from '../common/HedgehogMascot';

interface SqlPreviewProps {
  sql: string;
  dialect?: string;
  isReadonlyVerified?: boolean;
}

export const SqlPreview: React.FC<SqlPreviewProps> = ({
  sql,
  dialect = 'sqlite',
  isReadonlyVerified = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!sql) return null;

  const lines = sql.trim().split('\n');

  const extractedTables = Array.from(
    new Set(
      Array.from(sql.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z_0-9]+)/gi)).map((m) => m[1])
    )
  );

  return (
    <div
      id="dataspeak-sql-preview"
      className="w-full rounded-xl bg-[#23251d] text-white overflow-hidden shadow-md my-6 sm:my-8 border border-[#33342d] transition-all"
    >
      {/* Header Strip with standard 8-pt padding */}
      <div className="h-14 px-6 sm:px-8 bg-[#191a14] border-b border-[#33342d] flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Code className="h-4.5 w-4.5 text-[#62aef0]" />
          <span className="text-xs sm:text-sm font-bold text-neutral-100 font-mono">Generated SQL</span>
          <span className="text-[10px] sm:text-xs font-mono uppercase bg-[#33342d] text-neutral-300 px-2 py-0.5 rounded font-bold">
            {dialect}
          </span>

          {/* Safety Status Chip on SQL */}
          {isReadonlyVerified && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8fd19e] bg-[#2c8c66]/20 border border-[#2c8c66]/40 px-3 py-1 rounded-full ml-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8fd19e]" />
              <span>Read-only check passed</span>
            </span>
          )}
        </div>

        {/* Actions & Terminal Mascot */}
        <div className="flex items-center gap-3">
          <HedgehogMascot pose="terminal" size={30} className="hidden sm:inline-block" />

          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-[#33342d] transition-colors flex items-center gap-1.5 border border-transparent hover:border-neutral-700 font-semibold"
            title="Copy SQL to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-[#8fd19e]" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-neutral-300 hover:text-white rounded-lg hover:bg-[#33342d] transition-colors flex items-center gap-1"
            title={isCollapsed ? 'Expand SQL' : 'Collapse SQL'}
          >
            {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* SQL Code Block */}
      {!isCollapsed && (
        <div className="p-6 sm:p-8 font-mono text-xs sm:text-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/40">
                  <td className="w-10 pr-4 py-0.5 text-right select-none text-[#9b9c92] opacity-60 text-xs">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre text-neutral-100 py-0.5 leading-relaxed">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tables Referenced Indicator */}
          {extractedTables.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#33342d] flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                <TableIcon className="h-3.5 w-3.5 text-[#62aef0]" />
                <span>Tables used:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {extractedTables.map((tbl) => (
                  <span
                    key={tbl}
                    className="px-2.5 py-1 rounded bg-[#33342d] border border-neutral-700 text-neutral-200 font-mono text-xs font-semibold"
                  >
                    {tbl}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
