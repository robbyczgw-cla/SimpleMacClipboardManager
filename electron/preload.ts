import type { CaptureStatus, ClipboardItem, Collection, PauseCaptureDuration, Settings } from '../common/types'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: (): Promise<ClipboardItem[]> => ipcRenderer.invoke('get-history'),
  getCaptureStatus: (): Promise<CaptureStatus> => ipcRenderer.invoke('get-capture-status'),
  pauseCapture: (duration: PauseCaptureDuration): Promise<void> => ipcRenderer.invoke('pause-capture', duration),
  resumeCapture: (): Promise<void> => ipcRenderer.invoke('resume-capture'),
  getCollections: (): Promise<Collection[]> => ipcRenderer.invoke('get-collections'),
  createCollection: (name: string): Promise<Collection | null> => ipcRenderer.invoke('create-collection', name),
  renameCollection: (id: string, name: string): Promise<boolean> => ipcRenderer.invoke('rename-collection', id, name),
  deleteCollection: (id: string): Promise<boolean> => ipcRenderer.invoke('delete-collection', id),
  assignItemsToCollection: (itemIds: string[], collectionId: string): Promise<void> => ipcRenderer.invoke('assign-items-to-collection', itemIds, collectionId),
  removeItemFromCollection: (itemId: string, collectionId: string): Promise<void> => ipcRenderer.invoke('remove-item-from-collection', itemId, collectionId),
  pasteItem: (itemId: string): Promise<void> => ipcRenderer.invoke('paste-item', itemId),
  pastePlain: (itemId: string): Promise<void> => ipcRenderer.invoke('paste-plain', itemId),
  copyOnly: (itemId: string): Promise<void> => ipcRenderer.invoke('copy-only', itemId),
  deleteItem: (id: string): Promise<void> => ipcRenderer.invoke('delete-item', id),
  togglePin: (id: string): Promise<void> => ipcRenderer.invoke('toggle-pin', id),
  toggleSaved: (id: string): Promise<void> => ipcRenderer.invoke('toggle-saved', id),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('clear-history'),
  hideWindow: (): Promise<void> => ipcRenderer.invoke('hide-window'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: (route?: 'settings' | 'onboarding') => ipcRenderer.invoke('open-settings', route),
  closeSettings: (): Promise<void> => ipcRenderer.invoke('close-settings'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  exportHistory: () => ipcRenderer.invoke('export-history'),
  importHistory: () => ipcRenderer.invoke('import-history'),

  copyText: (text: string): Promise<void> => ipcRenderer.invoke('copy-text', text),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getImageDragPath: (itemId: string) => ipcRenderer.invoke('get-image-drag-path', itemId),

  onHistoryUpdated: (callback: (history: ClipboardItem[]) => void) => {
    const handler = (_: any, history: ClipboardItem[]) => callback(history)
    ipcRenderer.on('history-updated', handler)
    return () => ipcRenderer.removeListener('history-updated', handler)
  },

  onCaptureStatusUpdated: (callback: (status: CaptureStatus) => void) => {
    const handler = (_: any, status: CaptureStatus) => callback(status)
    ipcRenderer.on('capture-status-updated', handler)
    return () => ipcRenderer.removeListener('capture-status-updated', handler)
  },

  onCollectionsUpdated: (callback: (collections: Collection[]) => void) => {
    const handler = (_: any, collections: Collection[]) => callback(collections)
    ipcRenderer.on('collections-updated', handler)
    return () => ipcRenderer.removeListener('collections-updated', handler)
  },

  onPanelShown: (callback: () => void) => {
    ipcRenderer.on('panel-shown', callback)
    return () => ipcRenderer.removeListener('panel-shown', callback)
  },

  onPanelHidden: (callback: () => void) => {
    ipcRenderer.on('panel-hidden', callback)
    return () => ipcRenderer.removeListener('panel-hidden', callback)
  },

  onOpenSettings: (callback: () => void) => {
    ipcRenderer.on('open-settings', callback)
    return () => ipcRenderer.removeListener('open-settings', callback)
  }
})

console.log('Preload script loaded successfully')
