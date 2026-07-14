import path from 'node:path'
import {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray
} from 'electron'
import { z } from 'zod'
import { BUILTIN_RECIPES, executeAction, executeRecipe, runSafely } from '../shared/actions'
import type {
  ActionId,
  ClipboardPayload,
  ImageActionId,
  ImageTransformResult,
  TransformResult,
  WorkspaceResult
} from '../shared/types'
import { WorkspaceService } from './workspace'

const DEFAULT_SHORTCUT = 'Alt+CommandOrControl+Space'
const TRAY_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAm0lEQVR4nO2W0RHAIAhDbfffuV2gV14ieuqRbwwRA9JaoXAYLiH2mZHvhkQZYhAPEZQlBvHRCk1DCYpABCmdSPDLRyuUJSrkcRI5XYfzOB5SLyHFb2nqL9Bby5Y4pkLD0CMoeg5rVLjzRWn94V2mziEpXhXkriL43Pamdj2Hz9HAzK2x+7dfaoXNFhPybmfq7G0x5F1uhS0UjsML81UQNWO7emUAAAAASUVORK5CYII='

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let workspaceService: WorkspaceService | null = null

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

const imageActionIds = [
  'resize-image',
  'convert-webp',
  'compress-image',
  'strip-metadata',
  'shop-image'
] as const satisfies readonly ImageActionId[]

const transformRequestSchema = z.object({
  actionId: z.enum(actionIds),
  input: z.string().max(2_000_000)
})

const recipeRequestSchema = z.object({
  recipeId: z.string().min(1).max(100),
  input: z.string().max(2_000_000)
})

const imageImportSchema = z.array(z.string().min(1).max(4096)).min(1).max(50)
const imageTransformSchema = z.object({
  itemId: z.string().uuid(),
  actionId: z.enum(imageActionIds),
  options: z
    .object({
      maxWidth: z.number().int().min(64).max(10_000).optional(),
      maxHeight: z.number().int().min(64).max(10_000).optional(),
      quality: z.number().int().min(1).max(100).optional()
    })
    .optional()
})
const outputIdSchema = z.string().uuid()

function getWorkspaceService(): WorkspaceService {
  if (!workspaceService) throw new Error('Workspace service is not ready.')
  return workspaceService
}

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
    width: 920,
    height: 680,
    minWidth: 760,
    minHeight: 540,
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

async function createAndBroadcastWorkspace(): Promise<void> {
  const workspace = await getWorkspaceService().createWorkspace()
  mainWindow?.webContents.send('dropforge:workspace-updated', workspace)
  showWindow()
}

function createTray(): Tray {
  const image = nativeImage.createFromBuffer(Buffer.from(TRAY_ICON_BASE64, 'base64'))
  image.setTemplateImage(true)

  const nextTray = new Tray(image.resize({ width: 18, height: 18 }))
  nextTray.setToolTip('DropForge')
  nextTray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open DropForge', click: showWindow },
      { label: 'New Workspace', click: () => void createAndBroadcastWorkspace() },
      {
        label: 'Show DropForge Folder',
        click: () => void shell.openPath(getWorkspaceService().getRootDirectory())
      },
      {
        label: 'Clear Temporary Files',
        click: async () => {
          const workspace = await getWorkspaceService().clearTemporaryFiles()
          mainWindow?.webContents.send('dropforge:workspace-updated', workspace)
        }
      },
      { type: 'separator' },
      { label: 'Quit DropForge', click: () => app.quit() }
    ])
  )
  nextTray.on('click', showWindow)
  return nextTray
}

function workspaceFailure(error: unknown): WorkspaceResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : 'Workspace operation failed.'
  }
}

