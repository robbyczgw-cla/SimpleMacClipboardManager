# Risk Register

Date: 2026-08-05
Scope: commercializing `SimpleMacClipboardManager` without a rewrite

| ID | Risk | Impact | Likelihood | Mitigation / next action | Status |
|---|---|---:|---:|---|---|
| R-001 | History writes and item semantics are not schema-versioned | High | Medium | Add repository boundary, schema version and tested migrations before Shelf work | Open |
| R-002 | A history limit or duplicate update can remove metadata or a pinned item | High | Medium | Keep identity/pin metadata in the pure capture helper; add regression tests in Phase 1 | In progress |
| R-003 | An imported or stale external image path could be deleted during cleanup | High | Medium | Only delete paths contained in managed `userData/images`; test managed and external paths | In progress |
| R-004 | PRs #9–#11 are stacked draft branches and can be merged in the wrong order | High | Medium | Use a consolidation branch; leave old PRs open until replacement is accepted | In progress |
| R-005 | `main` has no test script and no CI workflow | High | High | Consolidate Vitest and minimal-permission CI before feature work | In progress |
| R-006 | Electron 28 and current build dependencies need a supported-release review | High | Medium | Upgrade only after Phase 1 baseline and document official compatibility changes | Open |
| R-007 | Current artifacts are ad-hoc/unsigned and not notarized | High | Certain | Keep commercial launch blocked until Developer-ID, notarization, staple and Gatekeeper checks pass | Open |
| R-008 | Container builds cannot prove a real macOS app launch | Medium | Certain | Run manual Apple Silicon and Intel smoke tests on real Macs before release | Open |
| R-009 | Renderer-supplied full item objects are trusted by paste/copy IPC handlers | High | Medium | Move to ID-based main-process lookup and payload validation in the migration/IPC phase | Open |
| R-010 | Optional favicon requests make an unconditional “100% offline” claim inaccurate | Medium | Medium | Document optional network effects and use the local-processing claim instead | Open |
| R-011 | Rename can split `electron-store`, image files and login/accessibility state | High | Medium | Define backup, copy, validation and rollback before changing product metadata | Open |
| R-012 | Payment, licensing and update services can introduce privacy or lockout risk | High | Medium | Direct-sale/supporter model first; no clipboard telemetry or aggressive DRM in v1 | Open |

## Risk acceptance rules

- No secrets, certificates or Apple credentials enter the repository.
- No force-push, history rewrite or destructive reset is required for the consolidation.
- No risk is marked mitigated merely because TypeScript compiles.
- “Local-first” means clipboard content is stored locally; it does not mean optional favicons, updates or commerce endpoints do not exist.
- A paid launch remains blocked by any unresolved High risk in durability, signing/notarization, data migration or security boundaries.
