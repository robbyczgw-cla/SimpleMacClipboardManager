# Electron Modernization

## Target

The application has moved from Electron 28 to Electron 43.3.0, the current
stable release line at the time of this change. Electron's support policy
covers the latest three stable major versions, so the project now has a
maintainable security baseline instead of shipping a 2023-era runtime.

The runtime and release toolchain are intentionally upgraded together:

- Electron `43.3.0`
- electron-builder `26.15.3`
- electron-store `11.0.2`
- DOMPurify `3.4.13`
- UUID `11.1.1`
- Node.js 24 in CI, matching the Node major embedded by Electron 43

React, Vite, Tailwind and the Electron Vite plugins remain on their existing
major versions. They are separate upgrade risks and will be reviewed only when
there is a compatibility or security reason to change them.

## Compatibility fixes

- `nativeImage.getBitmap()` was a deprecated legacy alias whose Electron 43
  type is `void`; image polling now uses `nativeImage.toBitmap()`.
- `window-all-closed` is not cancellable. The menu-bar agent now keeps an empty
  listener instead of attempting `preventDefault()` on a non-event callback.
- The existing `contextIsolation: true`, `nodeIntegration: false`, CSP and
  external-link allowlist remain in place.

## Dependency audit

The audit commands are available as:

```bash
npm run dependency:audit
npm run dependency:outdated
npm ls
```

The current non-development audit still reports `fast-uri` through the
`electron-store`/`conf` dependency chain. It is not application code and has no
known reachable path from the app's settings usage; it remains tracked as an
upstream dependency issue rather than being hidden with a blanket override.

The older DOMPurify, UUID and Electron-builder findings were addressed by the
targeted upgrades above. A future dependency PR can revisit the remaining
transitive finding when the upstream package range provides a compatible fix.

## Release script boundaries

- `npm run build` compiles renderer, main and preload bundles.
- `npm run package:mac:dir` creates an unsigned unpacked macOS app.
- `npm run package:mac:arm64` and `npm run package:mac:x64` create unsigned ZIPs.
- `npm run release:mac` is the future signed/notarized release entry point; it
  currently packages both architectures without signing credentials.
- `npm run verify` remains the fast local quality gate.

The CI workflow runs on `macos-latest` and exercises the application build plus
unsigned macOS packaging. Developer-ID signing, notarization, stapling and
real-device launch verification remain release work and are not implied by a
green Linux/container run.
