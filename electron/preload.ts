import type { ClipboardItem, Settings } from '../common/types'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getHistory: (): Promise<ClipboardItem[]> => ipcRenderer.invoke('get-history'),
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
  openSettings: () => ipcRenderer.invoke('open-settings'),
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
