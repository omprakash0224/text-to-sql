/**
 * DataSpeak — Caution Notice Banner (DESIGN.md)
 * For safe-but-altered outcomes (e.g. automatic LIMIT 100 applied, query timeout, truncated results).
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
      className={`w-full rounded-xl bg-[#fdf0d0] border border-[#f7a501] border-l-4 border-l-[#f7a501] p-4 shadow-sm my-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-md bg-white/60 text-[#f7a501] shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#6e4600] mb-0.5">{title}</h4>
          <p className="text-xs text-[#31302e] leading-relaxed">{message}</p>
        </div>

        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-[#0075de] hover:underline shrink-0 flex items-center gap-1"
          >
            <span>{actionText}</span>
            <Info className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
