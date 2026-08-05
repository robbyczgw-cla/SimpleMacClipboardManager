# Privacy

SimpleMacClipboardManager is a local-first macOS clipboard shelf.

- Clipboard text, links, colors, file paths, metadata and image thumbnails are
  stored in the app's local user-data directory.
- Full-size captured images are stored below the app-managed
  `userData/images` directory.
- Clipboard contents are not uploaded, used for analytics, or sent to a
  license service by the open-source build.
- Optional link favicons may request a small image from Google when enabled;
  the clipboard content itself is not sent as part of that request.
- Opening a link, exporting JSON, and importing a backup are explicit user
  actions.

## Capture controls

Capture can be paused for 5 minutes, 30 minutes, or indefinitely from the
panel or menu bar. Existing items remain available while paused. Pause is
in-memory and resets when the app restarts.

Ignored apps accept an exact macOS bundle identifier (preferred) or an exact
frontmost display name. Detection uses the cached frontmost-app identity and
is best-effort; the always-sensitive pasteboard markers remain blocked.

Recent retention can be set to Never, 1 day, 7 days, or 30 days. Saved items
are exempt from retention cleanup. “Clear Recent” removes unsaved Recent items
and managed image files associated with them.

## Backups and deletion

JSON exports include clipboard contents and may contain sensitive information.
They should be protected and deleted separately. The app removes managed image
files when their items are removed, but it does not claim secure erase:
APFS/SSD snapshots, caches and backups may retain old blocks.

See [the technical privacy model](docs/PRIVACY_MODEL.md) for storage paths,
network boundaries and future paid-build considerations.
