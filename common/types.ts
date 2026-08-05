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
  /** Content fingerprint (dimensions + SHA-256 bitmap digest) used to dedupe images. */
  imageKey?: string
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
  /** Timestamp at which the user deliberately saved this item to the Shelf. */
  savedAt?: number
  /** IDs of user/system collections containing this item. */
  collectionIds?: string[]
  /** User-defined search labels reserved for the Shelf workflow. */
  tags?: string[]
  /** Legacy v0 flag; migrations and the UI treat it as saved state. */
  pinned?: boolean
}

export interface Collection {
  id: string
  name: string
  icon?: string
  createdAt: number
  updatedAt: number
  sortOrder: number
  system?: boolean
}

export interface StoreState {
  schemaVersion: number
  history: ClipboardItem[]
  collections: Collection[]
  settings: Settings
}

export type PanelPosition = 'bottom' | 'top' | 'left' | 'right'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh'
export type CardSize = 'small' | 'medium' | 'large'
export type RetentionDays = 0 | 1 | 7 | 30
export type PauseCaptureDuration = 'indefinite' | 5 | 30

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
  /** Number of days to retain unsaved Recent items; 0 means never expire. */
  retentionDays: RetentionDays
  /** App names or bundle identifiers that should never be captured. */
  ignoredApplications: string[]
}

export interface CaptureStatus {
  paused: boolean
  pausedUntil: number | null
}

export interface ElectronAPI {
  getHistory: () => Promise<ClipboardItem[]>
  getCaptureStatus: () => Promise<CaptureStatus>
  pauseCapture: (duration: PauseCaptureDuration) => Promise<void>
  resumeCapture: () => Promise<void>
  getCollections: () => Promise<Collection[]>
  createCollection: (name: string) => Promise<Collection | null>
  renameCollection: (id: string, name: string) => Promise<boolean>
  deleteCollection: (id: string) => Promise<boolean>
  assignItemsToCollection: (itemIds: string[], collectionId: string) => Promise<void>
  removeItemFromCollection: (itemId: string, collectionId: string) => Promise<void>
  pasteItem: (itemId: string) => Promise<void>
  pastePlain: (itemId: string) => Promise<void>
  copyOnly: (itemId: string) => Promise<void>
  copyText: (text: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  toggleSaved: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  hideWindow: () => Promise<void>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  openSettings: () => Promise<void>
  quitApp: () => Promise<void>
  exportHistory: () => Promise<{ success: boolean; path?: string }>
  importHistory: () => Promise<{ success: boolean; count?: number; error?: string }>
  openExternal: (url: string) => Promise<{ success: boolean }>
  /** Create (or return) a temp file path for an image item (used for drag & drop). */
  getImageDragPath?: (itemId: string) => Promise<{ success: boolean; path?: string; mime?: string; filename?: string }>

  onHistoryUpdated: (callback: (history: ClipboardItem[]) => void) => () => void
  onCaptureStatusUpdated: (callback: (status: CaptureStatus) => void) => () => void
  onCollectionsUpdated: (callback: (collections: Collection[]) => void) => () => void
  onPanelShown: (callback: () => void) => () => void
  onPanelHidden: (callback: () => void) => () => void
  onOpenSettings: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
