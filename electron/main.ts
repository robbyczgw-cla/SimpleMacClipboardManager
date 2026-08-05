import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage, screen, Tray, Menu, systemPreferences, dialog, shell, session } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { exec, execFile } from 'child_process'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import type { ClipboardItem, ClipboardItemType, ClipboardItemMetadata, Collection, Settings } from '../common/types'
import { defaultSettings, DEFAULT_IGNORED_TYPES, SETTINGS_BOUNDS } from '../common/defaults'
import { addCapturedItem, compareItems, isItemSaved, limitHistory } from '../common/history'
import { addItemToCollection, removeItemFromCollection as removeItemFromCollectionState } from '../common/collections'
import { getBitmapFingerprint } from '../common/image-fingerprint'
import { isPathWithinDirectory } from '../common/paths'
import { createDefaultSavedCollection, DEFAULT_SAVED_COLLECTION_ID } from '../common/migrations'
import { isSafeId } from '../common/ids'
import { StoreRepository } from './repositories/store-repository'
import { productMetadata } from '../common/product'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const repository = new StoreRepository(defaultSettings)

// In-memory cache so we can debounce disk writes without losing consistency.
let historyCache: ClipboardItem[] = repository.history
let pendingHistorySave: ReturnType<typeof setTimeout> | null = null
let lastSoundTime = 0

function getImagesDir(): string {
  const dir = join(app.getPath('userData'), 'images')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function deleteImageFileForItem(item: ClipboardItem) {
  if (item.type !== 'image') return
  const imagePath = item.metadata.imagePath
  if (!imagePath) return
  if (!isPathWithinDirectory(imagePath, getImagesDir())) {
    console.warn('Refusing to delete image outside managed directory:', imagePath)
    return
  }
  try {
    if (existsSync(imagePath)) unlinkSync(imagePath)
  } catch (e) {
    console.warn('Failed to delete image file:', imagePath, e)
  }
}

function applyHistoryUpdate(next: ClipboardItem[]) {
  // Cleanup removed image files (best-effort)
  const previousPaths = new Set(
    historyCache
      .filter(i => i.type === 'image' && i.metadata.imagePath && isPathWithinDirectory(i.metadata.imagePath, getImagesDir()))
      .map(i => i.metadata.imagePath as string)
  )
  const nextPaths = new Set(
    next
      .filter(i => i.type === 'image' && i.metadata.imagePath && isPathWithinDirectory(i.metadata.imagePath, getImagesDir()))
      .map(i => i.metadata.imagePath as string)
  )
  for (const p of previousPaths) {
    if (!nextPaths.has(p)) {
      try {
        if (existsSync(p)) unlinkSync(p)
      } catch {
        // ignore
      }
    }
  }

  // Play sound when a new item is captured (list grew). Throttled so a burst of
  // copies can't spawn a pile of afplay processes; errors are swallowed.
  if (next.length > historyCache.length) {
    const settings = getSettings()
    if (settings.playSoundOnCopy) {
      const now = Date.now()
      if (now - lastSoundTime > 250) {
        lastSoundTime = now
        exec('afplay /System/Library/Sounds/Tink.aiff', () => {})
      }
    }
  }

  historyCache = next

  // PERFORMANCE: the renderer only needs updates while the panel is visible.
  // When hidden it re-fetches via get-history on panel-shown, so skip the
  // (potentially large, thumbnail-laden) structured-clone on every poll capture.
  if (mainWindow?.isVisible()) {
    mainWindow.webContents.send('history-updated', historyCache)
  }

  // PERFORMANCE: debounce disk writes to reduce electron-store churn.
  if (pendingHistorySave) clearTimeout(pendingHistorySave)
  pendingHistorySave = setTimeout(() => {
    repository.saveHistory(historyCache)
    pendingHistorySave = null
  }, 400)
}

function persistImageToDisk(id: string, img: import('electron').NativeImage, settings: Settings) {
  let toSave = img
  let buffer = toSave.toPNG()
  let mime = 'image/png'
  let ext = 'png'

  if (buffer.byteLength > settings.maxImageBytes) {
    const size = toSave.getSize()
    const targetWidth = Math.min(1600, size.width)
    toSave = toSave.resize({ width: targetWidth })
    buffer = toSave.toPNG()
  }
  if (buffer.byteLength > settings.maxImageBytes) {
    buffer = toSave.toJPEG(80)
    mime = 'image/jpeg'
    ext = 'jpg'
  }

  const imagePath = join(getImagesDir(), `${id}.${ext}`)
  writeFileSync(imagePath, buffer)
  return { imagePath, fileUrl: pathToFileURL(imagePath).toString(), mime }
}

function migrateHistoryImagesToDisk() {
  const settings = getSettings()
  let changed = false

  const migrated = historyCache.map(item => {
    if (item.type !== 'image') return item
    if (item.metadata.imagePath && existsSync(item.metadata.imagePath)) return item
    if (!item.content.startsWith('data:')) return item

    try {
      const img = nativeImage.createFromDataURL(item.content)
      if (img.isEmpty()) return item
      const persisted = persistImageToDisk(item.id, img, settings)
      changed = true
      return {
        ...item,
        content: persisted.fileUrl,
        metadata: {
          ...item.metadata,
          imagePath: persisted.imagePath,
          imageMime: persisted.mime
        }
      }
    } catch {
      return item
    }
  })

  if (changed) {
    historyCache = migrated
    repository.saveHistory(historyCache)
  }
}

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let lastClipboardContent = ''
let clipboardPollInterval: ReturnType<typeof setInterval> | null = null
let previousApp = '' // Store the app that was active before opening clipboard panel

function hideMainWindow() {
  if (!mainWindow) return
  if (!mainWindow.isVisible()) return
  // Keep renderer state in sync (used for clearing search/selection, etc.)
  mainWindow.webContents.send('panel-hidden')
  mainWindow.hide()
}

// In-memory settings cache — avoids hitting disk (electron-store) on every
// clipboard poll cycle. Invalidated only when settings are saved.
let _settingsCache: Settings | null = null

function getSettings(): Settings {
  if (_settingsCache) return _settingsCache
  _settingsCache = repository.settings || defaultSettings
  return _settingsCache
}

function invalidateSettingsCache() {
  _settingsCache = null
}

function getWindowBounds() {
  // Get display where cursor is (for multi-monitor support)
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x: displayX, y: displayY, width, height } = display.bounds

  const settings = getSettings()
  const panelSize = 320

  switch (settings.panelPosition) {
    case 'top':
      return { width, height: panelSize, x: displayX, y: displayY }
    case 'left':
      return { width: panelSize, height, x: displayX, y: displayY }
    case 'right':
      return { width: panelSize, height, x: displayX + width - panelSize, y: displayY }
    case 'bottom':
    default:
      return { width, height: panelSize, x: displayX, y: displayY + height - panelSize }
  }
}

