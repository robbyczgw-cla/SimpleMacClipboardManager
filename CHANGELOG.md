# Changelog

All notable changes to SimpleMacClipboardManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
