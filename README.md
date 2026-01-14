<p align="center">
  <img src="assets/logo.jpg" width="128" height="128" alt="SimpleMacClipboardManager Logo">
</p>

# SimpleMacClipboardManager

A free, lightweight clipboard manager for macOS. Keep your clipboard history organized and accessible.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

## Features

- **Instant Access** - Press `⌥Space` to open clipboard history
- **Image Support** - Capture and preview screenshots and images
- **Visual Previews** - See text, links, colors, images, and file paths at a glance
- **Quick Look Preview** - Press `Space` to preview any item in detail
- **Smart Detection** - Automatically categorizes content types
- **Fast Search** - Type to filter through your clipboard history
- **Filter by Type** - Quick filter buttons for text, links, colors, files, images
- **Pin Favorites** - Star important items to keep them at the top
- **Quick Paste** - `⌘1-9` to instantly paste items by position
- **Paste as Plain Text** - `⇧Enter` to paste without formatting
- **Source App Tracking** - See which app content was copied from
- **Keyboard First** - Navigate with arrow keys, paste with Enter
- **Flexible Panel Position** - Choose where the panel appears (top, bottom, left, right)
- **Dark/Light Mode** - Automatically adapts to your system theme
- **Live Settings** - Most settings apply instantly without restart
- **Local Only** - All data stays on your Mac, no cloud sync
- **Privacy Focused** - Ignores password managers automatically
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
| `⌥Space` | Toggle clipboard panel |
| `←` `→` or `↑` `↓` | Navigate between items |
| `Enter` | Paste selected item |
| `⇧Enter` | Paste as plain text |
| `Space` | Quick Look preview |
| `⌘1-9` | Quick paste items 1-9 |
| `Esc` | Close panel / preview |
| `⌘⌫` | Delete selected item |
| Right-click | Paste item |
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

### Appearance
- **Panel position** - Where the clipboard panel appears (bottom, top, left, right)

### Keyboard
- **Global hotkey** - Customize the keyboard shortcut

### Privacy
- **Ignore password managers** - Don't capture from 1Password, Bitwarden, etc.

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

## Acknowledgments

This project was inspired by:
- [Maccy](https://github.com/p0deje/Maccy) - A lightweight open-source clipboard manager for macOS

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the macOS community
