# Release Checklist

## Before tagging

- [ ] Merge the dependency, storage, Shelf and privacy PRs in order.
- [ ] Confirm the product name and bundle ID are intentional.
- [ ] Run `npm run verify` and `npm run dependency:audit`.
- [ ] Review `CHANGELOG.md` and release notes.
- [ ] Confirm no secrets or local paths are present in the diff.

## After the signed workflow

- [ ] Draft release contains arm64 and x64 DMG/ZIP artifacts.
- [ ] `SHA256SUMS.txt` matches downloaded files.
- [ ] `codesign`, `spctl` and `stapler validate` pass on a clean macOS user.
- [ ] First launch does not require a quarantine-removal workaround.
- [ ] Global hotkey and copy-only mode work without Accessibility.
- [ ] Direct Paste requests Accessibility only when enabled.
- [ ] Existing history, Saved items, Collections and images survive update.
- [ ] Manual smoke test is recorded before publishing the draft release.
