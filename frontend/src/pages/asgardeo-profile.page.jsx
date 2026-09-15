import { SignOutButton, useAsgardeo } from "@asgardeo/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDisplayName, getEmail } from "@/lib/asgardeo-config";

/**
 * Demo page for the Asgardeo integration. Reachable only through
 * AsgardeoProtectedRoute, so `user` is always populated here.
 */
export default function AsgardeoProfilePage() {
  const { user, getDecodedIdToken } = useAsgardeo();
  const [idTokenClaims, setIdTokenClaims] = useState(null);

  // The SDK's `user` object and the decoded ID token carry different subsets of
  // the claims — `sub`, for one, arrives only on the ID token — so resolve each
  // field from `user` first and fall back to the token.
  const pick = (claim) => user?.[claim] ?? idTokenClaims?.[claim] ?? null;
  const claims = { ...idTokenClaims, ...user };

  const fields = [
    ["Username", getDisplayName(claims)],
    ["Email", getEmail(claims)],
    ["Given name", pick("given_name")],
    ["Family name", pick("family_name")],
    ["Subject (sub)", pick("sub")],
  ];

  useEffect(() => {
    let cancelled = false;

    getDecodedIdToken()
      .then((claims) => {
        if (!cancelled) setIdTokenClaims(claims);
      })
      // The profile is still usable from `user` alone if this fails.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [getDecodedIdToken]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Asgardeo Profile</h1>
          <p className="text-muted-foreground mt-1">
            Signed in via WSO2 Asgardeo (OpenID Connect).
          </p>
        </div>
        <SignOutButton>
          {({ signOut, isLoading }) => (
            <Button variant="outline" onClick={signOut} disabled={isLoading}>
              {isLoading ? "Signing out..." : "Sign Out"}
            </Button>
          )}
        </SignOutButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            {fields.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="col-span-2 text-sm break-all">
                  {value ?? (
                    <span className="text-muted-foreground">not released</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ID token claims</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto">
            {JSON.stringify(idTokenClaims ?? user ?? {}, null, 2)}
          </pre>
          <p className="text-xs text-muted-foreground mt-3">
            Claims depend on which attributes the Asgardeo application is
            configured to release for the requested scopes (openid profile).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
