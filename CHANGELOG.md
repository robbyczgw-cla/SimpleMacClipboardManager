# Changelog

All notable changes to SimpleMacClipboardManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Consolidated clipboard correctness, CI and accessibility/release work from draft PRs #9–#11
- Image duplicate identities now use decoded bitmap SHA-256 fingerprints
- History updates never delete image files outside the app-managed images directory

### Changed
- Application compilation and macOS packaging now use separate npm scripts
- Current unsigned/ad-hoc distribution wording no longer recommends removing Gatekeeper quarantine
- Modernized the runtime and release toolchain to Electron 43.3.0 and electron-builder 26.15.3
- Added explicit dependency-audit, watch-test and signed-release entry-point scripts

## [0.13.2] - 2026-05-29

### Added
- Settings and Quit actions are reachable directly from the clipboard panel

### Fixed
- Settings reliably comes to the foreground for the menu-bar agent

## [0.13.1] - 2026-05-29

### Fixed
- Run as a proper `LSUIElement` menu-bar agent without a Dock flash
- Preserve the optional Show in Dock setting

## [0.13.0] - 2026-05-29

### Added
- Fuzzy search and a recordable global hotkey
- Complete translations across all five supported languages

### Changed
- Refined the liquid-glass UI, accessibility semantics, and renderer performance

### Security
- Added a production Content Security Policy and navigation guard
- Hardened imports, external links, settings validation, and AppleScript execution

### Fixed
- Preview, search-input, image-deduplication, selection, and clipboard recapture bugs

## [0.12.0] - 2026-03-13

### Added
- **Image Filter Tab** - Filter clipboard history to show only images
- **Copy Sound** - `playSoundOnCopy` setting now plays a macOS system sound when new items are captured
- **"Copied!" Toast** - Brief confirmation overlay when copying or pasting an item

### Changed
- **Instant Settings** - All settings now apply immediately on change, no Save button needed
- **Faster Panel Animation** - Reduced from 350ms to 180ms for a snappier feel

### Fixed
- **Shell Injection** - Sanitize app names before passing to AppleScript
- **URL Parse Crash** - Malformed URLs no longer crash the renderer
- **Merge Paste Duplicates** - Merge paste no longer creates a ghost history entry
- **History Lost on Quit** - Flush pending saves before exit

### Performance
- Cache `getSettings()` in memory instead of reading from disk every poll cycle
- Reduce `backdrop-filter` blur from 80px to 12px (redundant with native vibrancy)
- Remove unused `framer-motion` dependency (~45KB saved)
- Deduplicate image compression logic

## [0.11.1] - 2026-03-13

### Fixed
- **High Background CPU Usage** - Reduced idle CPU consumption significantly
  - Cache frontmost app detection (osascript) with 2-second TTL instead of spawning a subprocess every poll cycle
  - Check clipboard text before image — skip the expensive `readImage()` call when only text changed
  - Replace full PNG encode (`toDataURL()`) with lightweight bitmap size comparison for image change detection

## [0.11.0] - 2026-03-12

### Changed
- Shared TypeScript types between main and renderer processes
- Disk-backed image storage instead of electron-store for better performance
- Debounced history writes to reduce disk I/O
- Improved plain-text paste and image drag behavior

### Fixed
- Panel-hidden event now fires reliably

## [0.10.0] - 2026-03-11

### Added
- **Card Size Setting** - Choose between small, medium, or large card sizes

### Security
- Sanitize markdown preview to prevent XSS
- Secure external link opening
- Add favicon privacy toggle

### Fixed
- Incorrect repository name in Build from Source instructions

## [0.9.0] - 2026-01-14

### Added
- **Smart Actions for Links** - "Open in Browser" button appears on hover
- **Smart Actions for Images** - "Preview" button appears on hover
- **O shortcut** - Press O to open selected URL in browser
- Preview modal for links now has Copy URL, Copy Domain buttons

## [0.8.1] - 2026-01-14

### Fixed
- Card text now smaller and cleaner
- Content no longer overlaps pin/delete buttons
- Clear multi-selection when panel opens

## [0.8.0] - 2026-01-14

### Added
- **Drag & Drop** - Drag items from panel directly into other apps
- **Merge Paste** - Shift+click to multi-select, then ⌘M to paste all together
- **Markdown Preview** - Text with markdown is rendered with formatting in preview
- **Text Transformations** - Copy as UPPERCASE, lowercase, Title Case, or trimmed whitespace
- **URL Favicons** - Links show website favicon for quick identification
- **Export/Import** - Backup and restore clipboard history as JSON
- **Move to Top** - Pasted items automatically move to top of history

### Changed
- Preview modal now shows transformation buttons for text items
- Footer shows multi-select hint when items are selected

## [0.7.1] - 2026-01-14

### Fixed
- Pin button (star) now visible on hover, matching delete button behavior

## [0.7.0] - 2026-01-14

### Changed
- Panel height increased to 320px for better spacing
- Footer text contrast improved for readability
- Type badges now use solid opaque colors (85-90%) for clear white text
- Card footer text uses medium font weight
- Delete button now visible on hover and always on selected cards

### Fixed
- Card animation no longer re-triggers on selection change
- Search bar no longer cut off at top
- Reduced gap between search bar and cards

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
