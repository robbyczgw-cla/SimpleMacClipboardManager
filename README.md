# MacClipManager

A free, local-only clipboard manager for macOS inspired by [Paste](https://pasteapp.io/). Built with Electron + React.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

## Features

- **Instant Access** - Press `⌘⇧V` to open clipboard history
- **Visual Previews** - See text, links, colors, and file paths at a glance
- **Smart Detection** - Automatically categorizes content (text, URLs, colors, files)
- **Fast Search** - Type to filter through your clipboard history
- **Keyboard First** - Navigate with arrow keys, paste with Enter
- **Local Only** - All data stays on your Mac, no cloud sync
- **Lightweight** - Minimal resource usage, runs in menu bar

## Screenshots

<!-- Add screenshots here -->

## Installation

### From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/robbyczgw-cla/MacClipManager.git
cd MacClipManager

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production (creates app in /release folder)
npm run build
```

> **Note**: The built app is unsigned. On first launch, right-click the app and select "Open", or go to System Preferences → Security & Privacy to allow it.

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧V` | Toggle clipboard panel |
| `←` `→` | Navigate between items |
| `Enter` | Paste selected item |
| `Esc` | Close panel |
| `⌘,` | Open settings |
| `⌘⌫` | Delete selected item |
| Type | Search clipboard history |

### Menu Bar

Click the clipboard icon in the menu bar to:
- Show clipboard panel
- Open settings
- Clear history
- Quit the app

## Settings

Access settings via menu bar or `⌘,`:

- **History Limit** - Maximum items to store (100-2000)
- **Polling Interval** - How often to check clipboard (250-1000ms)
- **Launch at Login** - Start MacClipManager when you log in
- **Clear on Quit** - Erase history when closing the app
- **Show in Dock** - Display dock icon (hidden by default)

## Tech Stack

- **Framework**: Electron 28+
- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Storage**: electron-store

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

## Project Structure

```
├── electron/
│   ├── main.ts       # Main process, tray, hotkeys
│   └── preload.ts    # IPC bridge (CommonJS)
├── src/
│   ├── App.tsx       # Main React component
│   ├── components/
│   │   ├── ClipboardPanel.tsx
│   │   ├── ClipboardCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── SettingsModal.tsx
│   └── types.ts
├── assets/
│   └── trayTemplate.png
└── package.json
```

## Privacy

MacClipManager is completely local:
- No data is sent to any server
- No analytics or telemetry
- All clipboard data is stored locally in `~/Library/Application Support/pastealt`

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by [Paste](https://pasteapp.io/) and [Maccy](https://github.com/p0deje/Maccy).

---

Made with ❤️ for the macOS community