function configureExternalLinkHandling(win: BrowserWindow) {
  // SECURITY: never allow renderer-created windows (window.open/target=_blank)
  // to create new BrowserWindows. Open approved URLs externally instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Best-effort open externally; also enforce protocol allowlist.
    try {
      const parsed = new URL(url)
      const allowed = ['http:', 'https:', 'mailto:']
      if (allowed.includes(parsed.protocol)) {
        shell.openExternal(url)
      }
    } catch {
      // ignore invalid URLs
    }

    return { action: 'deny' }
  })

  // SECURITY: the SPA must never navigate away from its own document. Block any
  // top-level navigation except the dev server / our bundled files.
  win.webContents.on('will-navigate', (e, url) => {
    const devUrl = process.env.VITE_DEV_SERVER_URL
    if (devUrl && url.startsWith(devUrl)) return
    if (url.startsWith('file://')) return
    e.preventDefault()
  })
}

function createWindow() {
  const bounds = getWindowBounds()

  mainWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  configureExternalLinkHandling(mainWindow)

  const url = process.env.VITE_DEV_SERVER_URL
  if (url) {
    console.log('Loading dev URL:', url)
    mainWindow.loadURL(url)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window content loaded')
  })

  mainWindow.webContents.on('did-fail-load', (_, code, desc) => {
    console.error('Failed to load:', code, desc)
  })

  mainWindow.on('blur', () => {
    if (mainWindow?.isVisible()) {
      hideMainWindow()
    }
  })
}

function createTray() {
  // Try multiple paths for the tray icon
  const possiblePaths = [
    join(__dirname, '../assets/trayTemplate.png'),  // Dev mode
    join(process.resourcesPath, 'assets/trayTemplate.png'),  // Production (extraResources)
    join(__dirname, 'assets/trayTemplate.png'),  // Alternative
  ]

  let icon = nativeImage.createEmpty()
  for (const iconPath of possiblePaths) {
    console.log('Trying tray icon path:', iconPath)
    const testIcon = nativeImage.createFromPath(iconPath)
    if (!testIcon.isEmpty()) {
      icon = testIcon
      console.log('Loaded tray icon from:', iconPath)
      break
    }
  }

  icon.setTemplateImage(true)

  if (icon.isEmpty()) {
    console.error('Failed to load tray icon from any path, using fallback')
    const fallback = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2NkIBMwkqmegXKDGRhggOL/DAwMjMRoHjUAl7cHiw8YRsMRNkcPltBgoCYHAHCbBBHpOpp5AAAAAElFTkSuQmCC'
    )
    fallback.setTemplateImage(true)
    tray = new Tray(fallback)
  } else {
    tray = new Tray(icon)
  }
  tray.setToolTip(productMetadata.displayName)

  updateTrayMenu()
  tray.on('click', toggleWindow)

  console.log('Tray icon created')
}

