# DropForge

DropForge is a local-first macOS transformation workbench. Open a floating panel, paste content or drop files, run context-aware actions, and move the generated result back into your workflow.

> DropForge currently lives under `/dropforge` inside the SimpleMacClipboardManager repository as a temporary staging location. It is a separate app with its own package, bundle ID, data model, workspace storage, and future repository.

## Current capabilities

### Text, JSON, and URLs

- explicit clipboard import with no background monitoring
- text-file drag and drop
- automatic text, URL, and JSON detection
- Trim, whitespace normalization, upper/lower/title case, and slug generation
- JSON pretty print and minification
- offline URL tracking-parameter cleanup
- built-in Clean Text and Clean URL recipes

### Images

- multiple image import from Finder
- image import from the clipboard
- managed workspace copies; source files are never edited or moved
- generated previews kept separate from full-resolution inputs and outputs
- resize inside 1600 × 1600 without upscaling
- WebP conversion
- format-aware compression
- metadata stripping
- **Shop Image** action: resize, WebP quality 82, metadata removal, and slug filename
- deterministic collision names such as `product.webp`, `product-2.webp`
- output dimensions, format, file size, and size reduction
- Open, Reveal in Finder, and Copy Path output actions

### macOS shell

- secure Electron shell with `contextIsolation`, sandboxing, and no renderer Node access
- menu-bar behavior with hidden Dock icon
- `⌥⌘Space` global panel toggle
- frameless translucent panel
- typed preload bridge and validated IPC input
- dark and light appearance
- New Workspace, Show Folder, and Clear Temporary Files tray actions

## Workspace storage

DropForge stores temporary workspaces below Electron's macOS user-data directory:

```text
DropForge/
  workspaces/
    active-workspace.txt
    <workspace-id>/
      inputs/
      outputs/
      previews/
      workspace.json
```

Dropped source files are copied into `inputs/`. Every transformation creates a new file in `outputs/`; existing outputs are never overwritten. Preview JPEGs live in `previews/` and base64 preview data is never persisted in workspace metadata.

## Privacy and safety

- all processing is local
- no telemetry, analytics, backend, or account
- no network requests are required
- clipboard content is read only after an explicit paste command
- original files are never modified
- renderer code receives no filesystem, process, shell, or raw Electron APIs
- IPC requests are narrowly scoped and validated in the main process

## Development

```bash
cd dropforge
npm install
npm run dev
```

## Validation

```bash
npm run typecheck
npm test
npm run build:web
npm run build
```

`npm run build` also creates an unpacked Apple Silicon macOS application through electron-builder.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌥⌘Space` | Toggle DropForge |
| `⌘V` | Import clipboard when the editor is not focused |
| `⌘K` | Focus text input |
| `⌘N` | Create a new workspace |
| `Esc` | Hide panel |

## Architecture

- `src/main/main.ts`: Electron lifecycle, tray, hotkey, and validated IPC
- `src/main/workspace.ts`: filesystem sandbox, metadata persistence, previews, and Sharp pipelines
- `src/preload`: narrow typed context bridge
- `src/shared`: serializable types and pure action definitions
- `src/renderer`: React workbench interface
- `tests`: text action, filename, persistence, and real Sharp transformation tests

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for process boundaries and workspace invariants.

## Current limitations

- image actions currently use built-in parameters rather than an options inspector
- outputs can be opened or revealed, but native drag-out is not implemented yet
- workspaces do not yet have pins or configurable retention
- custom recipe editing is not implemented
- processing is single-item from the UI; multi-image batch execution is next

## Next slices

1. Shop Image batch execution with bounded concurrency
2. Native output drag-out into Finder and other apps
3. Image parameter inspector and reusable recipes
4. Retention settings, pins, and storage usage
5. Move DropForge into its own repository and release pipeline
