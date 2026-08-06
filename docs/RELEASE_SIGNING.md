# macOS Release and Signing

## Intended flow

The repository keeps pull-request CI unsigned. The release workflow runs only
for a semantic version tag (`v*.*.*`) or an explicit manual dispatch and
builds separate arm64 and x64 DMG/ZIP artifacts. It uses the hardened runtime,
Developer ID signing, App Store Connect API-key notarization, SHA-256
checksums, and a draft GitHub Release for manual smoke testing.

The workflow does not exist as proof that a signed release has already passed.
The first real release remains blocked until the owner provides Apple
Developer credentials and a macOS smoke-test machine/account.

## Required GitHub Actions secrets

- `MACOS_CERTIFICATE_P12_BASE64` — base64 Developer ID Application `.p12`
- `MACOS_CERTIFICATE_PASSWORD` — password for that certificate
- `APPLE_API_KEY_P8_BASE64` — base64 App Store Connect API-key `.p8`
- `APPLE_API_KEY_ID` — App Store Connect key ID
- `APPLE_API_ISSUER` — App Store Connect issuer ID
- `APPLE_TEAM_ID` — Apple Developer team ID

Never commit certificates, `.p8` files, passwords or provisioning material.

## Local verification on a clean Mac

After the workflow creates the draft release, download the matching artifact
and verify the application before publishing it:

```bash
codesign --verify --deep --strict --verbose=2 "SimpleMacClipboardManager.app"
spctl --assess --type execute --verbose=4 "SimpleMacClipboardManager.app"
xcrun stapler validate "SimpleMacClipboardManager.app"
shasum -a 256 SimpleMacClipboardManager-*.dmg SimpleMacClipboardManager-*.zip
```

Test both architectures where possible, including first launch, global
hotkey, capture pause, Saved/Collections, image preview, direct paste with an
explicit Accessibility grant, export/import and update/rollback behavior.

Do not instruct users to clear quarantine with `xattr -cr`. A shippable paid
artifact must pass normal Gatekeeper handling after signing and notarization.

## Entitlements

The main process keeps only Electron's JIT/unsigned-executable-memory
requirements plus Apple Events for the explicit Direct Paste flow. Helper
processes use the inherited JIT entitlements only. `disable-library-validation`
is intentionally not enabled by default; add an entitlement only after a
reproducible signed-build failure and document the reason.