function updateTrayMenu() {
  if (!tray) return

  const menu = Menu.buildFromTemplate([
    { label: 'Show Clipboard (⌥Space)', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Settings...', click: () => openSettings() },
    { label: 'How to Use...', click: () => showHelp() },
    { label: 'About...', click: () => showAbout() },
    { type: 'separator' },
    { label: 'Clear History', click: () => clearHistory() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
}

type SettingsRoute = 'settings' | 'onboarding'

function loadSettingsRoute(route: SettingsRoute) {
  if (!settingsWindow) return
  const url = process.env.VITE_DEV_SERVER_URL
  if (url) {
    settingsWindow.loadURL(`${url}#${route}`)
  } else {
    settingsWindow.loadFile(join(__dirname, '../dist/index.html'), { hash: route })
  }
}

function openSettings(route: SettingsRoute = 'settings') {
  if (settingsWindow) {
    // Agent (LSUIElement) apps need an explicit app-level focus to come forward.
    app.focus({ steal: true })
    loadSettingsRoute(route)
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 700,
    title: `${productMetadata.displayName} Settings`,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#2a2a2a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  configureExternalLinkHandling(settingsWindow)

  loadSettingsRoute(route)

  settingsWindow.once('ready-to-show', () => {
    // Bring the agent app + its window to the foreground reliably.
    app.focus({ steal: true })
    settingsWindow?.show()
    settingsWindow?.focus()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function toggleWindow() {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    hideMainWindow()
  } else {
    // Show the panel IMMEDIATELY — never block the hottest path on osascript.
    const bounds = getWindowBounds()
    mainWindow.setBounds(bounds)
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('panel-shown')

    // Remember which app was active before opening the panel, asynchronously.
    // It's only needed later for auto-paste, so it can resolve after show().
    execFile('osascript', ['-e', FRONTMOST_APP_SCRIPT], { timeout: 500 }, (err, stdout) => {
      previousApp = err ? '' : (stdout || '').trim()
    })
  }
}

function clearHistory() {
  const retained = historyCache.filter(isItemSaved)
  for (const item of historyCache) {
    if (!isItemSaved(item)) deleteImageFileForItem(item)
  }
  applyHistoryUpdate(retained)
}

// Move an item to the top of history (when pasted/copied from our app).
// Builds a fresh item object (never mutates the cached one) and uses an O(n)
// partition that keeps pinned items first while preserving their order — no
// full re-sort needed since the rest of history is already correctly ordered.
function moveItemToTop(id: string) {
  const itemIndex = historyCache.findIndex(h => h.id === id)
  if (itemIndex <= 0) return // already on top (within its pinned group) or absent

  const moved = { ...historyCache[itemIndex], createdAt: Date.now() }
  const rest = historyCache.filter(h => h.id !== id)
  const pinned = rest.filter(isItemSaved)
  const unpinned = rest.filter(item => !isItemSaved(item))

  const updated = isItemSaved(moved)
    ? [moved, ...pinned, ...unpinned]
    : [...pinned, moved, ...unpinned]

  applyHistoryUpdate(updated)
}

function showHelp() {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'logo.jpg')
    : join(__dirname, '..', 'assets', 'logo.jpg')

  dialog.showMessageBox({
    type: 'info',
    icon: nativeImage.createFromPath(iconPath),
    title: 'How to Use',
    message: productMetadata.displayName,
    detail: `Keyboard Shortcuts:
• ⌥Space - Open/close clipboard panel
• ←→ or ↑↓ - Navigate between items
• Enter - Copy to clipboard (or paste if enabled)
• ⌘C - Copy to clipboard (always)
• ⇧Enter - Paste directly as plain text
• Space - Quick Look preview
• ⌘1-9 - Quick paste items 1-9
• ⌘⌫ - Delete selected item
• Esc - Close panel

Mouse Actions:
• Click - Select item
• Double-click - Copy (or paste if enabled)
• Right-click - Copy (or paste if enabled)
• Star icon - Pin/unpin item

Tips:
• Type to search clipboard history
• Use filter buttons to show specific types
• Pinned items stay at the top
• Enable "Paste directly" in Settings to auto-paste`,
    buttons: ['OK']
  })
}

function showAbout() {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'logo.jpg')
    : join(__dirname, '..', 'assets', 'logo.jpg')

  const version = app.getVersion()

  // Show the main window briefly so the dialog has a parent and doesn't get
  // lost behind other windows (which makes macOS appear to hang).
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.showInactive()
  }

  dialog.showMessageBox(mainWindow!, {
    type: 'info',
    icon: nativeImage.createFromPath(iconPath),
    title: 'About',
    message: productMetadata.displayName,
    detail: `Version ${version}

A visual, privacy-focused clipboard manager for macOS.
Keep your clipboard history organized and accessible.

Created by @robbyczgw-cla`,
    buttons: ['GitHub Repo', 'Author Profile', 'OK'],
    defaultId: 2,
    cancelId: 2
  }).then(result => {
    if (result.response === 0) {
      shell.openExternal(productMetadata.supportUrl)
    } else if (result.response === 1) {
      shell.openExternal('https://github.com/robbyczgw-cla')
    }
  })
}

function detectContentType(text: string): ClipboardItem['type'] {
  const trimmed = text.trim()
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) return 'color'
  if (/^https?:\/\/\S+$/.test(trimmed)) return 'link'
  if (/^(\/|~\/|[A-Z]:\\)/.test(trimmed)) return 'file'
  return 'text'
}

const VALID_ITEM_TYPES: ClipboardItemType[] = ['text', 'image', 'link', 'file', 'color']
function getItemById(rawId: unknown): ClipboardItem | null {
  if (!isSafeId(rawId)) return null
  return historyCache.find(item => item.id === rawId) || null
}

function toggleSavedItem(rawId: unknown) {
  const item = getItemById(rawId)
  if (!item) return

  const saving = !isItemSaved(item)
  if (saving) {
    if (!repository.collections.some(collection => collection.id === DEFAULT_SAVED_COLLECTION_ID)) {
      repository.saveCollections([...repository.collections, createDefaultSavedCollection()])
    }
  }

  const history = historyCache.map(entry => entry.id === item.id
    ? saving
      ? addItemToCollection(entry, DEFAULT_SAVED_COLLECTION_ID)
      : removeItemFromCollectionState(entry, DEFAULT_SAVED_COLLECTION_ID)
    : entry
  )
  applyHistoryUpdate(history.sort(compareItems))
  notifyCollectionsUpdated()
}

function notifyCollectionsUpdated() {
  if (mainWindow?.isVisible()) {
    mainWindow.webContents.send('collections-updated', repository.collections)
  }
}

function getCollectionById(rawId: unknown) {
  if (!isSafeId(rawId)) return null
  return repository.collections.find(collection => collection.id === rawId) || null
}

function normalizeCollectionName(rawName: unknown): string | null {
  if (typeof rawName !== 'string') return null
  const name = rawName.trim().replace(/\s+/g, ' ').slice(0, 120)
  return name.length > 0 ? name : null
}

function validateImportedCollection(raw: unknown): Collection | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  if (!isSafeId(value.id) || typeof value.name !== 'string') return null
  const name = normalizeCollectionName(value.name)
  if (!name) return null
  const createdAt = typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : Date.now()
  return {
    id: value.id,
    name,
    createdAt,
    updatedAt: typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt) ? value.updatedAt : createdAt,
    sortOrder: typeof value.sortOrder === 'number' && Number.isFinite(value.sortOrder) ? value.sortOrder : 0,
    system: value.id === DEFAULT_SAVED_COLLECTION_ID
  }
}

function createCollection(rawName: unknown) {
  const name = normalizeCollectionName(rawName)
  if (!name) return null
  if (repository.collections.some(collection => collection.name.toLowerCase() === name.toLowerCase())) return null

  const now = Date.now()
  const collection = {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    sortOrder: repository.collections.length,
    system: false
  }
  repository.saveCollections([...repository.collections, collection])
  notifyCollectionsUpdated()
  return collection
}

function renameCollection(rawId: unknown, rawName: unknown): boolean {
  const collection = getCollectionById(rawId)
  const name = normalizeCollectionName(rawName)
  if (!collection || collection.system || !name) return false
  if (repository.collections.some(other => other.id !== collection.id && other.name.toLowerCase() === name.toLowerCase())) return false

  repository.saveCollections(repository.collections.map(other => other.id === collection.id
    ? { ...other, name, updatedAt: Date.now() }
    : other
  ))
  notifyCollectionsUpdated()
  return true
}

function deleteCollection(rawId: unknown): boolean {
  const collection = getCollectionById(rawId)
  if (!collection || collection.system) return false

  repository.saveCollections(repository.collections.filter(other => other.id !== collection.id))
  const history = historyCache.map(item => item.collectionIds?.includes(collection.id)
    ? { ...item, collectionIds: item.collectionIds?.filter(id => id !== collection.id) }
    : item
  )
  applyHistoryUpdate(history)
  notifyCollectionsUpdated()
  return true
}

function assignItemsToCollection(rawItemIds: unknown, rawCollectionId: unknown) {
  const collection = getCollectionById(rawCollectionId)
  if (!collection || !Array.isArray(rawItemIds)) return
  const itemIds = new Set(rawItemIds.filter((id): id is string => isSafeId(id)).slice(0, 500))
  if (itemIds.size === 0) return

  if (!repository.collections.some(item => item.id === DEFAULT_SAVED_COLLECTION_ID)) {
    repository.saveCollections([...repository.collections, createDefaultSavedCollection()])
  }

  const history = historyCache.map(item => {
    if (!itemIds.has(item.id)) return item
    return addItemToCollection(item, collection.id)
  })
  applyHistoryUpdate(history.sort(compareItems))
  notifyCollectionsUpdated()
}

function removeItemFromCollection(rawItemId: unknown, rawCollectionId: unknown) {
  const collection = getCollectionById(rawCollectionId)
  const item = getItemById(rawItemId)
  if (!collection || !item) return

  const updated = removeItemFromCollectionState(item, collection.id)
  applyHistoryUpdate(historyCache.map(entry => entry.id === item.id ? updated : entry).sort(compareItems))
}

// Validate/normalize a single item from an imported JSON file before it crosses
// the trust boundary into the store and the renderer DOM. Returns a clean item
// or null to drop it. SECURITY: stale image paths and arbitrary favicon URLs are
// dropped; thumbnails are only accepted if they are data:image/ URLs.
function validateImportedItem(raw: any, settings: Settings): ClipboardItem | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.content !== 'string' || !raw.content) return null

  const type: ClipboardItemType = VALID_ITEM_TYPES.includes(raw.type)
    ? raw.type
    : detectContentType(raw.content)

  const md = raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : {}
  const metadata: ClipboardItemMetadata = {
    url: typeof md.url === 'string' ? md.url : undefined,
    fileName: typeof md.fileName === 'string' ? md.fileName : undefined,
    colorHex: typeof md.colorHex === 'string' ? md.colorHex : undefined,
    sourceApp: typeof md.sourceApp === 'string' ? md.sourceApp : undefined,
    imageMime: typeof md.imageMime === 'string' ? md.imageMime : undefined
    // NOTE: favicon and title intentionally dropped on import (arbitrary URLs).
  }

  const thumbnail =
    typeof raw.thumbnail === 'string' && /^data:image\//.test(raw.thumbnail)
      ? raw.thumbnail
      : undefined
  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : Date.now()
  const pinned = !!raw.pinned
  const savedAt = typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt)
    ? raw.savedAt
    : pinned ? createdAt : undefined
  const collectionIds = Array.isArray(raw.collectionIds)
    ? raw.collectionIds.filter((id: unknown): id is string => isSafeId(id))
    : []
  if (savedAt !== undefined && !collectionIds.includes(DEFAULT_SAVED_COLLECTION_ID)) {
    collectionIds.unshift(DEFAULT_SAVED_COLLECTION_ID)
  }
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((tag: unknown): tag is string => typeof tag === 'string' && tag.trim().length > 0).slice(0, 100)
    : []

  if (type === 'image') {
    // Re-persist inline image data; a cross-machine imagePath won't resolve.
    if (raw.content.startsWith('data:')) {
      try {
        const img = nativeImage.createFromDataURL(raw.content)
        if (img.isEmpty()) return null
        const id = uuidv4()
        const persisted = persistImageToDisk(id, img, settings)
        return {
          id,
          type: 'image',
          content: persisted.fileUrl,
          thumbnail: thumbnail || raw.content,
          metadata: {
            ...metadata,
            imagePath: persisted.imagePath,
            imageMime: persisted.mime,
            imageKey: getImageBitmapKey(img)
          },
          createdAt,
          searchText: 'image screenshot',
          savedAt,
          collectionIds,
          tags,
          pinned
        }
      } catch {
        return null
      }
    }
    // Accept an on-disk path only if it actually exists on this machine.
    if (
      typeof md.imagePath === 'string' &&
      isPathWithinDirectory(md.imagePath, getImagesDir()) &&
      existsSync(md.imagePath)
    ) {
      return {
        id: typeof raw.id === 'string' && raw.id ? raw.id : uuidv4(),
        type: 'image',
        content: pathToFileURL(md.imagePath).toString(),
        thumbnail,
        metadata: { ...metadata, imagePath: md.imagePath, imageKey: typeof md.imageKey === 'string' ? md.imageKey : undefined },
        createdAt,
        searchText: 'image screenshot',
        savedAt,
        collectionIds,
        tags,
        pinned
      }
    }
    return null // image with no resolvable source
  }

  const searchText =
    typeof raw.searchText === 'string' && raw.searchText
      ? raw.searchText.slice(0, 5000).toLowerCase()
      : raw.content.slice(0, 5000).toLowerCase()

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uuidv4(),
    type,
    content: raw.content,
    thumbnail,
    metadata,
    createdAt,
    searchText,
    savedAt,
    collectionIds,
    tags,
    pinned
  }
}

