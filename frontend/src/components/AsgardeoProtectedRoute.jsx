import { SignInButton, useAsgardeo } from "@asgardeo/react";
import { Outlet } from "react-router";

import { Button } from "@/components/ui/button";

/**
 * Route guard backed by Asgardeo.
 *
 * Separate from the app's own `ProtectedRoute`, which guards routes using the
 * Redux JWT session and its ADMIN/USER roles. This one renders an inline
 * sign-in prompt instead of redirecting, because Asgardeo hosts its own login
 * page — there is no in-app route to redirect to.
 */
export default function AsgardeoProtectedRoute() {
  const { isSignedIn, isInitialized, isLoading } = useAsgardeo();

  if (!isInitialized || isLoading) {
    return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="text-muted-foreground">
          This page is protected by Asgardeo. Sign in with your Asgardeo account
          to continue.
        </p>
        <SignInButton>
          {({ signIn, isLoading: isSigningIn }) => (
            <Button onClick={signIn} disabled={isSigningIn}>
              {isSigningIn ? "Redirecting..." : "Sign In with Asgardeo"}
            </Button>
          )}
        </SignInButton>
      </div>
    );
  }

  return <Outlet />;
}
