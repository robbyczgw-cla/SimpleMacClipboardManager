# Architecture

This document describes the architecture of SimpleMacClipboardManager.

## Overview

SimpleMacClipboardManager is built with Electron, using a main process for system interactions and a renderer process for the React-based UI.

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Main Process                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Clipboard  │  │   Global    │  │    Tray / Menu      │  │
│  │   Monitor   │  │   Hotkey    │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    ┌─────┴─────┐                            │
│                    │   IPC     │                            │
│                    │  Bridge   │                            │
│                    └─────┬─────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    ┌─────┴─────┐                            │
│                    │  Preload  │                            │
│                    │  Script   │                            │
│                    └─────┬─────┘                            │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         │                │                │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐         │
│  │    App      │  │  Clipboard  │  │  Settings   │         │
│  │  Component  │  │    Panel    │  │    Page     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│                     Renderer Process (React)                 │
└──────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
pastealt/
├── electron/                 # Electron main process
│   ├── main.ts              # Main process entry point
│   └── preload.ts           # Preload script for IPC bridge
├── src/                     # React frontend
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component with routing
│   ├── types.ts             # TypeScript type definitions
│   ├── components/          # React components
│   │   ├── ClipboardPanel.tsx   # Main clipboard panel UI
│   │   ├── ClipboardCard.tsx    # Individual clipboard item card
│   │   ├── SearchBar.tsx        # Search input with filters
│   │   ├── PreviewModal.tsx     # Quick Look style preview
│   │   └── SettingsPage.tsx     # Settings configuration
│   └── styles/
│       └── globals.css      # Global styles with Tailwind
├── assets/                  # Static assets
│   ├── logo.jpg             # App logo
│   └── trayTemplate.png     # Menu bar icon
├── build/                   # Build configuration
│   └── entitlements.mac.plist  # macOS entitlements
└── dist/                    # Build output
```

## Main Process (electron/main.ts)

The main process handles:

### Clipboard Monitoring
- Polls clipboard every 500ms (configurable)
- Detects content type (text, image, link, file, color)
- Creates thumbnails for images
- Detects source application using AppleScript
- Ignores password managers when enabled

### Window Management
- Creates frameless, transparent window with native vibrancy
- Positions window based on panel position setting
- Handles show/hide with animations

### Global Hotkey
- Registers global keyboard shortcut (default: Option+Space)
- Re-registers when settings change

### IPC Handlers
- `get-history` - Returns clipboard history
- `paste-item` - Pastes item and hides window
- `paste-plain` - Pastes as plain text
- `delete-item` - Removes item from history
- `toggle-pin` - Pins/unpins item
- `get-settings` / `save-settings` - Settings management
- `hide-window` - Hides the panel

### Storage
Uses `electron-store` for persistent storage of:
- Clipboard history (up to 2000 items)
- User settings

## Preload Script (electron/preload.ts)

Provides secure bridge between main and renderer processes:
- Exposes `window.electronAPI` with typed methods
- Uses `contextBridge` for security
- Handles IPC communication

## Renderer Process (React)

### App.tsx
- Main component with state management
- Keyboard event handling
- Hash-based routing for settings page
- Loads panel position from settings

### ClipboardPanel.tsx
- Horizontal or vertical layout based on position
- Scroll container with smooth scrolling
- Search bar with type filters
- Footer with keyboard hints

### ClipboardCard.tsx
- Visual preview of clipboard item
- Type-specific rendering (text, image, link, color, file)
- Pin button and delete button
- Context menu for copy

### SearchBar.tsx
- Auto-focus when panel opens
- Real-time search filtering
- Type filter buttons
- Adapts to vertical/horizontal layout

### PreviewModal.tsx
- Quick Look style full preview
- Opens with Space key
- Backdrop blur effect

### SettingsPage.tsx
- Grouped settings sections
- Live updates (most settings apply immediately)
- Separate window via hash routing

## Data Model

```typescript
interface ClipboardItem {
  id: string                    // UUID
  type: 'text' | 'image' | 'link' | 'file' | 'color'
  content: string               // Text content or base64 for images
  thumbnail?: string            // Base64 thumbnail for images
  metadata: {
    url?: string                // For links
    colorHex?: string           // For colors
    sourceApp?: string          // App that copied content
  }
  createdAt: number             // Timestamp
  searchText: string            // Lowercase for search
  pinned?: boolean              // Pinned items stay at top
}

interface Settings {
  historyLimit: number          // Max items (100-2000)
  pollingInterval: number       // Clipboard check interval
  launchAtLogin: boolean
  clearOnQuit: boolean
  showInDock: boolean
  hotkey: string                // Global hotkey
  playSoundOnCopy: boolean
  ignoreDuplicates: boolean
  ignorePasswordManagers: boolean
  panelPosition: 'bottom' | 'top' | 'left' | 'right'
}
```

## Styling

- **Tailwind CSS** for utility classes
- **CSS Variables** for theming (dark/light mode)
- **Native Vibrancy** for macOS blur effect
- **CSS Animations** for smooth transitions

## Build System

- **Vite** for fast development and building
- **electron-builder** for packaging
- **TypeScript** throughout
- Outputs to `release/` directory

## Security

- Context isolation enabled
- Node integration disabled in renderer
- Preload script for safe IPC
- No remote content loading
- All data stored locally
