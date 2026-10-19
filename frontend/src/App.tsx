/**
 * DataSpeak — Root Application Component
 * Configures ClerkProvider, AuthNavbar, ProtectedRoute, and interactive dashboard shell.
 */

import { useState } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { Sparkles, Zap, ShieldCheck, UserCheck, Terminal, AlertTriangle } from 'lucide-react';
import { AuthNavbar } from './components/auth/AuthNavbar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { authService } from './services/api';
import type { AuthUser } from './types';

// Retrieve publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const isClerkKeyValid =
  Boolean(CLERK_PUBLISHABLE_KEY) &&
  !CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key_here') &&
  CLERK_PUBLISHABLE_KEY.startsWith('pk_');

export function AppContent({ isClerkConfigured }: { isClerkConfigured: boolean }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Test calling backend GET /api/v1/auth/me with Bearer token
  const handleVerifyBackendAuth = async () => {
    setIsLoadingUser(true);
    setAuthError(null);
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (err: unknown) {
      console.error('Backend auth verification failed:', err);
      const message =
        err && typeof err === 'object' && 'response' in err
          ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
          : 'Failed to verify authentication with backend server.';
      setAuthError(message);
    } finally {
      setIsLoadingUser(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <AuthNavbar
        environment={import.meta.env.VITE_APP_ENV || 'development'}
        isClerkConfigured={isClerkConfigured}
      />

      <ProtectedRoute isClerkConfigured={isClerkConfigured}>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Phase 2: Authentication & Security Guardrails
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Ask Your Database{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
                Anything
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              DataSpeak transforms natural language questions into safe, strictly read-only SQL queries
              enforced by AST guardrails.
            </p>
          </div>

          {/* Quick Security & Auth Verification Panel */}
          <div className="max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm shadow-xl mb-12">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Security & Identity Health</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Guardrails Active
              </span>
            </div>

            <p className="text-sm text-slate-300 mb-5 leading-relaxed">
              Your session is authenticated via Clerk and protected on the backend using RS256 JWKS token validation.
              Verify server-side token exchange below:
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleVerifyBackendAuth}
                disabled={isLoadingUser}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                {isLoadingUser ? 'Verifying with Backend...' : 'Verify Token with GET /api/v1/auth/me'}
              </button>
            </div>

            {/* Verification Result Display */}
            {currentUser && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Backend Token Verified Successfully!</span>
                </div>
                <div className="rounded-lg bg-slate-950/80 p-3 font-mono text-xs text-slate-300 border border-slate-800/80 overflow-x-auto">
                  <pre>{JSON.stringify(currentUser, null, 2)}</pre>
                </div>
              </div>
            )}

            {authError && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Backend Auth Response Error:</span>
                </div>
                <p className="text-xs text-rose-300 font-mono break-all">{authError}</p>
              </div>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-white mb-1.5">Strict AST Guardrails</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                sqlglot AST inspection strictly prohibits mutations (INSERT, UPDATE, DELETE, DROP) and stacked queries.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-4">
                <Terminal className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-white mb-1.5">Automatic LIMIT Caps</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries are automatically injected with safe row caps (default LIMIT 100) to protect database performance.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-white mb-1.5">Stateless JWT Auth</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clerk Bearer tokens validated statelessly on FastAPI using cached RS256 JWKS public keys.
              </p>
            </div>
          </div>
        </main>
      </ProtectedRoute>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        DataSpeak v0.1.0 · Phase 2: Authentication & Security Guardrails ·{' '}
        <span className="text-indigo-400">Security Invariants Active</span>
      </footer>
    </div>
  );
}

export default function App() {
  if (isClerkKeyValid) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <AppContent isClerkConfigured={true} />
      </ClerkProvider>
    );
  }

  // Fallback when Clerk publishable key is not set in .env
  return <AppContent isClerkConfigured={false} />;
}
