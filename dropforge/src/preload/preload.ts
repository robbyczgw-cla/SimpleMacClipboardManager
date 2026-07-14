import { contextBridge, ipcRenderer } from 'electron'
import type {
  ClipboardPayload,
  RecipeRequest,
  TransformRequest,
  TransformResult
} from '../shared/types'

const api = {
  transform: (request: TransformRequest): Promise<TransformResult> =>
    ipcRenderer.invoke('dropforge:transform', request),
  runRecipe: (request: RecipeRequest): Promise<TransformResult> =>
    ipcRenderer.invoke('dropforge:recipe', request),
  readClipboard: (): Promise<ClipboardPayload> =>
    ipcRenderer.invoke('dropforge:read-clipboard'),
  copyText: (value: string): Promise<boolean> =>
    ipcRenderer.invoke('dropforge:copy-text', value),
  hide: (): Promise<void> => ipcRenderer.invoke('dropforge:hide'),
  onNewWorkspace: (listener: () => void): (() => void) => {
    const wrapped = (): void => listener()
    ipcRenderer.on('dropforge:workspace-new', wrapped)
    return () => ipcRenderer.removeListener('dropforge:workspace-new', wrapped)
  }
}

contextBridge.exposeInMainWorld('dropforge', api)