// Activate a previously focused app and simulate Cmd+V.
//
// SECURITY: the app name originates from `osascript` output (the frontmost app
// when the panel opened) and macOS process names are attacker-influenceable, so
// this value is UNTRUSTED. We never build a shell string from it — execFile runs
// osascript directly with argv (no /bin/sh), eliminating shell-injection, and we
// still escape the AppleScript string layer for backslash/double-quote and reject
// names with control/quote characters as defense-in-depth.
function activateAndPaste(appName: string) {
  if (!appName) return
  // Reject anything that isn't a plausible app name (letters, digits, spaces and
  // a few benign punctuation marks). Blocks newlines, quotes, and metacharacters.
  if (!/^[\p{L}\p{N} .,'&!()+-]{1,128}$/u.test(appName)) {
    console.warn('Refusing to activate app with suspicious name:', JSON.stringify(appName))
    return
  }
  setTimeout(() => {
    const safe = appName.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    execFile(
      'osascript',
      [
        '-e', `tell application "${safe}" to activate`,
        '-e', 'delay 0.1',
        '-e', 'tell application "System Events" to keystroke "v" using command down'
      ],
      (err) => {
        if (err) console.error('Failed to simulate paste:', err)
      }
    )
  }, 100)
}

// Get favicon URL for a domain using Google's service
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

// Password manager app identifiers (backup check by app name)
const PASSWORD_MANAGER_APPS = [
  '1password', 'onepassword', 'bitwarden', 'lastpass', 'dashlane',
  'keeper', 'keychain', 'enpass', 'roboform', 'nordpass', 'proton pass'
]

// Frontmost-app tracking. PERFORMANCE/SECURITY: we never block the event loop on
// osascript and never build a shell string. getFrontmostApp() returns the cached
// value synchronously and kicks a non-blocking background refresh when stale, so
// the poll loop and panel-open path are never stalled waiting on System Events.
const FRONTMOST_APP_SCRIPT =
  'tell application "System Events" to get name of first application process whose frontmost is true'
let _frontmostAppCache = ''
let _frontmostAppCacheTime = 0
let _frontmostRefreshing = false
const FRONTMOST_APP_CACHE_TTL = 2000

function refreshFrontmostApp() {
  if (_frontmostRefreshing) return
  _frontmostRefreshing = true
  execFile('osascript', ['-e', FRONTMOST_APP_SCRIPT], { timeout: 500 }, (err, stdout) => {
    _frontmostRefreshing = false
    _frontmostAppCacheTime = Date.now()
    if (!err && stdout) _frontmostAppCache = stdout.trim().toLowerCase()
  })
}

function getFrontmostApp(): string {
  if (Date.now() - _frontmostAppCacheTime >= FRONTMOST_APP_CACHE_TTL) {
    refreshFrontmostApp() // fire-and-forget; the result lands for the next read
  }
  return _frontmostAppCache
}

// Check if clipboard contains ignored pasteboard types (Maccy-style)
function hasIgnoredPasteboardType(): boolean {
  const settings = getSettings()
  const ignoredTypes = settings.ignoredPasteboardTypes || DEFAULT_IGNORED_TYPES

  try {
    const formats = clipboard.availableFormats()
    return formats.some(format =>
      ignoredTypes.some(ignored =>
        format.toLowerCase().includes(ignored.toLowerCase())
      )
    )
  } catch {
    return false
  }
}

function isPasswordManagerActive(): boolean {
  // First check pasteboard types (more reliable)
  if (hasIgnoredPasteboardType()) {
    return true
  }
  // Fallback to app name check
  const frontApp = getFrontmostApp()
  return PASSWORD_MANAGER_APPS.some(pm => frontApp.includes(pm))
}

function startClipboardPolling() {
  const settings = getSettings()

  if (clipboardPollInterval) {
    clearInterval(clipboardPollInterval)
  }

  // Safely read initial clipboard content
  try {
    lastClipboardContent = clipboard.readText() || ''
  } catch (e) {
    console.error('Failed to read initial clipboard:', e)
    lastClipboardContent = ''
  }

  refreshFrontmostApp() // warm the cache so the first capture has a source app
  clipboardPollInterval = setInterval(pollClipboard, settings.pollingInterval)
  console.log('Clipboard polling started with interval:', settings.pollingInterval)
}

// Track the last image by a real content fingerprint. Bitmap byte length alone
// is only width * height * channels, so different same-size screenshots collided.
let lastImageBitmapKey = ''

function getImageBitmapKey(image: Electron.NativeImage): string {
  const size = image.getSize()
  return getBitmapFingerprint(size.width, size.height, image.toBitmap())
}

function pollClipboard() {
  try {
    const settings = getSettings()

    // --- Text check first (very cheap: string comparison) ---
    const text = clipboard.readText()

    if (text && text !== lastClipboardContent) {
      // Text changed — check password manager once, then process
      if (settings.ignorePasswordManagers && isPasswordManagerActive()) {
        console.log('Ignored clipboard from password manager')
        lastClipboardContent = text
        return
      }

      if (settings.ignoreDuplicates && historyCache.length > 0 && historyCache[0].content === text) {
        lastClipboardContent = text
        return
      }

      lastClipboardContent = text
      lastImageBitmapKey = '' // Clear image when text is copied
      const type = detectContentType(text)
      const sourceApp = getFrontmostApp()

      const MAX_SEARCH_TEXT = 5000
      const searchText = text.length > MAX_SEARCH_TEXT
        ? text.slice(0, MAX_SEARCH_TEXT).toLowerCase()
        : text.toLowerCase()

      const item: ClipboardItem = {
        id: uuidv4(),
        type,
        content: text,
        metadata: {
          url: type === 'link' ? text : undefined,
          colorHex: type === 'color' ? text : undefined,
          sourceApp: sourceApp || undefined,
          favicon: type === 'link' && settings.loadFavicons ? getFaviconUrl(text) : undefined
        },
        createdAt: Date.now(),
        searchText,
        pinned: false
      }

      const updated = addCapturedItem(historyCache, item, {
        historyLimit: settings.historyLimit,
        ignoreDuplicates: settings.ignoreDuplicates
      })
      applyHistoryUpdate(updated)
      return
    }

    // --- Image check (only if text didn't change) ---
    // clipboard.readImage() is expensive; we skip it when text already changed.
    const image = clipboard.readImage()

    if (!image.isEmpty()) {
      // Use a decoded bitmap fingerprint for change detection instead of
      // toDataURL(), which performs a full PNG encode every poll cycle.
      const bitmapKey = getImageBitmapKey(image)

      if (bitmapKey !== lastImageBitmapKey && bitmapKey !== '0x0:0') {
        lastImageBitmapKey = bitmapKey

        if (settings.ignorePasswordManagers && isPasswordManagerActive()) {
          return
        }

        // Dedup: if the identical image (by content signature) is already at the
        // top, don't re-capture it — avoids duplicate items, a new disk file, and
        // a duplicate sound on A→B→A copy patterns. Mirrors the text branch.
        if (
          settings.ignoreDuplicates &&
          historyCache[0]?.type === 'image' &&
          historyCache[0].metadata.imageKey === bitmapKey
        ) {
          return
        }

        const sourceApp = getFrontmostApp()
        const id = uuidv4()

        const thumbImg = image.resize({ width: 120, height: 120 })
        const thumbnail = thumbImg.toJPEG(70).toString('base64')
        const thumbnailDataUrl = `data:image/jpeg;base64,${thumbnail}`

        let persisted: ReturnType<typeof persistImageToDisk>
        try {
          persisted = persistImageToDisk(id, image, settings)
        } catch (e) {
          console.error('Failed to persist image file:', e)
          return
        }

        const item: ClipboardItem = {
          id,
          type: 'image',
          content: persisted.fileUrl,
          thumbnail: thumbnailDataUrl,
          metadata: {
            sourceApp: sourceApp || undefined,
            imagePath: persisted.imagePath,
            imageMime: persisted.mime,
            imageKey: bitmapKey
          },
          createdAt: Date.now(),
          searchText: 'image screenshot',
          pinned: false
        }

        const updated = addCapturedItem(historyCache, item, {
          historyLimit: settings.historyLimit,
          ignoreDuplicates: settings.ignoreDuplicates
        })
        applyHistoryUpdate(updated)
      }
    }
  } catch (e) {
    console.error('Clipboard poll error:', e)
  }
}

// Coerce/clamp untrusted settings (from the UI or an import) so a bad value can't
// break the poll loop (e.g. a 0/NaN interval → CPU spin) or silently drop history
// (historyLimit 0/NaN → slice to empty).
function sanitizeSettings(input: Partial<Settings> | undefined): Settings {
  const s: Settings = { ...defaultSettings, ...(input || {}) }
  const toNum = (v: unknown, def: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : def
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

  s.pollingInterval = clamp(
    Math.floor(toNum(s.pollingInterval, defaultSettings.pollingInterval)),
    SETTINGS_BOUNDS.pollingIntervalMin,
    SETTINGS_BOUNDS.pollingIntervalMax
  )
  s.historyLimit = clamp(
    Math.floor(toNum(s.historyLimit, defaultSettings.historyLimit)),
    SETTINGS_BOUNDS.historyLimitMin,
    SETTINGS_BOUNDS.historyLimitMax
  )
  s.maxImageBytes = clamp(
    Math.floor(toNum(s.maxImageBytes, defaultSettings.maxImageBytes)),
    SETTINGS_BOUNDS.maxImageBytesMin,
    SETTINGS_BOUNDS.maxImageBytesMax
  )

  s.ignoredPasteboardTypes = Array.isArray(s.ignoredPasteboardTypes)
    ? s.ignoredPasteboardTypes.filter(t => typeof t === 'string')
    : DEFAULT_IGNORED_TYPES
  if (typeof s.hotkey !== 'string' || !s.hotkey.trim()) s.hotkey = defaultSettings.hotkey
  if (!['bottom', 'top', 'left', 'right'].includes(s.panelPosition)) s.panelPosition = 'bottom'
  if (!['small', 'medium', 'large'].includes(s.cardSize)) s.cardSize = 'medium'
  if (!['en', 'es', 'fr', 'de', 'zh'].includes(s.language)) s.language = 'en'

  const bools = [
    'launchAtLogin', 'clearOnQuit', 'showInDock', 'playSoundOnCopy',
    'ignoreDuplicates', 'ignorePasswordManagers', 'pasteDirectly', 'loadFavicons'
  ] as const
  for (const k of bools) s[k] = !!s[k]

  return s
}

function applySettings(settings: Settings) {
  // Apply launch at login
  app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin,
    openAsHidden: true
  })

  // Apply dock visibility
  if (settings.showInDock) {
    app.dock?.show()
  } else {
    app.dock?.hide()
  }

  // Restart polling with new interval
  startClipboardPolling()

  // Re-register hotkey. If the requested accelerator can't be registered, roll
  // back to the default so the app is never left with no working shortcut.
  globalShortcut.unregisterAll()
  let registered = false
  try {
    registered = globalShortcut.register(settings.hotkey, toggleWindow)
  } catch {
    registered = false
  }
  if (!registered && settings.hotkey !== defaultSettings.hotkey) {
    console.warn('Hotkey registration failed, rolling back to default:', settings.hotkey)
    settings.hotkey = defaultSettings.hotkey
    try {
      globalShortcut.register(defaultSettings.hotkey, toggleWindow)
    } catch {
      // nothing else we can do
    }
    repository.saveSettings(settings)
    invalidateSettingsCache()
  }

  // Update window position if panel position changed
  if (mainWindow && !mainWindow.isVisible()) {
    const bounds = getWindowBounds()
    mainWindow.setBounds(bounds)
  }
}

