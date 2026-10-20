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
      className="w-full rounded-md bg-[#23251d] text-white overflow-hidden shadow-sm my-4 border border-[#33342d] transition-all"
    >
      {/* Header Strip */}
      <div className="h-11 px-4 bg-[#191a14] border-b border-[#33342d] flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <Code className="h-4 w-4 text-[#62aef0]" />
          <span className="text-xs font-bold text-neutral-100 font-mono">Generated SQL</span>
          <span className="text-[10px] font-mono uppercase bg-[#33342d] text-neutral-300 px-1.5 py-0.5 rounded">
            {dialect}
          </span>

          {/* Safety Status Chip on SQL */}
          {isReadonlyVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8fd19e] bg-[#2c8c66]/20 border border-[#2c8c66]/40 px-2 py-0.5 rounded-full ml-1">
              <ShieldCheck className="h-3 w-3 text-[#8fd19e]" />
              <span>Read-only check passed</span>
            </span>
          )}
        </div>

        {/* Actions & Terminal Mascot */}
        <div className="flex items-center gap-2">
          <HedgehogMascot pose="terminal" size={26} className="hidden sm:inline-block" />

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-xs text-neutral-300 hover:text-white rounded hover:bg-[#33342d] transition-colors flex items-center gap-1"
            title="Copy SQL to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#8fd19e]" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[11px] hidden sm:inline font-semibold">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-xs text-neutral-300 hover:text-white rounded hover:bg-[#33342d] transition-colors flex items-center gap-1"
            title={isCollapsed ? 'Expand SQL' : 'Collapse SQL'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* SQL Code Block */}
      {!isCollapsed && (
        <div className="p-4 font-mono text-xs overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/40">
                  <td className="w-8 pr-3 text-right select-none text-[#9b9c92] opacity-60 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="whitespace-pre text-neutral-100">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tables Referenced Indicator */}
          {extractedTables.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#33342d] flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 text-neutral-300">
                <TableIcon className="h-3 w-3 text-[#62aef0]" />
                <span>Tables used:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractedTables.map((tbl) => (
                  <span
                    key={tbl}
                    className="px-2 py-0.5 rounded bg-[#33342d] border border-neutral-700 text-neutral-200 font-mono text-[10px]"
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
