import { useEffect, type FC, type ReactNode } from 'react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { setAuthTokenGetter } from '../../services/api';
import { HedgehogMascot } from '../common/HedgehogMascot';

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
      <div className="flex flex-col min-h-screen bg-[#eeefe9]">
        <div className="bg-[#fef3c7] border-b border-[#fde68a] px-4 py-2 text-center text-xs text-[#78350f]">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#d97706] shrink-0" />
            <span>
              <strong>Development Preview Mode:</strong> Clerk Publishable Key is not configured.
              Add <code className="bg-[#fde68a] px-1.5 py-0.5 rounded text-[#78350f] font-mono font-semibold">VITE_CLERK_PUBLISHABLE_KEY</code> in <code className="font-mono">.env</code> for production authentication.
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 bg-[#eeefe9]">
        <div className="flex flex-col items-center gap-3.5 rounded-2xl border border-[#bfc1b7] bg-white p-8 sm:p-10 text-center max-w-sm w-full shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-[#f7a501]" />
          <h1 className="text-base font-bold text-[#23251d]">Verifying session...</h1>
          <p className="text-xs sm:text-sm text-[#4d4f46]">Checking authentication status with Clerk</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isSignedIn && !isPreview) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 py-12 sm:py-16 bg-[#eeefe9]">
        <div className="max-w-lg w-full rounded-2xl border border-[#bfc1b7] bg-white p-8 sm:p-12 text-center shadow-md">
          <div className="mx-auto flex justify-center mb-6">
            <HedgehogMascot pose="shield" size={96} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#23251d] mb-3 font-display">
            Sign in to DataSpeak
          </h1>
          <p className="max-w-prose text-sm sm:text-base text-[#4d4f46] mb-8 leading-relaxed mx-auto">
            Connect your relational databases, inspect live schemas, and query in natural language with strict AST-verified read-only guardrails.
          </p>

          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#f7a501] hover:bg-[#e09400] px-5 py-3 text-sm sm:text-base font-bold text-[#23251d] shadow-sm hover:shadow-md transition-all border border-[#d48c00]"
            >
              <Sparkles className="h-4.5 w-4.5 text-[#23251d]" />
              <span>Sign in with Clerk</span>
            </button>
          </SignInButton>

          <div className="mt-8 pt-5 border-t border-[#f0f1ec] text-xs text-[#8f9188] flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#3b82f6]" />
            <span>SQLite & PostgreSQL • Zero DDL/DML mutation allowed</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