app.whenReady().then(() => {
  console.log('App ready, creating window and tray...')

  // SECURITY: apply a restrictive Content-Security-Policy to the renderer. Only
  // in production — the Vite dev server needs inline/eval + a websocket for HMR.
  if (!process.env.VITE_DEV_SERVER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; " +
              "img-src 'self' data: file: https://www.google.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "script-src 'self'; " +
              "connect-src 'self'; " +
              "font-src 'self'; " +
              "object-src 'none'; " +
              "base-uri 'none'; " +
              "form-action 'none'"
          ]
        }
      })
    })
  }

  // Accessibility permission is not actually required for Electron's globalShortcut
  // API, so we just log the status without prompting. The dialog was shown on every
  // fresh install/re-sign and confused users since hotkeys worked regardless.
  if (process.platform === 'darwin') {
    const isTrusted = systemPreferences.isTrustedAccessibilityClient(false)
    console.log('Accessibility permission:', isTrusted ? 'granted' : 'not granted')
  }

  const settings = getSettings()

  // Migration: older versions stored full image data URLs in electron-store.
  // Convert them to on-disk files to reduce storage and memory usage.
  migrateHistoryImagesToDisk()

  // Apply initial dock visibility. The app is an LSUIElement (menu-bar agent) so
  // it starts WITHOUT a Dock icon by default; explicitly show it when the user
  // opted in, otherwise ensure it stays hidden.
  if (settings.showInDock) {
    app.dock?.show()
  } else {
    app.dock?.hide()
  }

  app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin,
    openAsHidden: true
  })

  createWindow()
  createTray()
  if (!settings.onboardingCompleted) openSettings('onboarding')
  startClipboardPolling()

  // Register hotkey
  const registered = globalShortcut.register(settings.hotkey, toggleWindow)
  console.log('Hotkey registered:', registered)

  // IPC handlers
  ipcMain.handle('get-history', () => historyCache)
  ipcMain.handle('get-collections', () => repository.collections)
  ipcMain.handle('create-collection', (_, name: unknown) => createCollection(name))
  ipcMain.handle('rename-collection', (_, id: unknown, name: unknown) => renameCollection(id, name))
  ipcMain.handle('delete-collection', (_, id: unknown) => deleteCollection(id))
  ipcMain.handle('assign-items-to-collection', (_, itemIds: unknown, collectionId: unknown) => {
    assignItemsToCollection(itemIds, collectionId)
  })
  ipcMain.handle('remove-item-from-collection', (_, itemId: unknown, collectionId: unknown) => {
    removeItemFromCollection(itemId, collectionId)
  })

  // SECURITY: renderer requests to open external links should go through main.
  ipcMain.handle('open-external', async (_evt, url: string) => {
    try {
      const parsed = new URL(url)
      const allowed = ['http:', 'https:', 'mailto:']
      if (!allowed.includes(parsed.protocol)) return { success: false }
      await shell.openExternal(url)
      return { success: true }
    } catch {
      return { success: false }
    }
  })

  ipcMain.handle('get-image-drag-path', async (_evt, itemId: unknown) => {
    try {
      const item = getItemById(itemId)
      if (!item || item.type !== 'image') return { success: false }

      if (
        item.metadata.imagePath &&
        isPathWithinDirectory(item.metadata.imagePath, getImagesDir()) &&
        existsSync(item.metadata.imagePath)
      ) {
        return {
          success: true,
          path: pathToFileURL(item.metadata.imagePath).toString(),
          mime: item.metadata.imageMime || 'image/png',
          filename: `clipboard-${item.id}`
        }
      }

      if (item.content.startsWith('data:')) {
        const img = nativeImage.createFromDataURL(item.content)
        if (img.isEmpty()) return { success: false }
        const settings = getSettings()
        const persisted = persistImageToDisk(item.id, img, settings)
        // Do not modify history here; this is just for drag-and-drop.
        return {
          success: true,
          path: persisted.fileUrl,
          mime: persisted.mime,
          filename: `clipboard-${item.id}`
        }
      }

      return { success: false }
    } catch {
      return { success: false }
    }
  })
  ipcMain.handle('paste-item', (_, itemId: unknown) => {
    const item = getItemById(itemId)
    if (!item) return
    if (item.type === 'image') {
      // For images, write the image to clipboard (file-based preferred).
      const img = item.metadata.imagePath
        ? nativeImage.createFromPath(item.metadata.imagePath)
        : (item.content.startsWith('data:') ? nativeImage.createFromDataURL(item.content) : nativeImage.createEmpty())
      if (!img.isEmpty()) clipboard.writeImage(img)
    } else {
      clipboard.writeText(item.content)
    }
    lastClipboardContent = item.content
    lastImageBitmapKey = ''

    // Move item to top of history (update timestamp)
    moveItemToTop(item.id)

    hideMainWindow()

    // Activate the previous app and simulate Cmd+V
    activateAndPaste(previousApp)
  })

  ipcMain.handle('paste-plain', (_, itemId: unknown) => {
    const item = getItemById(itemId)
    if (!item) return
    // Paste as plain text. Most clipboard content we capture is already plain text,
    // but we keep this handler for explicit "paste without formatting" requests.
    const plainText = item.type === 'image' ? '[Image]' : item.content
    clipboard.writeText(plainText)
    lastClipboardContent = plainText
    lastImageBitmapKey = '' // writeText cleared any image on the pasteboard

    // Move item to top of history (update timestamp)
    moveItemToTop(item.id)

    hideMainWindow()

    // Activate the previous app and simulate Cmd+V
    activateAndPaste(previousApp)
  })

  ipcMain.handle('copy-only', (_, itemId: unknown) => {
    const item = getItemById(itemId)
    if (!item) return
    // Copy to clipboard without auto-pasting
    if (item.type === 'image') {
      const img = item.metadata.imagePath
        ? nativeImage.createFromPath(item.metadata.imagePath)
        : (item.content.startsWith('data:') ? nativeImage.createFromDataURL(item.content) : nativeImage.createEmpty())
      if (!img.isEmpty()) clipboard.writeImage(img)
    } else {
      clipboard.writeText(item.content)
    }
    lastClipboardContent = item.content
    lastImageBitmapKey = ''

    // Move item to top of history (update timestamp)
    moveItemToTop(item.id)

    hideMainWindow()
    // No auto-paste - user will manually Cmd+V
  })

  // Copy text to clipboard from renderer (e.g. merge paste) while updating
  // lastClipboardContent so the poller doesn't re-capture it as a new item.
  ipcMain.handle('copy-text', (_, text: string) => {
    clipboard.writeText(text)
    lastClipboardContent = text
    lastImageBitmapKey = '' // writeText cleared any image on the pasteboard
  })

  ipcMain.handle('delete-item', (_, id: string) => {
    const toDelete = getItemById(id)
    if (!toDelete) return
    deleteImageFileForItem(toDelete)

    const history = historyCache.filter(h => h.id !== id)
    applyHistoryUpdate(history)
  })

  ipcMain.handle('toggle-pin', (_, id: string) => {
    toggleSavedItem(id)
  })

  ipcMain.handle('toggle-saved', (_, id: string) => {
    toggleSavedItem(id)
  })

  ipcMain.handle('clear-history', clearHistory)
  ipcMain.handle('hide-window', () => hideMainWindow())

  // Settings handlers
  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.handle('save-settings', (_, newSettings: Settings) => {
    const previous = getSettings()
    const clean = sanitizeSettings(newSettings)

    // Electron globalShortcut does not need Accessibility permission, but the
    // optional direct-paste flow uses System Events to simulate Cmd+V. Ask only
    // when that feature is enabled instead of alarming every user at startup.
    if (
      process.platform === 'darwin' &&
      clean.pasteDirectly &&
      !previous.pasteDirectly
    ) {
      systemPreferences.isTrustedAccessibilityClient(true)
    }

    repository.saveSettings(clean)
    invalidateSettingsCache()
    applySettings(clean)
  })

  ipcMain.handle('open-settings', (_, route: unknown) => openSettings(route === 'onboarding' ? 'onboarding' : 'settings'))
  ipcMain.handle('close-settings', () => settingsWindow?.close())
  ipcMain.handle('quit-app', () => app.quit())

  // Export history as JSON
  ipcMain.handle('export-history', async () => {
    const history = historyCache
    const result = await dialog.showSaveDialog({
      title: 'Export Clipboard History',
      defaultPath: `clipboard-history-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (!result.canceled && result.filePath) {
      const fs = await import('fs')
      fs.writeFileSync(result.filePath, JSON.stringify({
        schemaVersion: 1,
        history,
        collections: repository.collections
      }, null, 2))
      return { success: true, path: result.filePath }
    }
    return { success: false }
  })

  // Import history from JSON
  ipcMain.handle('import-history', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Clipboard History',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const fs = await import('fs')
        const data = fs.readFileSync(result.filePaths[0], 'utf8')
        const parsed = JSON.parse(data)
        const parsedHistory = Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === 'object' && Array.isArray(parsed.history)
            ? parsed.history
            : null
        if (!parsedHistory) return { success: false, error: 'Invalid JSON file' }
        const settings = getSettings()

        const importedCollections: Collection[] = parsed && typeof parsed === 'object' && Array.isArray(parsed.collections)
          ? (parsed.collections as unknown[])
            .map(validateImportedCollection)
            .filter((collection): collection is Collection => collection !== null)
          : []
        const nextCollections = [...repository.collections]
        for (const collection of importedCollections) {
          if (nextCollections.some(existing => existing.id === collection.id || existing.name.toLowerCase() === collection.name.toLowerCase())) continue
          nextCollections.push(collection)
        }
        if (!nextCollections.some(collection => collection.id === DEFAULT_SAVED_COLLECTION_ID) && parsedHistory.some((raw: any) => raw?.pinned === true || typeof raw?.savedAt === 'number')) {
          nextCollections.push(createDefaultSavedCollection())
        }
        repository.saveCollections(nextCollections)
        const knownCollectionIds = new Set(nextCollections.map(collection => collection.id))

        // Validate every entry; drop malformed/untrusted items. Dedupe by content
        // against existing history and within the imported batch.
        const existingContents = new Set(historyCache.map(h => h.content))
        const seen = new Set<string>()
        const newItems: ClipboardItem[] = []
        for (const raw of parsedHistory) {
          const item = validateImportedItem(raw, settings)
          if (!item) continue
          if (existingContents.has(item.content) || seen.has(item.content)) continue
          item.collectionIds = item.collectionIds?.filter(id => knownCollectionIds.has(id))
          seen.add(item.content)
          newItems.push(item)
        }

        const merged = limitHistory([...historyCache, ...newItems], settings.historyLimit)
        applyHistoryUpdate(merged)
        notifyCollectionsUpdated()
        return { success: true, count: newItems.length }
      } catch (e) {
        return { success: false, error: 'Invalid JSON file' }
      }
    }
    return { success: false }
  })

  console.log('All handlers registered')
})

app.on('will-quit', () => {
  // Flush any pending debounced history write so data isn't lost on quit
  if (pendingHistorySave) {
    clearTimeout(pendingHistorySave)
    pendingHistorySave = null
    repository.saveHistory(historyCache)
  }

  const settings = getSettings()

  // Clear history on quit if enabled
  if (settings.clearOnQuit) {
    for (const item of historyCache) deleteImageFileForItem(item)
    historyCache = []
    repository.saveHistory([])
    console.log('History cleared on quit')
  }

  globalShortcut.unregisterAll()
  if (clipboardPollInterval) clearInterval(clipboardPollInterval)
})

// This is a menu-bar agent. Electron's `window-all-closed` event no longer
// exposes a cancellable event object; simply leaving the listener empty keeps
// the process alive while the tray remains available.
app.on('window-all-closed', () => {})
