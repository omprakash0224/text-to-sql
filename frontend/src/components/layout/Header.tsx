/**
 * DataSpeak — PostHog Top Navigation Bar (Header.tsx)
 * 56px height on warm cream canvas (#eeefe9) with 1px olive hairline (#bfc1b7).
 * Features PostHog hedgehog wordmark, database switcher chip, persistent Read-only badge,
 * and the iconic PostHog yellow CTA pill.
 */

import React from 'react';
import {
  Database,
  ChevronDown,
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react';
import { SafetyBadge } from '../common/SafetyBadge';
import { HedgehogMascot } from '../common/HedgehogMascot';
import type { DatabaseConnection } from '../../types';

interface HeaderProps {
  activeConnection: DatabaseConnection | null;
  onOpenConnectModal: () => void;
  isClerkConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeConnection,
  onOpenConnectModal,
  isClerkConfigured,
}) => {
  return (
    <header className="h-14 w-full bg-[#eeefe9] border-b border-[#bfc1b7] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Hedgehog Wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <HedgehogMascot pose="logo" size={32} />
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-[#23251d] leading-none">
              DataSpeak
            </span>
            <span className="text-[10px] text-[#6c6e63] font-medium tracking-tight">
              AI Text-to-SQL
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-[#bfc1b7] mx-2 hidden sm:block" />

        {/* Database Switcher Chip (White Card on Cream) */}
        <button
          type="button"
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-[#bfc1b7] hover:border-[#23251d] text-xs text-[#23251d] font-semibold transition-colors shadow-2xs"
          title="Switch or connect database"
        >
          <Database className="h-3.5 w-3.5 text-[#1078a3]" />
          <span className="truncate max-w-[130px] sm:max-w-[200px]">
            {activeConnection ? activeConnection.name : 'Connect Database'}
          </span>
          {activeConnection && (
            <span className="text-[10px] text-[#6c6e63] font-mono uppercase bg-[#eeefe9] px-1.5 py-0.5 rounded">
              {activeConnection.dialect}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-[#6c6e63]" />
        </button>
      </div>

      {/* Right Controls: Read-Only Badge, Yellow CTA Pill, and Clerk Auth */}
      <div className="flex items-center gap-3">
        {/* Mandatory Invariant: Persistent Read-only Badge */}
        <SafetyBadge
          variant={activeConnection ? 'readonly' : 'checking'}
          label={activeConnection ? 'Read-only' : 'No Database'}
          tooltipText={
            activeConnection
              ? `Connected to ${activeConnection.name} (${activeConnection.dialect}). sqlglot AST guardrails strictly permit SELECT queries only. Zero data mutation.`
              : 'Connect a database to begin querying.'
          }
        />

        {/* PostHog Yellow CTA Pill */}
        {!activeConnection && (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="posthog-button-primary-pill hidden sm:inline-flex"
          >
            <span>Connect DB — Free</span>
          </button>
        )}

        {/* Clerk Auth Integration */}
        {isClerkConfigured ? (
          <div className="flex items-center">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8 rounded-full border border-[#bfc1b7]',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="posthog-button-primary-pill text-xs"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#4d4f46] bg-[#e5e7e0] px-2.5 py-1 rounded-md border border-[#bfc1b7]">
            <span className="h-2 w-2 rounded-full bg-[#f7a501]" />
            <span className="text-[11px] font-semibold">Dev Mode</span>
          </div>
        )}
      </div>
    </header>
  );
};
