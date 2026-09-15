import { SignInButton, SignOutButton, SignedIn, SignedOut, useAsgardeo } from "@asgardeo/react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/lib/asgardeo-config";

/**
 * Asgardeo sign-in / sign-out controls for the navbar.
 *
 * Deliberately self-contained: it reads only Asgardeo state and never touches
 * the Redux JWT session, so the two auth systems sit side by side without
 * interfering. Removing the single <AsgardeoAuthControls /> line in
 * Navigation.jsx removes the feature entirely.
 */
export default function AsgardeoAuthControls() {
  const { user } = useAsgardeo();

  return (
    <div className="flex items-center gap-2 border-l border-white/20 pl-4">
      <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-white/50">
        Asgardeo
      </span>

      <SignedIn>
        <Link
          to="/asgardeo"
          className="text-sm max-w-[160px] truncate underline-offset-4 hover:underline"
          title={getDisplayName(user)}
        >
          {getDisplayName(user)}
        </Link>
        <SignOutButton>
          {({ signOut, isLoading }) => (
            <Button variant="ghost" onClick={signOut} disabled={isLoading}>
              {isLoading ? "Signing out..." : "Sign Out"}
            </Button>
          )}
        </SignOutButton>
      </SignedIn>

      <SignedOut>
        <SignInButton>
          {({ signIn, isLoading }) => (
            <Button variant="ghost" onClick={signIn} disabled={isLoading}>
              {isLoading ? "Redirecting..." : "Sign In with Asgardeo"}
            </Button>
          )}
        </SignInButton>
      </SignedOut>
    </div>
  );
}
