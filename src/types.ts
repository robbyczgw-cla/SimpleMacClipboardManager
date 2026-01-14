export interface ClipboardItem {
  id: string
  type: 'text' | 'image' | 'link' | 'file' | 'color'
  content: string
  thumbnail?: string
  metadata: {
    app?: string
    url?: string
    fileName?: string
    colorHex?: string
    sourceApp?: string
  }
  createdAt: number
  searchText: string
  pinned?: boolean
}

export type PanelPosition = 'bottom' | 'top' | 'left' | 'right'
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh'

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
  panelPosition: PanelPosition
  language: Language
}

export interface ElectronAPI {
  getHistory: () => Promise<ClipboardItem[]>
  pasteItem: (item: ClipboardItem) => Promise<void>
  pastePlain: (item: ClipboardItem) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  hideWindow: () => Promise<void>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<void>
  openSettings: () => Promise<void>
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
