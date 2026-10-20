/**
 * DataSpeak — Safety Status Badge (DESIGN.md)
 * Strict icon + text pairing. Green and red strictly reserved for safety status.
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
      icon: <ShieldCheck className="h-3.5 w-3.5 text-[#2c8c66]" />,
      bg: 'bg-[#d9eddf]',
      border: 'border border-[#2c8c66]',
      text: 'text-[#17543b]',
      defaultTooltip: 'DataSpeak can only read from this database. It cannot add, change, or delete anything.',
    },
    checking: {
      defaultLabel: 'Checking…',
      icon: <Loader2 className="h-3.5 w-3.5 text-[#615d59] animate-spin" />,
      bg: 'bg-[#e5e7e0]',
      border: 'border border-[#dddddd]',
      text: 'text-[#31302e]',
      defaultTooltip: 'Validating safety and AST guardrails before execution.',
    },
    caution: {
      defaultLabel: 'Limited / Caution',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-[#f7a501]" />,
      bg: 'bg-[#fdf0d0]',
      border: 'border border-[#f7a501]',
      text: 'text-[#6e4600]',
      defaultTooltip: 'Safe query executed, but a safety limit (such as row capping) was applied.',
    },
    blocked: {
      defaultLabel: 'Blocked',
      icon: <ShieldAlert className="h-3.5 w-3.5 text-white" />,
      bg: 'bg-[#cd4239]',
      border: 'border border-[#cd4239]',
      text: 'text-white',
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none cursor-help transition-all ${config.bg} ${config.border} ${config.text} ${className}`}
      >
        {config.icon}
        <span>{label || config.defaultLabel}</span>
      </span>

      {/* Floating Explanatory Popover (Level 2 Elevation) */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 p-3 rounded-lg bg-[#23251d] text-white text-xs leading-relaxed shadow-xl border border-neutral-700 pointer-events-none animate-in fade-in-50 duration-150">
          <p className="font-medium text-neutral-100">{tooltipText || config.defaultTooltip}</p>
        </div>
      )}
    </div>
  );
};
