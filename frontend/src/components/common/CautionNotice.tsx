/**
 * DataSpeak — PostHog Caution Notice Banner (CautionNotice.tsx)
 * Pastel amber banner with emoji icon for safe-but-altered outcomes (row caps, timeouts).
 */

import React from 'react';
import { Info } from 'lucide-react';

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
      className={`w-full rounded-xl bg-[#fffbeb] border border-[#f7a501] border-l-4 border-l-[#f7a501] p-6 sm:p-7 my-6 shadow-sm transition-colors ${className}`}
    >
      <div className="flex items-start gap-4">
        <span className="text-xl select-none mt-0.5">⚠️</span>

        <div className="flex-1">
          <h4 className="text-sm sm:text-base font-bold text-[#23251d] mb-1">{title}</h4>
          <p className="max-w-prose text-xs sm:text-sm text-[#4d4f46] leading-relaxed">{message}</p>
        </div>

        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-xs sm:text-sm font-bold text-[#1078a3] hover:underline shrink-0 flex items-center gap-1.5"
          >
            <span>{actionText}</span>
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
