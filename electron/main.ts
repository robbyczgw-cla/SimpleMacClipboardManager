import { app, BrowserWindow, globalShortcut, ipcMain, clipboard, nativeImage, screen, Tray, Menu } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ClipboardItem {
  id: string
  type: 'text' | 'image' | 'link' | 'file' | 'color'
  content: string
  thumbnail?: string
  metadata: {
    url?: string
    colorHex?: string
  }
  createdAt: number
  searchText: string
}

interface Settings {
  historyLimit: number
  pollingInterval: number
  launchAtLogin: boolean
  clearOnQuit: boolean
  showInDock: boolean
  hotkey: string
}

const defaultSettings: Settings = {
  historyLimit: 500,
  pollingInterval: 500,
  launchAtLogin: false,
  clearOnQuit: false,
  showInDock: false,
  hotkey: 'CommandOrControl+Shift+V'
}

const store = new Store<{ history: ClipboardItem[], settings: Settings }>({
  defaults: {
    history: [],
    settings: defaultSettings
  }
})

let mainWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null
let tray: Tray | null = null
let lastClipboardContent = ''
let clipboardPollInterval: ReturnType<typeof setInterval> | null = null

function getSettings(): Settings {
  return store.get('settings') || defaultSettings
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const panelHeight = 300

  mainWindow = new BrowserWindow({
    width: width,
    height: panelHeight,
    x: 0,
    y: height - panelHeight,
    frame: false,
    transparent: false,
    backgroundColor: '#1e1e1e',
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
      mainWindow.hide()
    }
  })
}

function createTray() {
  const iconPath = join(__dirname, '../assets/trayTemplate.png')
  console.log('Loading tray icon from:', iconPath)

  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  if (icon.isEmpty()) {
    console.error('Failed to load tray icon, using fallback')
    const fallback = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKElEQVQ4T2NkYGD4z0ABYBw1gGE0DBhGwwBkGDCMpgOG0XQAMiwAADfgAhFk8e4kAAAAAElFTkSuQmCC'
    )
    tray = new Tray(fallback)
  } else {
    tray = new Tray(icon)
  }
  tray.setToolTip('PasteAlt')

  updateTrayMenu()
  tray.on('click', toggleWindow)

  console.log('Tray icon created')
}

function updateTrayMenu() {
  if (!tray) return

  const menu = Menu.buildFromTemplate([
    { label: 'Show Clipboard (⌘⇧V)', click: () => toggleWindow() },
    { type: 'separator' },
    { label: 'Settings...', click: () => openSettings() },
    { type: 'separator' },
    { label: 'Clear History', click: () => clearHistory() },
    { type: 'separator' },
    { label: 'Quit PasteAlt', click: () => app.quit() }
  ])

  tray.setContextMenu(menu)
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 420,
    title: 'MacClipManager Settings',
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

  const url = process.env.VITE_DEV_SERVER_URL
  if (url) {
    settingsWindow.loadURL(url + '#settings')
  } else {
    settingsWindow.loadFile(join(__dirname, '../dist/index.html'), { hash: 'settings' })
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

function toggleWindow() {
  if (!mainWindow) return

  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    const { height } = screen.getPrimaryDisplay().workAreaSize
    mainWindow.setPosition(0, height - 300)
    mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('panel-shown')
  }
}

function clearHistory() {
  store.set('history', [])
  mainWindow?.webContents.send('history-updated', [])
}

function detectContentType(text: string): ClipboardItem['type'] {
  const trimmed = text.trim()
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) return 'color'
  if (/^https?:\/\/\S+$/.test(trimmed)) return 'link'
  if (/^(\/|~\/|[A-Z]:\\)/.test(trimmed)) return 'file'
  return 'text'
}

function startClipboardPolling() {
  const settings = getSettings()

  if (clipboardPollInterval) {
    clearInterval(clipboardPollInterval)
  }

  lastClipboardContent = clipboard.readText() || ''
  clipboardPollInterval = setInterval(pollClipboard, settings.pollingInterval)
  console.log('Clipboard polling started with interval:', settings.pollingInterval)
}

function pollClipboard() {
  try {
    const settings = getSettings()
    const text = clipboard.readText()

    if (text && text !== lastClipboardContent) {
      lastClipboardContent = text
      const type = detectContentType(text)

      const item: ClipboardItem = {
        id: uuidv4(),
        type,
        content: text,
        metadata: {
          url: type === 'link' ? text : undefined,
          colorHex: type === 'color' ? text : undefined
        },
        createdAt: Date.now(),
        searchText: text.toLowerCase()
      }

      const history = store.get('history')
      const filtered = history.filter(h => h.content !== text)
      const updated = [item, ...filtered].slice(0, settings.historyLimit)
      store.set('history', updated)
      mainWindow?.webContents.send('history-updated', updated)
    }
  } catch (e) {
    // Ignore clipboard errors
  }
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
}

app.whenReady().then(() => {
  console.log('App ready, creating window and tray...')

  const settings = getSettings()

  // Apply initial settings
  if (!settings.showInDock) {
    app.dock?.hide()
  }

  app.setLoginItemSettings({
    openAtLogin: settings.launchAtLogin,
    openAsHidden: true
  })

  createWindow()
  createTray()
  startClipboardPolling()

  // Register hotkey
  const registered = globalShortcut.register(settings.hotkey, toggleWindow)
  console.log('Hotkey registered:', registered)

  // IPC handlers
  ipcMain.handle('get-history', () => store.get('history'))

  ipcMain.handle('paste-item', (_, item: ClipboardItem) => {
    clipboard.writeText(item.content)
    lastClipboardContent = item.content
    mainWindow?.hide()
  })

  ipcMain.handle('delete-item', (_, id: string) => {
    const history = store.get('history').filter(h => h.id !== id)
    store.set('history', history)
    mainWindow?.webContents.send('history-updated', history)
  })

  ipcMain.handle('clear-history', clearHistory)
  ipcMain.handle('hide-window', () => mainWindow?.hide())

  // Settings handlers
  ipcMain.handle('get-settings', () => getSettings())

  ipcMain.handle('save-settings', (_, newSettings: Settings) => {
    store.set('settings', newSettings)
    applySettings(newSettings)
    console.log('Settings saved:', newSettings)
  })

  ipcMain.handle('open-settings', openSettings)

  console.log('All handlers registered')
})

app.on('will-quit', () => {
  const settings = getSettings()

  // Clear history on quit if enabled
  if (settings.clearOnQuit) {
    store.set('history', [])
    console.log('History cleared on quit')
  }

  globalShortcut.unregisterAll()
  if (clipboardPollInterval) clearInterval(clipboardPollInterval)
})

app.on('window-all-closed', (e: Event) => {
  e.preventDefault() // Keep app running
})
