# Asgardeo Integration — Technical Deep-Dive

The investigation trail behind the integration. For what was built, how to run it and the
conclusions, see [README.md](README.md); this file holds the evidence.

Three findings are recorded here:

1. A dependency conflict in `@asgardeo/react` that renders a React 18 app blank
2. An unrelated pre-existing crash in the app that produced the same symptom
3. How OIDC claim release was isolated from scope request

---

## 1. The SDK renderer conflict

### Symptom

A blank page. `index.html` served `200`, the dev server reported no transform errors, and the
production build succeeded.

### Finding the conflict

`npm install @asgardeo/react` emitted two `ERESOLVE overriding peer dependency` warnings.
Inspecting the tree:

```
$ npm ls react
aidf-4-front-end@0.0.0
+-- @asgardeo/react@0.25.13
| +-- @floating-ui/react@0.27.12
| | `-- react@18.3.1 deduped invalid: "^19.2.4" from node_modules/@asgardeo/react/node_modules/react-dom
| +-- react-dom@19.2.4
```

A second renderer had been installed beside the application's own. The SDK's manifest explains
why:

```json
"dependencies":     { "react-dom": "19.2.4", "@floating-ui/react": "0.27.12", ... }
"peerDependencies": { "react": ">=16.8.0", "@types/react": ">=16.8.0" }
```

`react-dom` is a **hard dependency pinned to an exact 19.x**, while `react` is a peer accepting
anything from 16.8 up. The two cannot be satisfied together on React 18: npm resolves `react`
to the host's 18.3.1 and nests its own `react-dom@19.2.4`. `react-dom` is a renderer for a
specific `react` and belongs in `peerDependencies`.

### Reproducing the crash in isolation

Loading the nested renderer directly, outside the browser:

```
$ node -e "require('./node_modules/@asgardeo/react/node_modules/react-dom/client')"
CRASH ON LOAD: Cannot read properties of undefined (reading 'S')
```

The cause, confirmed against the installed React:

```
$ node -e "const R=require('react'); console.log(Object.keys(R).filter(k=>k.includes('INTERNALS')))"
[ '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED' ]
```

React 19's `react-dom` reads
`React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`, which React 18.3.1
does not define. Dereferencing `.S` on `undefined` throws at module load.

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
override. Deleting `node_modules/@asgardeo` alone did not help — the install restored 19.2.4
from the lock each time. Regenerating `package-lock.json` resolved it:

```
$ npm ls react-dom
+-- @asgardeo/react@0.25.13 overridden
| +-- @floating-ui/react@0.27.12
| | `-- react-dom@18.3.1 deduped
| `-- react-dom@18.3.1 deduped
```

One renderer, no `invalid` markers.

Worth knowing generally: when an `overrides` entry appears to have no effect, check whether the
lockfile recorded it before assuming the override syntax is wrong.

### Fix

- `frontend/package.json` — `overrides` pinning the SDK to the app's `react-dom`
- `frontend/vite.config.js` — `resolve.dedupe: ["react", "react-dom"]`, so the bundler cannot
  emit two renderers even if the tree regresses

Both are removable once the SDK moves `react-dom` to `peerDependencies`, or on a React 19
upgrade.

---

## 2. The blank page was actually two bugs

Fixing the renderer conflict did not restore the page. Rather than guess again, the browser's
own console was captured:

```
$ chrome --headless=new --dump-dom --enable-logging=stderr http://localhost:4173/
[INFO:CONSOLE] "Uncaught Error: Minified React error #31;
  args[]=object%20with%20keys%20%7Bstatus%2C%20error%7D"
```

React error #31 is *objects are not valid as a React child* — and the object had keys
`{status, error}`, the shape of an RTK Query failure.

`frontend/src/components/HotelListings.jsx` rendered the error object directly:

```jsx
<p className="text-red-500">{error}</p>
```

`error` is an RTK Query error object, not a string. The trigger was the backend being down:
the hotels request failed, the error branch rendered, React threw, and because an uncaught
throw during render unmounts the whole tree, the entire application went blank rather than just
the hotel list.

This bug pre-dates the Asgardeo work; the integration merely gave a reason to load the page
with the backend stopped. Fixed by reading the message off the object with a fallback.

The lesson is about method rather than React: two independent faults produced an identical
symptom, and the first fix was verified only by assumption. Reading the actual error, instead
of re-reasoning from the symptom, separated them.

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
