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
  // If Clerk is not configured with a valid key, allow dev preview with quiet notice
  if (!isClerkConfigured) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-[#fffbeb] border-b border-[#fde68a] px-4 py-2 text-center text-xs text-[#92400e]">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#92400e] shrink-0" />
            <span>
              <strong>Development Mode:</strong> Clerk Publishable Key is not configured.
              Add <code className="bg-[#fef3c7] px-1.5 py-0.5 rounded text-[#78350f] font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="font-mono">.env</code> to activate live authentication.
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

  // Allow preview inspection mode via ?preview=true or ?dev=true
  const isPreview =
    typeof window !== 'undefined' &&
    (window.location.search.includes('preview=true') ||
      window.location.search.includes('dev=true'));

  // Keep the Axios interceptor wired up with Clerk's latest session token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [isLoaded, isSignedIn, getToken]);

  // Loading state
  if (!isLoaded && !isPreview) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 bg-[#f4f5f6]">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#e2e4e8] bg-white p-8 text-center max-w-sm w-full">
          <Loader2 className="h-6 w-6 animate-spin text-[#1b6c80]" />
          <h1 className="text-sm font-medium text-[#131416]">Verifying session...</h1>
          <p className="text-xs text-[#5d5f60]">Checking authentication status with Clerk</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isSignedIn && !isPreview) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-10 bg-[#f4f5f6]">
        <div className="max-w-md w-full rounded-2xl border border-[#e2e4e8] bg-white p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#ebedee] text-[#131416] mb-5">
            <Lock className="h-5 w-5" />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-[#131416] mb-2.5">
            Sign in to DataSpeak
          </h1>
          <p className="text-sm text-[#5d5f60] mb-6 leading-relaxed px-2">
            Connect your relational databases, inspect schemas, and query in plain English with verified read-only guardrails.
          </p>

          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#131416] hover:bg-[#222428] px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              <Sparkles className="h-4 w-4 text-[#62aef0]" />
              <span>Sign in with Clerk</span>
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
