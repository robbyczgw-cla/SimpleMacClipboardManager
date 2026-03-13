export type ClipboardItemType = 'text' | 'image' | 'link' | 'file' | 'color'

export interface ClipboardItemMetadata {
  url?: string
  fileName?: string
  colorHex?: string
  sourceApp?: string
  favicon?: string
  title?: string
  /** Absolute path to image on disk (when image storage is file-based). */
  imagePath?: string
  imageMime?: string
}

export interface ClipboardItem {
  id: string
  type: ClipboardItemType
  content: string
  /** Small data URL thumbnail (kept in store for fast UI list rendering). */
  thumbnail?: string
  metadata: ClipboardItemMetadata
  createdAt: number
  searchText: string
  pinned?: boolean
}

export type PanelPosition = 'bottom' | 'top' | 'left' | 'right'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh'
export type CardSize = 'small' | 'medium' | 'large'

export interface Settings {
  historyLimit: number
  pollingInterval: number
  launchAtLogin: boolean
  clearOnQuit: boolean
  showInDock: boolean
  hotkey: string
  playSoundOnCopy: boolean
  ignoreDuplicates: boolean
  ignorePasswordManagers: boolean
  ignoredPasteboardTypes: string[]
  panelPosition: PanelPosition
  language: Language
  pasteDirectly: boolean
  cardSize: CardSize
  loadFavicons: boolean
  /** Max image size to persist (bytes). Larger images will be downscaled. */
  maxImageBytes: number
}

export interface ElectronAPI {
  getHistory: () => Promise<ClipboardItem[]>
  pasteItem: (item: ClipboardItem) => Promise<void>
  pastePlain: (item: ClipboardItem) => Promise<void>
  copyOnly: (item: ClipboardItem) => Promise<void>
  copyText: (text: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  hideWindow: () => Promise<void>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  openSettings: () => Promise<void>
  exportHistory: () => Promise<{ success: boolean; path?: string }>
  importHistory: () => Promise<{ success: boolean; count?: number; error?: string }>
  openExternal: (url: string) => Promise<{ success: boolean }>
  /** Create (or return) a temp file path for an image item (used for drag & drop). */
  getImageDragPath?: (item: ClipboardItem) => Promise<{ success: boolean; path?: string; mime?: string; filename?: string }>

  onHistoryUpdated: (callback: (history: ClipboardItem[]) => void) => () => void
  onPanelShown: (callback: () => void) => () => void
  onPanelHidden: (callback: () => void) => () => void
  onOpenSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
