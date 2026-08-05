# Commercialization Roadmap

## Product direction

The product remains Electron + React + TypeScript and becomes a visual, local-first Clipboard Shelf for macOS:

- Recent: automatically captured, retention-bound history
- Saved/Shelf: deliberately retained items
- Collections: named groups for projects and reusable content
- no account, cloud sync or subscription in v1
- direct distribution first, with signed and notarized official builds

Working name: `ClipShelf`. It remains a placeholder until the naming sanity check.

## Delivery sequence

| Phase | Goal | Main deliverables | Gate |
|---|---|---|---|
| 0 | Understand and protect the baseline | Audit, risk register, product ADR, rollback reference, PR-stack decision | Repository and baseline are evidenced |
| 1 | Make the technical baseline trustworthy | Correctness tests, CI, separated build/package scripts, accurate accessibility/release docs, unsigned baseline smoke-test plan | Typecheck, tests and application build green |
| 2 | Modernize runtime safely | Supported Electron review/upgrade, dependency audit, build scripts and performance baseline | No unexplained runtime/performance regression |
| 3 | Establish durable domain/storage boundaries | Versioned schema, repository, migrations, backup/rollback, ID-based IPC | Existing history and pins survive migration |
| 4 | Ship the differentiating Shelf | Saved/Shelf, Collections, keyboard UX, search and bulk actions | Restart, clear recent and import/export preserve data |
| 5 | Add privacy controls | Pause capture, app exclusions, time retention, privacy docs | No misleading privacy claim or external-file deletion |
| 6 | Make the product legible | Naming check, central metadata, onboarding, settings IA, icon and screenshots | Product UX and rename migration are validated |
| 7 | Make distribution professional | Developer-ID, hardened runtime, notarization, staple, architecture artifacts, checksums and update strategy | Gatekeeper passes without quarantine workaround |
| 8 | Validate payment simply | Merchant-of-record comparison, one-time price, delivery/refund/support plan | Checkout and delivery work without clipboard telemetry |
| 9 | Launch | Landing page, demo, FAQ, legal links, release checklist and clean-install/upgrade tests | All v1 Definition-of-Done items pass |

## Current work

The current branch is the Phase 0/1 consolidation of the three existing draft PRs. It deliberately does not add Collections, cloud features, AI, licensing infrastructure or a Swift rewrite. Those choices reduce launch risk and preserve the existing MIT code history.

## Commercial assumptions to validate

- Founder price: €9.99 one-time
- Regular price after validation: €17.99 one-time
- Up to three personal Macs
- Buyers pay for signed official builds, convenient installation, releases, updates and support
- No subscription until a real recurring service exists

These are product hypotheses, not legal, tax or trademark conclusions. A merchant of record and a naming/trademark sanity check are required before launch.

## Explicitly deferred

- Swift/AppKit rewrite
- iOS or web client
- cloud clipboard and team collaboration
- generative AI or cloud OCR
- complex DRM or mandatory online activation
- Paste Queue, local OCR, Rules and Library Window until post-launch phases
