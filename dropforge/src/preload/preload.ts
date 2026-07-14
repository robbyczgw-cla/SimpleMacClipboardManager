import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type {
  ClipboardPayload,
  ImageTransformRequest,
  ImageTransformResult,
  RecipeRequest,
  TransformRequest,
  TransformResult,
  WorkspaceMetadata,
  WorkspaceResult
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
  getWorkspace: (): Promise<WorkspaceResult> =>
    ipcRenderer.invoke('dropforge:workspace-get'),
  newWorkspace: (): Promise<WorkspaceResult> =>
    ipcRenderer.invoke('dropforge:workspace-new'),
  clearWorkspaceStorage: (): Promise<WorkspaceResult> =>
    ipcRenderer.invoke('dropforge:workspace-clear'),
  showWorkspaceFolder: (): Promise<boolean> =>
    ipcRenderer.invoke('dropforge:workspace-show-folder'),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  importImagePaths: (paths: string[]): Promise<WorkspaceResult> =>
    ipcRenderer.invoke('dropforge:image-import-paths', paths),
  importClipboardImage: (): Promise<WorkspaceResult> =>
    ipcRenderer.invoke('dropforge:image-import-clipboard'),
  transformImage: (request: ImageTransformRequest): Promise<ImageTransformResult> =>
    ipcRenderer.invoke('dropforge:image-transform', request),
  revealOutput: (outputId: string): Promise<boolean> =>
    ipcRenderer.invoke('dropforge:output-reveal', outputId),
  openOutput: (outputId: string): Promise<boolean> =>
    ipcRenderer.invoke('dropforge:output-open', outputId),
  copyOutputPath: (outputId: string): Promise<boolean> =>
    ipcRenderer.invoke('dropforge:output-copy-path', outputId),
  hide: (): Promise<void> => ipcRenderer.invoke('dropforge:hide'),
  onWorkspaceUpdated: (listener: (workspace: WorkspaceMetadata) => void): (() => void) => {
    const wrapped = (_event: Electron.IpcRendererEvent, workspace: WorkspaceMetadata): void =>
      listener(workspace)
    ipcRenderer.on('dropforge:workspace-updated', wrapped)
    return () => ipcRenderer.removeListener('dropforge:workspace-updated', wrapped)
  }
}

contextBridge.exposeInMainWorld('dropforge', api)
