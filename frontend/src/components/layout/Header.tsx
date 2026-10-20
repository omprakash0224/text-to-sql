/**
 * DataSpeak — Top Navigation Bar (Header.tsx)
 * Framed-sheet archetype: 48px height on tinted frame ground (#f4f5f6),
 * persistent Read-only safety badge, database chip switcher, and Clerk authentication.
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
    <header className="h-12 w-full bg-[#f4f5f6] border-b border-[#e2e4e8] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Active Database Chip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-[#131416] text-white flex items-center justify-center font-semibold text-xs">
            DS
          </div>
          <span className="font-semibold text-sm tracking-tight text-[#131416] hidden sm:inline">
            DataSpeak
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#e2e4e8] mx-1 hidden sm:block" />

        {/* Database Switcher Chip */}
        <button
          type="button"
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#e2e4e8] hover:border-[#1b6c80] text-xs text-[#131416] font-medium transition-colors"
          title="Switch or connect database"
        >
          <Database className="h-3.5 w-3.5 text-[#1b6c80]" />
          <span className="truncate max-w-[140px] sm:max-w-[220px]">
            {activeConnection ? activeConnection.name : 'Connect Database'}
          </span>
          <ChevronDown className="h-3 w-3 text-[#5d5f60]" />
        </button>
      </div>

      {/* Right Controls: Persistent Read-Only Badge & Clerk Auth */}
      <div className="flex items-center gap-3">
        {/* Mandatory Invariant: Persistent Read-only Badge in Top Bar */}
        <SafetyBadge
          variant={activeConnection ? 'readonly' : 'checking'}
          label={activeConnection ? 'Read-only' : 'No Database'}
          tooltipText={
            activeConnection
              ? `Connected to ${activeConnection.name} (${activeConnection.dialect}). All queries are validated by AST guardrails. DataSpeak cannot mutate data.`
              : 'Connect a database to begin querying.'
          }
        />

        {/* Clerk User Button / Sign In Gate */}
        {isClerkConfigured ? (
          <div className="flex items-center">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-7 w-7 rounded-full border border-[#e2e4e8]',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-medium rounded-md bg-[#131416] hover:bg-[#222428] text-white transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-[#5d5f60] bg-[#ebedee] px-2 py-0.5 rounded">
            <span>Dev Mode</span>
          </div>
        )}
      </div>
    </header>
  );
};
