# Horizone — Hotel Management

A hotel browsing and booking application.

- `frontend/` — React 18 + Vite, Tailwind, shadcn/ui, Redux Toolkit + RTK Query, React Router 7
- `backend/` — Express + TypeScript, MongoDB via Mongoose, JWT authentication

```bash
# frontend
cd frontend && npm install && npm run dev     # http://localhost:5173

# backend
cd backend && npm install && npm run dev      # http://localhost:8000
```

---

# Asgardeo Authentication Integration

[Asgardeo](https://wso2.com/asgardeo/) (WSO2's identity platform) is integrated into the
frontend using OpenID Connect with Authorization Code + PKCE.

## What was integrated, and why it is separate

The application already has its own authentication: a JWT held in Redux
(`frontend/src/lib/features/authSlice.js`), attached to backend calls by RTK Query, with an
ADMIN/USER role model enforced by `frontend/src/components/ProtectedRoute.jsx`.

Asgardeo was added as a **parallel, additive system** rather than a replacement. The existing
JWT flow is unmodified and fully functional.

| Piece | Implementation |
| --- | --- |
| SDK | `@asgardeo/react` v0.25.13 |
| Provider | `<AsgardeoProvider>` in `frontend/src/main.jsx` |
| Sign in / out UI | `SignInButton`, `SignOutButton`, `SignedIn`, `SignedOut` in `AsgardeoAuthControls.jsx` |
| User info | `useAsgardeo()` + decoded ID token, on `/asgardeo` |
| Protected route | `/asgardeo`, guarded by `AsgardeoProtectedRoute.jsx` |

The provider wraps the Redux `Provider` and `BrowserRouter`, outside the router: the sign-in
redirect returns to `/` carrying `?code=…&state=…`, and the SDK must complete that exchange
regardless of which route renders, so it cannot sit inside a route subtree.

The two systems share no state. `AsgardeoProtectedRoute` guards on Asgardeo's `isSignedIn` and
renders an inline sign-in prompt rather than redirecting, because Asgardeo hosts its own login
page and there is no in-app route to redirect to. `AsgardeoAuthControls` never dispatches to
the Redux auth slice. Backend API calls continue to carry the application's own JWT; the
Asgardeo token is never sent to the backend, which has no Asgardeo trust configuration.

Signing out of one system therefore does not affect the other. Unifying them would require the
backend to validate Asgardeo-issued tokens against the tenant's JWKS endpoint — a deliberate
non-goal.

### Configuration

`frontend/src/lib/asgardeo-config.js`, overridable via environment variables
(`frontend/.env.example`):

| Variable | Value |
| --- | --- |
| `VITE_ASGARDEO_CLIENT_ID` | `1f1Dw3GCvOIa0_HnHqQh4pfLJl8a` |
| `VITE_ASGARDEO_BASE_URL` | `https://api.asgardeo.io/t/orgyvp9v` |
| `VITE_ASGARDEO_REDIRECT_URL` | `http://localhost:5173` |

Scopes requested: `openid profile`. The client ID is a public SPA identifier, not a secret — a
browser client cannot hold one — so the application is registered as a public client and relies
on PKCE. `http://localhost:5173` must be registered as both an Authorized redirect URL and an
Allowed origin.

The Asgardeo flow talks only to the identity provider, so it runs without the backend.

## The React 18 / 19 SDK dependency bug

**Verified.** Reproduced directly, and fixed.

`@asgardeo/react@0.25.13` declares `react-dom: "19.2.4"` as a **hard dependency** while
declaring `react: ">=16.8.0"` as a peer dependency:

```json
"dependencies":     { "react-dom": "19.2.4", ... }
"peerDependencies": { "react": ">=16.8.0", ... }
```

Those two are incoherent. The package installs happily against React 18, then pulls in a React
19 renderer beside it. Loading that renderer fails:

```
Cannot read properties of undefined (reading 'S')
```

React 19's `react-dom` expects `React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`;
React 18.3.1 defines only `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`. Reading `.S`
off the missing object throws. `react-dom` belongs in `peerDependencies` for exactly this
reason.

Worked around in two places:

- `frontend/package.json` — an `overrides` entry pinning the SDK to the app's `react-dom@18.3.1`
- `frontend/vite.config.js` — `resolve.dedupe: ["react", "react-dom"]`, guaranteeing a single
  renderer in the bundle

Adding `overrides` alone was not sufficient: npm recorded the override but left the nested
`react-dom@19.2.4` on disk, still pinned by `package-lock.json`. The lockfile had to be
regenerated before the tree resolved to a single `react-dom@18.3.1`.

Both workarounds can be removed once the SDK moves `react-dom` to peer dependencies, or if the
application upgrades to React 19.

## Claim release: scope request is only one of three gates

With `openid profile`, the profile page shows `username` and `sub`, while `email`,
`given_name` and `family_name` show "not released".

That is correct behaviour, not a defect — and the reason is the most transferable thing in this
integration. Requesting a scope is one of **three independent gates** a claim must pass before
it reaches an ID token. An empty field looks identical whichever gate it failed, and the three
fixes are unrelated.

**Gate 1 — the attribute must hold a value.** An account created by self-registration with
only an email address and password has no `given_name` or `family_name` stored. No
configuration can release a value that does not exist; the profile must be populated first.
*Confirmed for this account.*

**Gate 2 — the attribute must be released to the application.** Under
*Applications → (app) → User Attributes*, each attribute must be marked as requested for that
application. A scope asks for claims; this setting governs whether the server will hand them
over. They are configured in different places, and neither implies the other.

**Gate 3 — the owning scope must be requested.** Claims are grouped under scopes, and this
tenant advertises them separately. **Verified** from the tenant's discovery document
(`/oauth2/token/.well-known/openid-configuration`):

```
scopes_supported: ["address","phone","openid","profile","roles","groups","email"]
```

`email` is its own scope, not part of `profile`. Enabling the `email` attribute under User
Attributes while the client requests only `openid profile` therefore changes nothing — the
claim is released but never asked for. `given_name` and `family_name` do belong to `profile`,
so those depend on gates 1 and 2 only.

This application deliberately requests `openid profile` and no more, so an absent `email` claim
is the expected outcome.

### Isolating gate 2

Changing all three gates at once cannot show which one mattered. Varying gate 1 and 2 for a
single `profile` claim, with gate 3 already satisfied, does.

**Before — observed.** ID token issued for `openid profile`, abridged:

```json
{
  "sub": "a8d1df04-3147-450f-9ebd-c3d1fccda043",
  "iss": "https://api.asgardeo.io/t/orgyvp9v/oauth2/token",
  "aud": "1f1Dw3GCvOIa0_HnHqQh4pfLJl8a",
  "sid": "c9ef3950-dd7a-442c-aab4-7006a809a50c",
  "username": "dinukashavinda20@gmail.com"
}
```

No `given_name`, `family_name` or `email` claim is present.

**After — observed.** A first name was set in My Account (gate 1), `given_name` was enabled
under the application's User Attributes (gate 2), and scopes were left at `openid profile`
(gate 3 already satisfied for `profile` claims). After signing out and back in, the ID token
contained:

```json
{
  "given_name": "Dinuka",
  ...
}
```

`email` and `family_name` remained absent, as predicted: `email` still fails gate 3, and
`family_name` was neither populated nor released.

One claim changed, one gate pair varied, and the two claims held back each failed a different
gate. That is what distinguishes claim release from scope request — had all three gates been
changed at once, the result would have been indistinguishable from "requesting `profile`
eventually works".

## Verification

The flow was checked at the protocol level, not only visually:

- **Authorization request** — `GET /oauth2/authorize` with the client ID and a PKCE `S256`
  challenge returns `302` to the hosted login page, with `redirect_uri` echoed back unmodified,
  confirming the registered callback matches what the SDK sends.
- **Public client** — a token request carrying a deliberately invalid code returns
  `invalid_grant`, not `invalid_client`, confirming the token endpoint accepts the client
  without a secret.
- **Rendering** — the app and the protected route render in headless Chrome with no console
  errors.
- **End to end** — self-registration, email verification and sign-in completed against the
  tenant, producing the ID token above with matching `iss`, `aud`, `sid` and `username`.
- **Claim release** — the gate 2 experiment above was run and its predicted outcome observed in
  the resulting ID token.

**Technical deep-dive: [ASGARDEO.md](ASGARDEO.md)** — the full investigation trail, including
the Node reproduction of the SDK renderer conflict, the raw protocol probes and their
responses, and the npm lockfile behaviour that made the dependency override appear not to work.

## Files

Added:

```
frontend/src/lib/asgardeo-config.js                 configuration + claim helpers
frontend/src/components/AsgardeoAuthControls.jsx    navbar sign-in / sign-out
frontend/src/components/AsgardeoProtectedRoute.jsx  route guard
frontend/src/pages/asgardeo-profile.page.jsx        protected profile page
frontend/.env.example                               environment variable template
```

Modified:

```
frontend/src/main.jsx                    provider wrapper + /asgardeo route
frontend/src/components/Navigation.jsx   nav link + <AsgardeoAuthControls /> (5 lines)
frontend/vite.config.js                  resolve.dedupe
frontend/package.json                    dependency + overrides
frontend/package-lock.json               regenerated so overrides apply
```

One unrelated fix was needed to surface any of this: `HotelListings.jsx` rendered a raw RTK
Query error object (`{status, error}`) as a React child, which throws React error #31 and
unmounts the entire application. With the backend down, that produced a blank page. It now
renders the error message instead.
