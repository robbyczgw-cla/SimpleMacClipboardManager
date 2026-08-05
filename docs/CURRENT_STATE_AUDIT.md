# Current State Audit

Date: 2026-08-05
Repository: `robbyczgw-cla/SimpleMacClipboardManager`
Audited baseline: `main` at `3cbf86d` (`v0.13.2`)

## Executive summary

The repository is a working macOS-only Electron/React/TypeScript clipboard manager with a strong renderer security baseline and a useful visual panel. The commercial direction is technically viable without a rewrite, but the current `main` branch is not yet a release baseline: tests and CI are only present in the stacked draft PRs #9–#11, storage has no explicit schema version, and distribution is neither Developer-ID signed nor notarized.

The implementation branch for this audit is based on the complete logical stack from PR #11. It is intentionally separate from `main` and will become the Phase 0/1 consolidation PR.

## Repository and Git state

- Default branch: `main`
- Visibility: public
- License: MIT
- Baseline tag: `v0.13.2`
- Baseline commit: `3cbf86d`
- Local rollback reference created before implementation: `archive/pre-commercial-baseline-2026-08-05`
- DropForge branches and PRs #12/#13 are separate staging work and remain out of scope.

### Stacked PR audit

| PR | Head | Base | State | Scope | CI evidence |
|---|---|---|---|---|---|
| #9 | `4865e0c` | `main` | Open, draft | Clipboard correctness, image fingerprint, history helper, five unit tests | No workflow on the branch because CI was added by #10 |
| #10 | `015024d` | PR #9 branch | Open, draft | PR CI quality gate and build-script/test wiring | GitHub Actions run `29119946305`: success |
| #11 | `c68b455` | PR #10 branch | Open, draft | Accessibility wording, architecture-labelled release command, README/changelog | GitHub Actions run `29120041786`: success |

The ancestry is intact: #10 contains #9, and #11 contains #10. The stack must not be squash-merged from the bottom while the upper branches still depend on the original commits. This implementation uses a fresh consolidation branch so the logical changes and their tests can be reviewed together without altering the old draft PRs.

## Baseline verification

Commands were run from a clean checkout of `main`:

| Check | Result | Notes |
|---|---|---|
| `node --version` | `v24.14.0` | Container runtime; project CI uses Node 20 in the stacked workflow |
| `npm --version` | `11.9.0` | npm emitted a non-blocking unknown `http-proxy` config warning |
| `npm ci` | Passed after environment adjustment | npm cache and Electron download cache were redirected to writable temporary paths |
| `npm run typecheck` | Passed | Renderer and Node/Electron TypeScript projects both passed |
| `npm test` | Failed as expected | `main` has no `test` script or test suite |
| `npm run build` | Partial | Renderer and Electron bundles passed; electron-builder packaging could not complete in the Linux container. Linux packaging also hit restricted ownership extraction for the snap template. No macOS package claim is made. |

The successful Vite output is not treated as a packaged-app success. A real macOS launch, clipboard capture, accessibility flow, and architecture build still require a macOS host.

## Architecture map

### Main process

`electron/main.ts` currently owns most system responsibilities:

- Electron app lifecycle, tray, menu, panel and settings window
- global hotkey and panel positioning
- clipboard polling and password-manager/pasteboard exclusions
- text, link, color, file and image classification
- image persistence under `app.getPath('userData')/images`
- history ordering, duplicate suppression, pinning and retention by count
- debounced `electron-store` writes and quit-time flush
- paste/copy operations and optional AppleScript direct paste
- import/export validation
- external URL opening and favicon URL construction
- production CSP and navigation/window-open guards

The file is serviceable for the baseline, but its size makes isolated testing and future Shelf/Collections work harder. Refactoring is deliberately deferred until behavior is covered.

### Renderer

The renderer is React with a virtualized clipboard panel, settings page, preview modal, fuzzy search, five-language translations, type filters and keyboard/mouse flows. The renderer receives clipboard objects through the preload bridge and does not directly access Node or Electron APIs.

### IPC and security boundary

