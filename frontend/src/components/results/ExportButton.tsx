/**
 * DataSpeak — PostHog CSV Export Button (ExportButton.tsx)
 * Triggers formula-sanitized RFC 4180 CSV generation with PostHog styling.
 */

import React, { useState } from 'react';
import { Download, Check, Loader2 } from 'lucide-react';
import { downloadCsv } from '../../utils/exportUtils';

interface ExportButtonProps {
  columns: string[];
  rows: Record<string, unknown>[];
  questionPrompt?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  columns,
  rows,
  questionPrompt,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadedName, setDownloadedName] = useState<string | null>(null);

  const handleExport = () => {
    if (disabled || rows.length === 0) return;

    setIsExporting(true);
    try {
      const filename = downloadCsv(columns, rows, questionPrompt);
      setDownloadedName(filename);
      setTimeout(() => {
        setDownloadedName(null);
      }, 3000);
    } catch (e) {
      console.error('CSV export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || rows.length === 0 || isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-[#bfc1b7] text-[#23251d] hover:bg-[#eeefe9] active:bg-[#e5e7e0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Export sanitized CSV (RFC 4180)"
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#f7a501]" />
        ) : downloadedName ? (
          <Check className="h-3.5 w-3.5 text-[#2c8c66]" />
        ) : (
          <Download className="h-3.5 w-3.5 text-[#4d4f46]" />
        )}
        <span>{downloadedName ? 'Downloaded' : 'Export CSV'}</span>
      </button>

      {/* Ephemeral Toast Confirmation */}
      {downloadedName && (
        <div className="absolute right-0 top-full mt-1.5 z-40 bg-[#23251d] text-white text-[11px] px-2.5 py-1.5 rounded-md shadow-lg border border-[#33342d] whitespace-nowrap animate-in fade-in-50">
          Exported {rows.length} rows to {downloadedName}
        </div>
      )}
    </div>
  );
};
