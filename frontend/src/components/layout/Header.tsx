/**
 * DataSpeak — Top Navigation Bar (Header.tsx)
 * Calm Analytics Workspace (docs/ui-example/code.html & code1.html)
 * 56px height, canvas #f6f5f4 with hairline border.
 * Features database selector dropdown chip, quiet search bar with ⌘K,
 * persistent read-only verification badge, and user identity profile.
 */

import React, { useState } from 'react';
import {
  Database,
  ChevronDown,
  Search,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';
import type { DatabaseConnection } from '../../types';

interface HeaderProps {
  activeConnection: DatabaseConnection | null;
  onOpenConnectModal: () => void;
  isClerkConfigured: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeConnection,
  onOpenConnectModal,
  isClerkConfigured,
  searchQuery = '',
  onSearchChange,
  onToggleMobileSidebar,
}) => {
  const { user } = useUser();
  const [showTooltip, setShowTooltip] = useState(false);

  const displayName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    (isClerkConfigured ? 'Guest User' : 'Local Workspace');

  const orgName =
    (user?.publicMetadata?.organization as string) ||
    (activeConnection ? activeConnection.name : 'DataSpeak Workspace');

  const userInitials = user?.firstName
    ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
    : user?.primaryEmailAddress?.emailAddress
    ? user.primaryEmailAddress.emailAddress.slice(0, 2).toUpperCase()
    : 'DS';

  return (
    <header className="h-14 w-full bg-[#f6f5f4]/95 backdrop-blur-sm border-b border-[#e6e6e6] sticky top-0 z-40 select-none px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger + Database Selector Chip */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded text-[#615d59] hover:text-[#0d0d0d] hover:bg-[#efeeec] transition-colors"
            title="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#efeeec] hover:bg-[#e6e6e6] text-[#31302e] text-[12px] font-medium border border-[#e6e6e6] transition-colors shadow-2xs group cursor-pointer"
          title="Switch or connect database"
        >
          <Database className={`h-3.5 w-3.5 ${activeConnection ? 'text-[#0075de]' : 'text-[#615d59]'}`} />
          <span className="tnum font-semibold truncate max-w-[150px] sm:max-w-[260px]">
            {activeConnection
              ? `${activeConnection.name} (${activeConnection.dialect === 'postgresql' ? 'PostgreSQL' : activeConnection.dialect.toUpperCase()})`
              : 'No Database Connected'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#615d59]" />
        </button>
      </div>

      {/* Center: Quiet Search Bar (max-w-md) */}
      <div className="w-full max-w-md hidden md:flex items-center mx-4">
        <div className="w-full relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[#615d59] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search queries, tables, metrics..."
            className="w-full h-8 pl-9 pr-10 rounded bg-white text-[13px] text-[#0d0d0d] placeholder:text-[#a39e98] border border-[#dddddd] focus:outline-none focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] transition-all shadow-2xs"
          />
          <kbd className="absolute right-2.5 text-[10px] font-mono text-[#615d59] bg-[#efeeec] px-1.5 py-0.5 rounded border border-[#e6e6e6] pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Persistent Safety Badge + User Profile */}
      <div className="flex items-center gap-3">
        {/* Persistent Safety Badge */}
        <div
          className="relative inline-flex items-center"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {activeConnection ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d9eddf] text-[#17543b] border border-[#2c8c66] text-[12px] font-semibold cursor-help"
              title="DataSpeak can only read from this database. Write statements are strictly blocked."
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#2c8c66]" />
              <span>Read-only</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#efeeec] text-[#615d59] border border-[#e6e6e6] text-[12px] font-medium cursor-help"
              title="No database currently connected. Connect a database to enable read-only analytics."
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#a39e98]" />
              <span>No Database</span>
            </div>
          )}

          {showTooltip && (
            <div className="absolute top-full right-0 mt-2 z-50 w-72 p-3 rounded-md bg-[#23251d] text-white text-[12px] leading-relaxed shadow-lg border border-[#33342d] pointer-events-none animate-in fade-in-50 duration-150">
              <p className="font-medium text-neutral-200">
                DataSpeak can only read from this database. Write statements are strictly blocked by AST analysis.
              </p>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#e6e6e6]">
          {isClerkConfigured ? (
            <div className="flex items-center gap-2">
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-7 w-7 rounded-full border border-[#e6e6e6]',
                    },
                  }}
                />
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-[13px] font-medium text-[#0d0d0d] leading-tight truncate max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-[#615d59] truncate max-w-[130px]">
                    {orgName}
                  </span>
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="h-7 px-3 rounded bg-[#0075de] hover:bg-[#005bab] text-white text-[12px] font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-default">
              <div className="w-7 h-7 rounded-full bg-white border border-[#e6e6e6] flex items-center justify-center text-[12px] font-semibold text-[#31302e] shadow-2xs">
                {userInitials}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-[13px] font-medium text-[#0d0d0d] leading-tight">
                  {displayName}
                </span>
                <span className="text-[11px] text-[#615d59]">
                  {orgName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