The current BrowserWindows use:

- `contextIsolation: true`
- `nodeIntegration: false`
- a narrow `contextBridge` API
- production CSP
- top-level navigation blocking
- external protocol allowlisting for `http:`, `https:` and `mailto:`

The main remaining boundary issue is payload authority: several handlers accept complete renderer-supplied `ClipboardItem` objects instead of accepting an ID and resolving the authoritative item in the main process. This is tracked for the storage/IPC phase, while the Phase 1 branch limits image deletion to managed files.

### Data model and storage

Current store shape:

```text
electron-store
├── history: ClipboardItem[]
└── settings: Settings
```

Clipboard items contain text or a file URL, metadata, optional thumbnail, timestamps, search text and an optional `pinned` flag. Full-size images are stored outside the JSON store in the user-data `images/` directory; small thumbnails remain in the store.

There is no `schemaVersion`, migration registry, Saved/Shelf model, Collection model, or rename migration. Those are intentionally Phase 3 work. Existing `pinned` semantics are preserved in Phase 1 so the later `Saved` migration can be explicit and reversible.

### Clipboard and image lifecycle

The poller checks text before the more expensive image read. Image change detection uses a SHA-256 digest of the bitmap plus dimensions in the consolidated branch. New managed image files are written before the item enters history. Removed managed image paths are cleaned up when history changes; external paths are never eligible for deletion.

### Network and external effects

The app does not upload clipboard contents and has no account, sync, telemetry, license service or updater in the audited baseline. Optional or user-triggered network effects are:

- Google favicon requests when link favicons are enabled
- opening user-selected `http:`, `https:` or `mailto:` links externally
- GitHub URLs in the About dialog
- future release/update or commerce endpoints, not present yet

Therefore, future marketing must say that clipboard contents are processed and stored locally and are never uploaded by the app. It must not claim that every app action is completely offline while favicons or future update checks are enabled.

### Packaging and release

`electron-builder` targets macOS and currently uses `identity: null`, so the baseline is not Developer-ID signed or notarized. The Phase 1 scripts make application compilation and packaging distinct and keep architecture-labelled ZIP commands available. Signing, notarization, stapling, checksums and update feeds remain Phase 7 work.

## Top five risks

1. **Data durability semantics are not yet commercial-grade.** History is debounced into an unversioned store, and `pinned` is not yet a separate durability concept. Address with a versioned repository and migration before Shelf/Collections.
2. **The existing correctness/CI work is only in a stacked draft-PR chain.** It is not present on `main`, and the lower PR must not be blindly squashed. Address with this consolidation branch and an explicit review/merge plan.
3. **Distribution is not release-ready.** Current builds are ad-hoc/unsigned and non-notarized. No paid launch should happen before Developer-ID, notarization and Gatekeeper verification.
4. **Main-process authority is too broad.** Full item objects and image paths cross IPC. Address with ID-based handlers, schema validation and managed-directory checks in the migration/IPC phase.
5. **Runtime and release baselines are incomplete.** Electron 28 is the current dependency, there is no macOS manual matrix in-repo, and the container cannot prove a macOS launch. Address with a supported Electron upgrade after the baseline is green and with a real Apple Silicon smoke test.

## First three implementation PRs

1. **Phase 0/1 baseline consolidation** — the logical changes from #9–#11, audit documents, expanded correctness tests, managed-image cleanup, clear build/package scripts and corrected release wording.
2. **Versioned storage and migration boundary** — schema version, repository abstraction, pin-to-Saved migration design, backups, import/export invariants and ID-based IPC.
3. **Shelf and Collections MVP** — Recent/Saved semantics, default Shelf, custom Collections, keyboard actions, search fields and restart/clear/import/export coverage.

## Immediate continuation

Phase 1 starts on the consolidation branch immediately after this audit. Its exit criteria are a green typecheck/test/build gate, preserved clipboard correctness, no external image deletion, accurate accessibility/release documentation, and clearly named unsigned baseline artifacts. It does not attempt the commercial feature pivot before the storage boundary is ready.
