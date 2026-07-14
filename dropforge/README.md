# DropForge

DropForge is a local-first macOS transformation workbench. Open a floating panel, paste content or drop a file, run a context-aware action, and copy the result back into your workflow.

> This is the first isolated development slice. It lives under `/dropforge` inside the SimpleMacClipboardManager repository only as a temporary staging location. DropForge remains a separate app with its own package, bundle ID, data model, and future repository.

## Implemented in this bootstrap

- secure Electron shell with `contextIsolation`, sandboxing, and no renderer Node access
- macOS menu-bar app behavior
- `⌥⌘Space` global panel toggle
- frameless translucent panel
- typed preload bridge and validated IPC input
- local explicit clipboard import; no clipboard monitoring
- text-file drag and drop
- automatic detection of text, URL, and JSON
- action registry
- built-in linear recipe engine
- Trim, whitespace normalization, upper/lower/title case, and slug generation
- JSON pretty print and minification
- offline URL tracking-parameter cleanup
- copy transformed output
- dark and light appearance
- unit tests for the transformation core

## Privacy

- processing is local
- no telemetry or analytics
- no backend or account
- no network requests
- clipboard content is read only after an explicit paste command
- this slice never modifies source files

## Development

```bash
cd dropforge
npm install
npm run dev
```

The application runs as a menu-bar utility and opens its panel on startup.

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
| `⌘K` | Focus input |
| `Esc` | Hide panel |

## Architecture

- `src/main`: privileged Electron lifecycle and transformation IPC
- `src/preload`: narrow context bridge
- `src/shared`: serializable types, action registry, and pure transformation engine
- `src/renderer`: React interface
- `tests`: pure transformation and recipe tests

The renderer can request only specific, typed operations. It receives no filesystem, process, shell, or raw Electron APIs.

## Current limitations

The bootstrap intentionally handles text-like inputs first. Image processing, binary-file workspaces, output drag-out, persistent custom recipes, and settings arrive in later focused pull requests.

## Next slices

1. Workspace storage and generated-output model
2. Image intake plus Sharp resize/convert/metadata actions
3. Shop Image batch recipe and native file drag-out
4. Persistent custom recipe editor
5. Settings, retention, and storage cleanup
