# Technical Privacy Model

## Data inventory

| Data | Location | Lifecycle |
| --- | --- | --- |
| Recent/Saved records and settings | `electron-store` under Electron `userData` | Retention, Clear Recent, Clear on quit, or explicit deletion |
| Full-size captured images | `<userData>/images/<item-id>.<ext>` | Removed when the owning item is removed, subject to filesystem backup behavior |
| Image thumbnails | Embedded in the local store record | Removed with the owning record |
| Optional favicon URL | Local record metadata | Created only when favicons are enabled; the favicon request is external |
| JSON export | User-selected path | Controlled by the user; treated as sensitive data |

## Capture boundary

The main process is authoritative for capture, retention and item deletion.
The renderer receives structured records through the preload bridge and never
receives direct Node.js or filesystem access. Capture actions use stable IDs;
the main process resolves the corresponding record before reading or writing
an image path.

Sensitive pasteboard markers are ignored independently of the password-manager
toggle. Password-manager detection additionally checks the configured types,
the cached frontmost app name, and the bundle identifier when available.

## Network boundary

The open-source build does not upload clipboard contents, run telemetry, or
require an account. Optional favicon loading can request a remote icon. Link
opening is an explicit user action and is delegated to the system browser.

Future paid distribution must document any purchase, entitlement, update, or
crash service separately. Such services must not receive clipboard contents.

## Deletion limits

The app removes records and managed image files it owns. It cannot guarantee
secure erase on APFS/SSD storage because filesystem snapshots, backups,
indexes, caches, and exported copies may retain data. Users should use their
normal macOS storage and backup controls for stronger removal requirements.
