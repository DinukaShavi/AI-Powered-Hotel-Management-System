# Asgardeo Integration — Technical Deep-Dive

The investigation trail behind the integration. For what was built, how to run it and the
conclusions, see [README.md](README.md); this file holds the evidence.

Three findings are recorded here:

1. Why the application rendered a blank page — and why the first diagnosis was wrong
2. A real dependency-declaration defect in `@asgardeo/react`, and its actual (limited) impact
3. How OIDC claim release was isolated from scope request

---

## 1. The blank page, and a misattributed cause

### Symptom

A blank page after adding the integration. `index.html` served `200`, the dev server reported
no transform errors, and the production build succeeded.

### First diagnosis — wrong

`npm install @asgardeo/react` had emitted `ERESOLVE overriding peer dependency` warnings, and
the tree contained a second renderer (see section 2). Requiring that renderer directly in Node
throws, which looked like a sufficient explanation. It was not tested against the actual
symptom before being acted on.

The workaround was applied, and **the page was still blank.** The first diagnosis had explained
nothing.

### Second diagnosis — reading the error instead of reasoning about it

Rather than theorise again, the browser's own console was captured from a headless run:

```
$ chrome --headless=new --dump-dom --enable-logging=stderr http://localhost:4173/
[INFO:CONSOLE] "Uncaught Error: Minified React error #31;
  args[]=object%20with%20keys%20%7Bstatus%2C%20error%7D"
```

React error #31 is *objects are not valid as a React child* — and the offending object had keys
`{status, error}`, the shape of an RTK Query failure.

`frontend/src/components/HotelListings.jsx` rendered the error object directly:

```jsx
<p className="text-red-500">{error}</p>
```

`error` is an RTK Query error object, not a string. The trigger was the backend being down: the
hotels request failed, the error branch rendered, React threw, and because an uncaught throw
during render unmounts the whole tree, the *entire* application went blank rather than just the
hotel list.

This bug pre-dates the Asgardeo work. The integration merely supplied a reason to load the page
with the backend stopped.

### What this cost, and the correction

The dependency conflict in section 2 is real, but it **did not cause the blank page**. It was
treated as the cause on the strength of a plausible mechanism and a crash reproduced in an
artificial setting, and that conclusion survived until a clean-room test contradicted it.

Two lessons, in order of usefulness:

- A fix that does not resolve the symptom is evidence the diagnosis is wrong. Here the symptom
  persisted and the diagnosis was kept anyway — the error was still believed, just assumed to
  be compounded by something else.
- Capturing the actual error ended in minutes what re-reasoning from the symptom had not. Two
  independent faults can produce an identical symptom, and only one of them was real.

---

## 2. The dependency-declaration defect

Real, reported upstream — but far narrower in effect than first assumed.

### The declaration

```json
"dependencies":     { "react-dom": "19.2.4", "@types/react-dom": "19.2.3", ... }
"peerDependencies": { "react": ">=16.8.0", "@types/react": ">=16.8.0" }
```

`react-dom` is a **hard dependency pinned to an exact 19.x**, while `react` is a peer accepting
anything from 16.8 up. A renderer must match the `react` it renders with, so these cannot be
satisfied together on React 18.

### Observed tree

From a clean-room reproduction — a minimal Vite + React 18 app with the SDK installed and no
workarounds:

```
$ npm ls react
asgardeo-react18-repro@0.0.0
+-- @asgardeo/react@0.25.13
| +-- @floating-ui/react@0.27.12
| | +-- @floating-ui/react-dom@2.1.9
| | | `-- react@18.3.1 deduped invalid: "^19.2.4" from node_modules/@asgardeo/react/node_modules/react-dom
| | `-- react@18.3.1 deduped
| +-- react-dom@19.2.4
| | `-- react@18.3.1 deduped invalid: "^19.2.4" from node_modules/@asgardeo/react/node_modules/react-dom
| `-- react@18.3.1 deduped
+-- react-dom@18.3.1
`-- react@18.3.1
```

npm itself marks the tree `invalid`: the nested `react-dom@19.2.4` requires `react ^19.2.4` and
is given 18.3.1.

### Actual impact — measured

The same repro **renders correctly** under both `vite dev` and `vite preview`, with no console
errors. `@asgardeo/react`'s `dist/index.js` does not import `react-dom` itself, so the
mismatched copy is never executed in normal use.

Both renderers do reach the bundle, confirmed by grepping the build output for each version's
internals symbol. Deduplicating them:

```
before (two renderers):  711,161 bytes   (196.23 kB gzip)
after  (one renderer):   707,294 bytes   (194.90 kB gzip)
```

So the practical cost is roughly 3.9 kB of dead renderer, not a failure.

### The copy is genuinely broken if loaded

```
$ node -e "require('./node_modules/@asgardeo/react/node_modules/react-dom/client')"
TypeError: Cannot read properties of undefined (reading 'S')
```

React 19's `react-dom` reads
`React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`; React 18.3.1 defines
only `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`. Dereferencing `.S` on `undefined`
throws at module load.

This is what makes the defect worth reporting: any consumer whose bundler resolves that copy
would hit this. This application's does not — which is exactly the distinction the first
diagnosis missed.

### The lockfile gotcha

Adding an `overrides` entry to `package.json` and re-running `npm install` was **not enough**.
npm reported the override as applied:

```
+-- @asgardeo/react@0.25.13 overridden
| `-- react-dom@19.2.4 invalid: "^18.3.1" from node_modules/@asgardeo/react overridden
```

