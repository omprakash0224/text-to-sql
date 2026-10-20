/**
 * DataSpeak — Top Navigation Bar (Header.tsx)
 * 56px height, persistent Read-only safety badge, database chip switcher,
 * and Clerk authentication controls.
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
    <header className="h-14 w-full bg-[#f6f5f4] border-b border-[#e6e6e6] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Active Database Chip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#0075de] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            DS
          </div>
          <span className="font-bold text-base tracking-tight text-[#0d0d0d] hidden sm:inline">
            DataSpeak
          </span>
        </div>

        <div className="h-4 w-px bg-[#dddddd] mx-1 hidden sm:block" />

        {/* Database Switcher Chip */}
        <button
          type="button"
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#dddddd] hover:border-[#0075de]/50 text-xs text-[#0d0d0d] font-medium transition-all shadow-2xs"
          title="Switch or connect database"
        >
          <Database className="h-3.5 w-3.5 text-[#0075de]" />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {activeConnection ? activeConnection.name : 'Connect Database'}
          </span>
          <ChevronDown className="h-3 w-3 text-[#a39e98]" />
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
                    avatarBox: 'h-8 w-8 rounded-full border border-[#dddddd]',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white transition-colors"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[#615d59] bg-[#efeeec] px-2.5 py-1 rounded-md">
            <span className="h-2 w-2 rounded-full bg-[#f7a501]" />
            <span className="text-[11px] font-medium">Dev Auth</span>
          </div>
        )}
      </div>
    </header>
  );
};
