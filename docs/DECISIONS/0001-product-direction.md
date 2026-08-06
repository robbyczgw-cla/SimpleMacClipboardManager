# ADR 0001: Product direction for commercial v1

- Status: Accepted
- Date: 2026-08-05
- Scope: `SimpleMacClipboardManager`

## Decision

Continue the existing Electron + React + TypeScript application and reposition it as a visual, local-first Clipboard Shelf for macOS. The first commercial experiment uses direct distribution and a one-time purchase/supporter model. The working name `ClipShelf` remains configurable and provisional until a naming sanity check.

## Consequences

### Keep

- Keyboard-first Quick Panel and menu-bar agent behavior
- Local `electron-store` storage and existing text/link/color/file/image flows
- Quick Look, fuzzy search, source-app metadata, copy/paste and export/import
- MIT/public source history

### Add in controlled phases

- A tested baseline and CI
- Versioned storage and migrations
- Recent/Saved/Shelf semantics and Collections
- Pause capture, app exclusions and retention controls
- Signed/notarized direct distribution and a simple update path

### Do not build for v1

- Swift/AppKit rewrite
- iOS or web client
- cloud sync, accounts or team clipboard
- generative AI or cloud processing of clipboard contents
- mandatory online activation or complex DRM
- new DropForge functionality in this repository

## Rationale

The differentiator is not another undifferentiated clipboard history list. Visual previews, durable saved content and collections are a coherent product extension of the current codebase. A rewrite or cloud service would add technical and privacy risk before demand is validated.

Direct distribution is preferable for v1 because the current app uses Electron, direct paste and Accessibility permission. Signing and notarization are still required before asking users to pay; the initial model should sell convenience, updates and support rather than pretend that public MIT source can be protected by DRM.

## Revisit triggers

Revisit this decision only if:

- measured performance or platform limitations make Electron unacceptable,
- customer evidence supports cloud/team workflows,
- legal review requires a different distribution model, or
- a supported macOS release breaks a core dependency with no reasonable migration path.
