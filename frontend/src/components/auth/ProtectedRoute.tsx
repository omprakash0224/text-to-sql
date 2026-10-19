import { useEffect, type FC, type ReactNode } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { Lock, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { setAuthTokenGetter } from '../../services/api';

interface ProtectedRouteProps {
  children: ReactNode;
  isClerkConfigured: boolean;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  isClerkConfigured,
}) => {
  // If Clerk is not configured with a valid key, allow dev preview with warning banner
  if (!isClerkConfigured) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-amber-950/40 border-b border-amber-500/20 px-4 py-2.5 text-center text-xs text-amber-200">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Development Mode:</strong> Clerk Publishable Key is not configured.
              Add <code className="bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-100 font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="font-mono">.env</code> to activate live authentication.
            </span>
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return <ClerkAuthGate>{children}</ClerkAuthGate>;
};

const ClerkAuthGate: FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Keep the Axios interceptor wired up with Clerk's latest session token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400 font-medium">Verifying authentication session...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isSignedIn) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Please sign in to connect to your databases, inspect schemas, and query data with safe SQL guardrails.
          </p>

          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <Sparkles className="h-4 w-4" />
              Sign in with Clerk
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
