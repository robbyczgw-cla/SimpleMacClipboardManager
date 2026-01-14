# SimpleMacClipboardManager

A free, lightweight clipboard manager for macOS. Keep your clipboard history organized and accessible.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

## Features

- **Instant Access** - Press `⌘⇧V` to open clipboard history
- **Visual Previews** - See text, links, colors, and file paths at a glance
- **Smart Detection** - Automatically categorizes content types
- **Fast Search** - Type to filter through your clipboard history
- **Keyboard First** - Navigate with arrow keys, paste with Enter
- **Local Only** - All data stays on your Mac, no cloud sync
- **Lightweight** - Minimal resource usage, runs in menu bar

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/robbyczgw-cla/SimpleMacClipboardManager.git
cd SimpleMacClipboardManager

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
| `⌘⌫` | Delete selected item |
| Type | Search clipboard history |

### Menu Bar

Click the clipboard icon in the menu bar to:
- Show clipboard panel
- Open settings
- Clear history
- Quit the app

## Settings

Access settings via menu bar → Settings:

### History
- **Maximum items** - How many items to store (100-2000)
- **Clear on quit** - Erase history when closing the app
- **Ignore duplicate entries** - Don't save consecutive duplicates

### Behavior
- **Polling interval** - How often to check clipboard (250-1000ms)
- **Launch at login** - Start automatically when you log in
- **Show in Dock** - Display app icon in the Dock
- **Play sound on copy** - Audio feedback when clipboard changes

### Privacy
- **Ignore password managers** - Don't capture from 1Password, Bitwarden, etc.
- **Auto-clear sensitive data** - Remove passwords after a timeout

## Privacy

SimpleMacClipboardManager is completely local:
- No data is sent to any server
- No analytics or telemetry
- All clipboard data is stored locally

## Tech Stack

- **Framework**: Electron 28+
- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Storage**: electron-store

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the macOS community
