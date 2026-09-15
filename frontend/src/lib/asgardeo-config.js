/**
 * Asgardeo (WSO2 Identity) configuration.
 *
 * This is a standalone demo of Asgardeo sign-in and is independent of the
 * app's own JWT auth in `lib/features/authSlice.js`. Neither system reads the
 * other's state.
 *
 * The client ID is a public SPA identifier, not a secret — a browser client
 * cannot keep one. The env vars are here so the values can be pointed at a
 * different tenant without a code change; see `.env.example`.
 */
export const asgardeoConfig = {
  clientId:
    import.meta.env.VITE_ASGARDEO_CLIENT_ID || "1f1Dw3GCvOIa0_HnHqQh4pfLJl8a",
  baseUrl:
    import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/orgyvp9v",
  afterSignInUrl:
    import.meta.env.VITE_ASGARDEO_REDIRECT_URL || "http://localhost:5173",
  scopes: "openid profile",
};

/**
 * Picks a human-readable display name out of the OIDC claims, which vary by
 * tenant depending on which attributes the app is configured to release.
 */
export const getDisplayName = (user) =>
  user?.username ||
  user?.userName ||
  user?.preferred_username ||
  user?.name ||
  user?.given_name ||
  user?.email ||
  user?.sub ||
  "Signed in user";

export const getEmail = (user) =>
  user?.email || user?.emails?.[0] || user?.preferred_username || null;
