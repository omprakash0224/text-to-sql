/**
 * DataSpeak — Root Application Component (App.tsx)
 * Integrates ClerkProvider, ProtectedRoute, and the Phase 5 AppLayout workspace.
 */

import { ClerkProvider } from '@clerk/clerk-react';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Retrieve publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
const isClerkKeyValid =
  Boolean(CLERK_PUBLISHABLE_KEY) &&
  !CLERK_PUBLISHABLE_KEY.includes('your_clerk_publishable_key_here') &&
  CLERK_PUBLISHABLE_KEY.startsWith('pk_');

export default function App() {
  if (isClerkKeyValid) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ProtectedRoute isClerkConfigured={true}>
          <AppLayout isClerkConfigured={true} />
        </ProtectedRoute>
      </ClerkProvider>
    );
  }

  // Fallback when Clerk publishable key is not set in .env
  return (
    <ProtectedRoute isClerkConfigured={false}>
      <AppLayout isClerkConfigured={false} />
    </ProtectedRoute>
  );
}
