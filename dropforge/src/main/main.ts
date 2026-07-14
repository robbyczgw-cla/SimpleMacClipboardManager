import path from 'node:path'
import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Tray
} from 'electron'
import { z } from 'zod'
import { BUILTIN_RECIPES, executeAction, executeRecipe, runSafely } from '../shared/actions'
import type { ActionId, ClipboardPayload, TransformResult } from '../shared/types'

const DEFAULT_SHORTCUT = 'Alt+CommandOrControl+Space'
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAm0lEQVR4nO2W0RHAIAhDbfffuV2gV14ieuqRbwwRA9JaoXAYLiH2mZHvhkQZYhAPEZQlBvHRCk1DCYpABCmdSPDLRyuUJSrkcRI5XYfzOB5SLyHFb2nqL9Bby5Y4pkLD0CMoeg5rVLjzRWn94V2mziEpXhXkriL43Pamdj2Hz9HAzK2x+7dfaoXNFhPybmfq7G0x5F1uhS0UjsML81UQNWO7emUAAAAASUVORK5CYII='

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const actionIds = [
  'trim',
  'normalize-whitespace',
  'uppercase',
  'lowercase',
  'title-case',
  'slugify',
  'json-pretty',
  'json-minify',
  'clean-url'
] as const satisfies readonly ActionId[]

const transformRequestSchema = z.object({
  actionId: z.enum(actionIds),
  input: z.string().max(2_000_000)
})

const recipeRequestSchema = z.object({
  recipeId: z.string().min(1).max(100),
  input: z.string().max(2_000_000)
})

function showWindow(): void {
  if (!mainWindow) return
  if (process.platform === 'darwin') app.focus({ steal: true })
  mainWindow.show()
  mainWindow.focus()
}

function hideWindow(): void {
  mainWindow?.hide()
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 860,
    height: 600,
    minWidth: 720,
    minHeight: 500,
    show: false,
    frame: false,
    transparent: process.platform === 'darwin',
    backgroundColor: process.platform === 'darwin' ? '#00000000' : '#151519',
    alwaysOnTop: true,
    skipTaskbar: true,
    titleBarStyle: 'hidden',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      window.hide()
    }
  })

  window.once('ready-to-show', () => showWindow())

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  return window
}

function createTray(): Tray {
  const image = nativeImage.createFromBuffer(Buffer.from(TRAY_ICON_BASE64, 'base64'))
  image.setTemplateImage(true)

  const nextTray = new Tray(image.resize({ width: 18, height: 18 }))
  nextTray.setToolTip('DropForge')
  nextTray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open DropForge', click: showWindow },
      {
        label: 'New Workspace',
        click: () => {
          showWindow()
          mainWindow?.webContents.send('dropforge:workspace-new')
        }
      },
      { type: 'separator' },
      { label: 'Quit DropForge', click: () => app.quit() }
    ])
  )
  nextTray.on('click', showWindow)
  return nextTray
}

function registerIpc(): void {
  ipcMain.handle('dropforge:transform', (_event, payload: unknown): TransformResult => {
    const parsed = transformRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return { ok: false, error: 'Invalid transformation request.' }
    }

    return runSafely(() => executeAction(parsed.data.actionId, parsed.data.input))
  })

  ipcMain.handle('dropforge:recipe', (_event, payload: unknown): TransformResult => {
    const parsed = recipeRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return { ok: false, error: 'Invalid recipe request.' }
    }

    const recipe = BUILTIN_RECIPES.find((candidate) => candidate.id === parsed.data.recipeId)
    if (!recipe) return { ok: false, error: 'Unknown recipe.' }

    return runSafely(() => executeRecipe(recipe, parsed.data.input))
  })

  ipcMain.handle('dropforge:read-clipboard', (): ClipboardPayload => {
    const value = clipboard.readText()
    return value ? { kind: 'text', value } : { kind: 'empty', value: '' }
  })

  ipcMain.handle('dropforge:copy-text', (_event, value: unknown): boolean => {
    if (typeof value !== 'string' || value.length > 2_000_000) return false
    clipboard.writeText(value)
    return true
  })

  ipcMain.handle('dropforge:hide', () => hideWindow())
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock?.hide()

  registerIpc()
  mainWindow = createMainWindow()
  tray = createTray()

  const registered = globalShortcut.register(DEFAULT_SHORTCUT, () => {
    if (mainWindow?.isVisible()) hideWindow()
    else showWindow()
  })

  if (!registered) {
    console.error(`Could not register global shortcut: ${DEFAULT_SHORTCUT}`)
  }

  app.on('activate', showWindow)
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  tray?.destroy()
})
