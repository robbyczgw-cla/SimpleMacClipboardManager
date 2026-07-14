# DropForge Architecture

## Process boundaries

DropForge uses Electron's standard three-process boundary:

- **Main process** owns the filesystem, clipboard, Finder integration, global shortcut, tray, and image processing.
- **Preload** exposes only explicit typed functions through `contextBridge`.
- **Renderer** is a sandboxed React UI with no Node.js integration.

All renderer requests that contain user-controlled strings, identifiers, options, or paths are validated in the main process before execution.

## Workspace invariants

`WorkspaceService` owns one active workspace at a time.

- Each workspace has a random UUID directory.
- Imported images are copied into `inputs/` before processing.
- Transformations read only managed input copies.
- Outputs are always new files in `outputs/`.
- Name collisions receive deterministic numeric suffixes.
- Preview images are generated in `previews/`.
- `workspace.json` stores relative paths only.
- Every relative path is resolved against the active workspace and checked against directory traversal.
- Metadata writes use a temporary file followed by rename.

The active workspace ID is stored separately in `active-workspace.txt`. If it is missing or unreadable, DropForge creates a fresh workspace instead of crashing.

## Image transformation lifecycle

1. Renderer obtains Finder paths through Electron's preload-only `webUtils.getPathForFile`.
2. Main validates the IPC payload and absolute paths.
3. `WorkspaceService` checks file type and the 100 MB input limit.
4. Sharp validates image metadata.
5. The source is copied into the managed workspace.
6. A bounded preview is generated.
7. An image action creates a new output file.
8. Output metadata and preview are generated.
9. Workspace metadata is atomically persisted.
10. Renderer receives a hydrated snapshot containing small preview data URLs, never full images.

## Adding an image action

1. Add the identifier to `ImageActionId` in `src/shared/types.ts`.
2. Add UI metadata in `src/shared/image-actions.ts`.
3. Add the identifier to the validated IPC enum in `src/main/main.ts`.
4. Define output naming and format behavior in `WorkspaceService`.
5. Add the Sharp pipeline behavior in `processImage`.
6. Add a real image fixture test that checks output metadata and source immutability.

## Native dependencies

Sharp remains external to the Vite main-process bundle. electron-builder unpacks `sharp` and its `@img` native packages from ASAR so the platform binary can load at runtime.
