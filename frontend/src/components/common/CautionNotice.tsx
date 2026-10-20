/**
 * DataSpeak — Caution Notice Banner (CautionNotice.tsx)
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
      className={`w-full rounded-lg bg-[#fffbeb] border border-[#fde68a] border-l-4 border-l-[#92400e] p-3.5 my-2.5 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded bg-white text-[#92400e] shrink-0 mt-0.5 border border-[#fde68a]">
          <AlertTriangle className="h-3.5 w-3.5" />
        </div>

        <div className="flex-1">
          <h4 className="text-xs font-semibold text-[#92400e] mb-0.5">{title}</h4>
          <p className="text-xs text-[#5d5f60] leading-relaxed">{message}</p>
        </div>

        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-[#1b6c80] hover:underline shrink-0 flex items-center gap-1"
          >
            <span>{actionText}</span>
            <Info className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
