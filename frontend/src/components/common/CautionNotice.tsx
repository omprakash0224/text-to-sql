/**
 * DataSpeak — Caution Notice Banner (Calm Analytics Workspace)
 * Soft amber banner for safe-but-altered outcomes (row caps, timeouts).
 */

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface CautionNoticeProps {
  title?: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const CautionNotice: React.FC<CautionNoticeProps> = ({
  title = 'Safety limit applied',
  message,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      role="status"
      className={`w-full rounded-md bg-[#fdf0d0] border border-[#f7a501]/40 border-l-4 border-l-[#f7a501] p-4 sm:p-5 my-4 shadow-xs transition-colors ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[#f7a501] shrink-0 mt-0.5" />

        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-[#6e4600] mb-0.5">{title}</h4>
          <p className="max-w-prose text-[13px] text-[#31302e] leading-relaxed">{message}</p>
        </div>

        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-[12px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-1"
          >
            <span>{actionText}</span>
            <Info className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
