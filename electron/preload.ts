import type { ClipboardItem, Settings } from '../common/types'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: (): Promise<ClipboardItem[]> => ipcRenderer.invoke('get-history'),
  pasteItem: (item: ClipboardItem): Promise<void> => ipcRenderer.invoke('paste-item', item),
  pastePlain: (item: ClipboardItem): Promise<void> => ipcRenderer.invoke('paste-plain', item),
  copyOnly: (item: ClipboardItem): Promise<void> => ipcRenderer.invoke('copy-only', item),
  deleteItem: (id: string): Promise<void> => ipcRenderer.invoke('delete-item', id),
  togglePin: (id: string): Promise<void> => ipcRenderer.invoke('toggle-pin', id),
  clearHistory: (): Promise<void> => ipcRenderer.invoke('clear-history'),
  hideWindow: (): Promise<void> => ipcRenderer.invoke('hide-window'),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  exportHistory: () => ipcRenderer.invoke('export-history'),
  importHistory: () => ipcRenderer.invoke('import-history'),

  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getImageDragPath: (item: ClipboardItem) => ipcRenderer.invoke('get-image-drag-path', item),

  onHistoryUpdated: (callback: (history: ClipboardItem[]) => void) => {
    const handler = (_: any, history: ClipboardItem[]) => callback(history)
    ipcRenderer.on('history-updated', handler)
    return () => ipcRenderer.removeListener('history-updated', handler)
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
