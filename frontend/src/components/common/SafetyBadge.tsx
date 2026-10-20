/**
 * DataSpeak — Safety Status Badge (SafetyBadge.tsx)
 * Strict icon + text pairing. Green and red strictly reserved for safety status.
 * Uses pale tints with dark text of the same hue as specified in app-screens.md.
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react';

export type SafetyVariant = 'readonly' | 'checking' | 'caution' | 'blocked';

interface SafetyBadgeProps {
  variant: SafetyVariant;
  label?: string;
  tooltipText?: string;
  className?: string;
}

export const SafetyBadge: React.FC<SafetyBadgeProps> = ({
  variant,
  label,
  tooltipText,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const config = {
    readonly: {
      defaultLabel: 'Read-only',
      icon: <ShieldCheck className="h-3 w-3 text-[#1e7b4f]" />,
      bg: 'bg-[#dcfae5]',
      border: 'border border-[#1e7b4f]/40',
      text: 'text-[#04250e]',
      defaultTooltip: 'DataSpeak can only read from this database. It cannot add, change, or delete anything.',
    },
    checking: {
      defaultLabel: 'Checking...',
      icon: <Loader2 className="h-3 w-3 text-[#5d5f60] animate-spin" />,
      bg: 'bg-[#ebedee]',
      border: 'border border-[#cdced1]',
      text: 'text-[#353736]',
      defaultTooltip: 'Validating safety and AST guardrails before execution.',
    },
    caution: {
      defaultLabel: 'Limited / Caution',
      icon: <AlertTriangle className="h-3 w-3 text-[#92400e]" />,
      bg: 'bg-[#fffbeb]',
      border: 'border border-[#fde68a]',
      text: 'text-[#92400e]',
      defaultTooltip: 'Safe query executed, but a safety limit (such as row capping) was applied.',
    },
    blocked: {
      defaultLabel: 'Blocked',
      icon: <ShieldAlert className="h-3 w-3 text-[#c4242a]" />,
      bg: 'bg-[#ffedea]',
      border: 'border border-[#c4242a]/40',
      text: 'text-[#831c1e]',
      defaultTooltip: 'A statement that would change data was refused and NOT executed.',
    },
  }[variant];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="status"
    >
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium select-none cursor-help transition-colors ${config.bg} ${config.border} ${config.text} ${className}`}
      >
        {config.icon}
        <span>{label || config.defaultLabel}</span>
      </span>

      {/* Floating Explanatory Popover (Real Overlay) */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 p-3 rounded-lg bg-[#23251d] text-white text-xs leading-relaxed shadow-overlay border border-neutral-700 pointer-events-none">
          <p className="text-neutral-100">{tooltipText || config.defaultTooltip}</p>
        </div>
      )}
    </div>
  );
};