function registerIpc(): void {
  ipcMain.handle('dropforge:transform', (_event, payload: unknown): TransformResult => {
    const parsed = transformRequestSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: 'Invalid transformation request.' }
    return runSafely(() => executeAction(parsed.data.actionId, parsed.data.input))
  })

  ipcMain.handle('dropforge:recipe', (_event, payload: unknown): TransformResult => {
    const parsed = recipeRequestSchema.safeParse(payload)
    if (!parsed.success) return { ok: false, error: 'Invalid recipe request.' }

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

  ipcMain.handle('dropforge:workspace-get', async (): Promise<WorkspaceResult> => {
    try {
      return { ok: true, workspace: await getWorkspaceService().getActiveWorkspace() }
    } catch (error) {
      return workspaceFailure(error)
    }
  })

  ipcMain.handle('dropforge:workspace-new', async (): Promise<WorkspaceResult> => {
    try {
      return { ok: true, workspace: await getWorkspaceService().createWorkspace() }
    } catch (error) {
      return workspaceFailure(error)
    }
  })

  ipcMain.handle(
    'dropforge:image-import-paths',
    async (_event, payload: unknown): Promise<WorkspaceResult> => {
      const parsed = imageImportSchema.safeParse(payload)
      if (!parsed.success) return { ok: false, error: 'Invalid image import request.' }
      try {
        return {
          ok: true,
          workspace: await getWorkspaceService().importImagePaths(parsed.data)
        }
      } catch (error) {
        return workspaceFailure(error)
      }
    }
  )

  ipcMain.handle('dropforge:image-import-clipboard', async (): Promise<WorkspaceResult> => {
    try {
      const image = clipboard.readImage()
      if (image.isEmpty()) return { ok: false, error: 'The clipboard does not contain an image.' }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      await getWorkspaceService().importImageBuffer(
        image.toPNG(),
        `clipboard-${timestamp}.png`
      )
      return { ok: true, workspace: await getWorkspaceService().getActiveWorkspace() }
    } catch (error) {
      return workspaceFailure(error)
    }
  })

  ipcMain.handle(
    'dropforge:image-transform',
    async (_event, payload: unknown): Promise<ImageTransformResult> => {
      const parsed = imageTransformSchema.safeParse(payload)
      if (!parsed.success) return { ok: false, error: 'Invalid image transformation request.' }
      try {
        const result = await getWorkspaceService().transformImage(
          parsed.data.itemId,
          parsed.data.actionId,
          parsed.data.options
        )
        return { ok: true, ...result }
      } catch (error) {
        return workspaceFailure(error)
      }
    }
  )

  ipcMain.handle('dropforge:output-reveal', (_event, payload: unknown): boolean => {
    const parsed = outputIdSchema.safeParse(payload)
    if (!parsed.success) return false
    shell.showItemInFolder(getWorkspaceService().getOutputPath(parsed.data))
    return true
  })

  ipcMain.handle('dropforge:output-open', async (_event, payload: unknown): Promise<boolean> => {
    const parsed = outputIdSchema.safeParse(payload)
    if (!parsed.success) return false
    return (await shell.openPath(getWorkspaceService().getOutputPath(parsed.data))) === ''
  })

  ipcMain.handle('dropforge:output-copy-path', (_event, payload: unknown): boolean => {
    const parsed = outputIdSchema.safeParse(payload)
    if (!parsed.success) return false
    clipboard.writeText(getWorkspaceService().getOutputPath(parsed.data))
    return true
  })

  ipcMain.handle('dropforge:workspace-show-folder', async (): Promise<boolean> => {
    return (await shell.openPath(getWorkspaceService().getRootDirectory())) === ''
  })

  ipcMain.handle('dropforge:workspace-clear', async (): Promise<WorkspaceResult> => {
    try {
      return { ok: true, workspace: await getWorkspaceService().clearTemporaryFiles() }
    } catch (error) {
      return workspaceFailure(error)
    }
  })

  ipcMain.handle('dropforge:hide', () => hideWindow())
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin') app.dock?.hide()

  workspaceService = new WorkspaceService(path.join(app.getPath('userData'), 'workspaces'))
  await workspaceService.initialize()
  registerIpc()
  mainWindow = createMainWindow()
  tray = createTray()

  const registered = globalShortcut.register(DEFAULT_SHORTCUT, () => {
    if (mainWindow?.isVisible()) hideWindow()
    else showWindow()
  })

  if (!registered) console.error(`Could not register global shortcut: ${DEFAULT_SHORTCUT}`)
  app.on('activate', showWindow)
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  tray?.destroy()
})
