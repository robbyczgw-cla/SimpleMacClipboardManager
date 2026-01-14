<p align="center">
  <img src="assets/logo.jpg" width="128" height="128" alt="SimpleMacClipboardManager Logo">
</p>

# SimpleMacClipboardManager

A free, lightweight clipboard manager for macOS. Keep your clipboard history organized and accessible.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

<p align="center">
  <img src="assets/screenshot.png" alt="SimpleMacClipboardManager Screenshot" width="800">
</p>

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
- **Multi-Language** - Available in English, Spanish, French, German, and Chinese
- **Dark/Light Mode** - Automatically adapts to your system theme
- **Live Settings** - Most settings apply instantly without restart
- **Local Only** - All data stays on your Mac, no cloud sync
- **Privacy Focused** - Ignores password managers automatically
- **Lightweight** - Minimal resource usage, runs in menu bar
- **Liquid Glass Design** - Modern macOS-inspired translucent UI with blur effects
- **Drag & Drop** - Drag items directly into other apps
- **Merge Paste** - Multi-select with Shift+click, then ⌘M to paste all together
- **Markdown Preview** - Text with markdown renders beautifully in preview
- **Text Transformations** - Copy as uppercase, lowercase, title case, or trimmed
- **URL Favicons** - Links show website icons for quick identification
- **Export/Import** - Backup and restore history as JSON

## Installation

### Download (Recommended)

1. Download the latest `.zip` from [GitHub Releases](../../releases)
2. Unzip and drag `SimpleMacClipboardManager.app` to `/Applications`
3. **First launch** (required for unsigned apps):
   - Right-click the app → **Open** → **Open**
   - Or run in Terminal: `xattr -cr /Applications/SimpleMacClipboardManager.app`
4. Grant **Accessibility** permission when prompted (required for global hotkey)

> **Note**: This app is self-signed (not notarized with Apple). macOS will warn you on first launch - this is normal for open-source apps distributed outside the App Store.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/pastealt.git
cd pastealt

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production (creates app in /release folder)
npm run build

# Build release with self-signing and zip
npm run release
```

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌥Space` | Toggle clipboard panel |
| `←` `→` or `↑` `↓` | Navigate between items |
| `Enter` | Copy to clipboard (or auto-paste if enabled) |
| `⌘C` | Copy to clipboard only |
| `⇧Enter` | Paste directly as plain text |
| `Space` | Quick Look preview |
| `⌘1-9` | Quick paste items 1-9 |
| `⌘A` | Add current item to multi-selection |
| `⌘M` | Merge paste all selected items |
| `O` | Open selected URL in browser |
| `Esc` | Close panel / preview |
| `⌘⌫` | Delete selected item |
| Type | Search clipboard history |

### Mouse Actions

| Action | Result |
|--------|--------|
| Click | Select item |
| Shift+Click | Multi-select items |
| Double-click | Copy to clipboard (or auto-paste if enabled) |
| Right-click | Copy to clipboard (or auto-paste if enabled) |
| Drag | Drag item into other apps |
| Click star icon | Pin/unpin item |
| Click × icon | Delete item |

### Menu Bar

Click the clipboard icon in the menu bar to:
- Show clipboard panel
- Open settings
- View "How to Use" guide
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
- **Paste directly** - When enabled, auto-paste into previous app (default: off, copy only)

### Appearance
- **Panel position** - Where the clipboard panel appears (bottom, top, left, right)
- **Language** - Interface language (English, Spanish, French, German, Chinese)

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

## Comparison with Maccy

SimpleMacClipboardManager was inspired by [Maccy](https://github.com/p0deje/Maccy). Here's how they compare:

| Feature | SimpleMacClipboardManager | Maccy |
|---------|---------------------------|-------|
| **Price** | Free | Free |
| **UI Style** | Liquid glass panel (Paste-like) | Native dropdown menu |
| **Image Preview** | Thumbnails + Quick Look | Small thumbnails |
| **Visual Previews** | Large cards with type badges | Text-based list |
| **Panel Position** | Bottom, Top, Left, Right | Near menu bar |
| **Multi-Language** | 5 languages | 20+ languages |
| **Search** | Inline search bar | Inline search |
| **Pin/Favorite** | Yes | No |
| **Source App Tracking** | Yes | Yes |
| **Quick Paste (⌘1-9)** | Yes | No |
| **Paste as Plain Text** | Yes | Yes |
| **Password Manager Ignore** | Yes | Yes |
| **Dark/Light Mode** | Auto (system) | Auto (system) |
| **Memory Usage** | ~100-150MB (Electron) | ~15-30MB (native) |
| **Native Feel** | Good (vibrancy blur) | Excellent (AppKit) |
| **Customization** | Panel position, hotkey | Extensive |
| **Open Source** | Yes (MIT) | Yes (MIT) |

### When to choose SimpleMacClipboardManager
- You prefer a visual, card-based interface like the Paste app
- You want large image previews and Quick Look support
- You need flexible panel positioning
- You use quick paste shortcuts (⌘1-9)
- You want to pin frequently used items

### When to choose Maccy
- You prefer a native, lightweight dropdown menu
- Memory usage is a priority
- You need extensive customization options
- You prefer the traditional clipboard manager UX

## Acknowledgments

This project was inspired by:
- [Maccy](https://github.com/p0deje/Maccy) - A lightweight open-source clipboard manager for macOS

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the macOS community
