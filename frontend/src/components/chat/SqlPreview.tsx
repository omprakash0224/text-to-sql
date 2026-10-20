/**
 * DataSpeak — Transparent SQL Preview Component (SqlPreview.tsx)
 * Deliberate dark island (#23251d) showing generated dialect SQL, safety verification chip,
 * line numbers, copy action, and table dependencies. Zero shadows at rest.
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

  // Split lines for line numbers
  const lines = sql.trim().split('\n');

  // Regex extractor for tables used in query
  const extractedTables = Array.from(
    new Set(
      Array.from(sql.matchAll(/\b(?:FROM|JOIN)\s+([a-zA-Z_0-9]+)/gi)).map((m) => m[1])
    )
  );

  return (
    <div
      id="dataspeak-sql-preview"
      className="w-full rounded-xl bg-[#23251d] text-white overflow-hidden my-3 border border-neutral-800"
    >
      {/* Header Strip */}
      <div className="h-10 px-3.5 bg-[#1a1c15] border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-3.5 w-3.5 text-[#62aef0]" />
          <span className="text-xs font-medium text-neutral-200">Generated SQL</span>
          <span className="text-[10px] uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
            {dialect}
          </span>

          {/* Safety Status Chip on SQL */}
          {isReadonlyVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8fd19e] bg-[#2c8c66]/20 border border-[#2c8c66]/40 px-2 py-0.5 rounded-full ml-1">
              <ShieldCheck className="h-3 w-3 text-[#8fd19e]" />
              <span>Read-only check passed</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-xs text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors flex items-center gap-1"
            title="Copy SQL to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#8fd19e]" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-[11px] hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-xs text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors flex items-center gap-1"
            title={isCollapsed ? 'Expand SQL' : 'Collapse SQL'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* SQL Code Block */}
      {!isCollapsed && (
        <div className="p-3.5 font-mono text-xs overflow-x-auto">
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
            <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <TableIcon className="h-3 w-3 text-[#62aef0]" />
                <span>Tables used:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractedTables.map((tbl) => (
                  <span
                    key={tbl}
                    className="px-1.5 py-0.5 rounded bg-neutral-800/80 border border-neutral-700 text-neutral-200 text-[10px]"
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