It knew the resolution should be `^18.3.1`, yet 19.2.4 was still on disk. The override had not
been written into `package-lock.json`:

```
$ node -e "const l=require('./package-lock.json'); console.log(l.packages['']?.overrides || 'NONE')"
NONE
```

The lockfile still pinned the nested `react-dom@19.2.4`, and npm honoured the lock over the new
override. Deleting `node_modules/@asgardeo` did not help — each install restored 19.2.4 from
the lock. Regenerating `package-lock.json` resolved it:

```
$ npm ls react-dom
+-- @asgardeo/react@0.25.13 overridden
| +-- @floating-ui/react@0.27.12
| | +-- @floating-ui/react-dom@2.1.9
| | | `-- react-dom@18.3.1 deduped
| | `-- react-dom@18.3.1 deduped
| `-- react-dom@18.3.1 deduped
`-- react-dom@18.3.1
```

One renderer, no `invalid` markers.

Worth knowing generally: when an `overrides` entry appears to have no effect, check whether the
lockfile recorded it before assuming the override syntax is wrong.

### Applied

- `frontend/package.json` — `overrides` pinning the SDK to the app's `react-dom`
- `frontend/vite.config.js` — `resolve.dedupe: ["react", "react-dom"]`

Kept as dependency hygiene, not as a fix for a live failure. Removable once the SDK moves
`react-dom` to `peerDependencies`, or on a React 19 upgrade.

### Repro environment

`@asgardeo/react` 0.25.13 · react 18.3.1 · react-dom 18.3.1 · Vite 6.4.3 · Node v22.12.0 ·
npm 10.9.0 · Windows 11

---

## 3. Isolating claim release from scope request

### Protocol probes

These ran before any browser sign-in, to establish that the tenant and application were
configured correctly.

**Authorization request** — client ID, registered callback and PKCE `S256`:

```
$ curl -i -G "https://api.asgardeo.io/t/orgyvp9v/oauth2/authorize" \
    --data-urlencode "response_type=code" \
    --data-urlencode "client_id=1f1Dw3GCvOIa0_HnHqQh4pfLJl8a" \
    --data-urlencode "redirect_uri=http://localhost:5173" \
    --data-urlencode "scope=openid profile" \
    --data-urlencode "code_challenge=$CH" \
    --data-urlencode "code_challenge_method=S256"

HTTP/1.1 302 Found
Location: https://accounts.asgardeo.io/t/orgyvp9v/authenticationendpoint/login.do
  ?client_id=1f1Dw3GCvOIa0_HnHqQh4pfLJl8a
  &redirect_uri=http%3A%2F%2Flocalhost%3A5173
  &scope=openid+profile
  &sp=Open+Yaks
```

A `302` to the hosted login page, with `redirect_uri` echoed back byte-identical. An
unregistered callback would have produced an error instead, so this confirms the console
registration matches what the SDK sends — including the absence of a trailing slash.

**Public client** — a token request carrying a deliberately invalid authorization code:

```
$ curl -X POST "https://api.asgardeo.io/t/orgyvp9v/oauth2/token" \
    -d "grant_type=authorization_code" -d "code=probe_invalid_code_abc123" \
    -d "redirect_uri=http://localhost:5173" \
    -d "client_id=1f1Dw3GCvOIa0_HnHqQh4pfLJl8a" -d "code_verifier=..."

{"error":"invalid_grant","error_description":"Invalid authorization code received from token request"}
```

`invalid_grant`, not `invalid_client`. The endpoint authenticated the client without a secret
and rejected only the code, confirming a public client with PKCE — what a SPA requires. Had the
application been registered as confidential, sign-in would have appeared to succeed and then
failed at the token exchange.

### The scope boundary

The tenant's discovery document settles which scope owns which claim:

```
$ curl -s ".../oauth2/token/.well-known/openid-configuration" | jq .scopes_supported
["address","phone","openid","profile","roles","groups","email"]
```

`email` is its own scope, not part of `profile`. This matters because it predicts that enabling
the `email` attribute for the application changes nothing while the client requests only
`openid profile`.

### The experiment

Requesting `openid profile` initially yielded `username` and `sub`, but no `email`,
`given_name` or `family_name`. Three candidate explanations existed, and changing all three at
once would not have distinguished them:

1. the attribute has no value on the user's profile
2. the application does not release the attribute
3. the owning scope was never requested

`given_name` isolates gates 1 and 2, because it belongs to `profile` — gate 3 is already
satisfied for it. So: a first name was set in My Account, `given_name` was enabled under the
application's User Attributes, and **scopes were left unchanged**.

Before:

```json
{
  "sub": "a8d1df04-3147-450f-9ebd-c3d1fccda043",
  "iss": "https://api.asgardeo.io/t/orgyvp9v/oauth2/token",
  "aud": "1f1Dw3GCvOIa0_HnHqQh4pfLJl8a",
  "sid": "c9ef3950-dd7a-442c-aab4-7006a809a50c",
  "username": "dinukashavinda20@gmail.com"
}
```

After:

```json
{
  "given_name": "Dinuka",
  ...
}
```

`given_name` appeared with no change to the requested scopes — which is the whole point:
**scope request and claim release are separate gates, configured in different places, and
neither implies the other.**

`email` and `family_name` stayed absent, each for a different reason: `email` still fails gate
3, and `family_name` was neither populated nor released. Three claims, three distinct
outcomes, one variable changed.

The diagnostic worth keeping: a missing claim looks identical whichever gate it failed, and the
three remedies are unrelated — populate the profile, change the application's attribute
release, or change the scopes in client code.
