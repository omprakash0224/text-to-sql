import type { FC } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Database, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthNavbarProps {
  environment?: string;
  isClerkConfigured: boolean;
}

export const AuthNavbar: FC<AuthNavbarProps> = ({
  environment = 'development',
  isClerkConfigured,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-2 shadow-lg shadow-indigo-500/20">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Data<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Speak</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              AI Text-to-SQL
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-4">
          {/* Environment & Security Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>AST Guardrails Active</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-400">{environment}</span>
          </div>

          {/* Clerk Auth Section */}
          {isClerkConfigured ? (
            <div className="flex items-center gap-3">
              <SignedIn>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-slate-800 bg-slate-900/50 p-0.5">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'h-8 w-8 ring-2 ring-indigo-500/30 hover:ring-indigo-500/60 transition-all',
                        },
                      }}
                    />
                  </div>
                </div>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Clerk Key Missing</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
