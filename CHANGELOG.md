# Changelog

All notable changes to SimpleMacClipboardManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-01-14

### Added
- **Virtualized List** - Uses react-window for smooth performance with 500+ items
- **Multi-Monitor Support** - Panel appears on the display where your cursor is
- **Ignored Pasteboard Types** - Maccy-style privacy using pasteboard type detection (TransientType, ConcealedType, etc.)
- **Editable Ignore List** - Customize which pasteboard types to ignore in Settings > Privacy

### Changed
- Thumbnail compression improved (120px, JPEG 70%) for faster loading
- Long text (10K+ chars) truncated in search index for performance
- Error handling around clipboard reads prevents crashes
- About/Help dialogs now show correct app logo

### Fixed
- Panel positioning on multi-monitor setups

## [0.5.0] - 2026-01-14

### Added
- **Liquid Glass Design** - Modern macOS-inspired UI with translucent panels, gradient overlays, and soft glows
- **About Dialog** - Shows version info with links to GitHub repo and author profile
- **Enhanced Visual Effects** - Stronger backdrop blur (80px), subtle gradient overlays, glowing selection states

### Changed
- Cards now have glass effect with inner shadows and gradient backgrounds
- Filter buttons have liquid glass styling with glow effects when selected
- Search input has focus glow effect
- Type badges now have backdrop blur and subtle shadows
- Improved dark and light mode color schemes for better transparency

## [0.4.0] - 2026-01-14

### Added
- **Paste Directly Setting** - Choose between copy-only mode (default, like Paste app) or auto-paste mode
- **⌘C Shortcut** - Always copies without auto-pasting, regardless of settings

### Changed
- Default behavior now matches Paste app: selecting an item copies to clipboard (user manually pastes with ⌘V)
- Double-click and right-click behavior controlled by "Paste directly" setting
- Enter key behavior controlled by "Paste directly" setting
- Shift+Enter always pastes directly as plain text

## [0.3.0] - 2026-01-14

### Added
- **Multi-Language Support** - Interface available in English, Spanish, French, German, and Chinese
- **Larger UI** - Increased card and text sizes for better readability

### Changed
- Reduced panel height to eliminate unused space
- Improved overall UI sizing and spacing

## [0.2.0] - 2026-01-14

### Added
- **Panel Position Setting** - Choose where the clipboard panel appears (bottom, top, left, right)
- **Image Support** - Capture and preview screenshots and images from clipboard
- **Quick Look Preview** - Press Space to preview any clipboard item in detail
- **Paste as Plain Text** - Use Shift+Enter to paste without formatting
- **Live Settings** - Most settings now apply instantly without app restart
- **Improved Contrast** - Better text readability in both dark and light modes
- **Vertical Layout** - Left/right panel positions use vertical scrolling layout
- **Arrow Key Navigation** - Use arrow keys in any direction to navigate items

### Changed
- Default hotkey changed from Cmd+Shift+V to Option+Space for easier access
- Improved glass effect with native macOS vibrancy
- Better dark/light mode auto-detection using system preferences
- Settings window now applies changes immediately

### Fixed
- Panel positioning now uses full screen size instead of work area
- Duplicate detection for images using content comparison
- Hotkey re-registration when changed in settings

## [0.1.0] - 2026-01-13

### Added
- Initial release
- Clipboard history with text, link, file, and color support
- Global hotkey (Cmd+Shift+V) to toggle panel
- Search and filter by content type
- Pin important items to keep them at the top
- Quick paste with Cmd+1-9
- Source app tracking
- Dark/light mode support
- Privacy features (ignore password managers, ignore duplicates)
- Settings persistence with electron-store
- Menu bar tray icon
- Keyboard navigation (arrow keys, Enter to paste, Esc to close)
