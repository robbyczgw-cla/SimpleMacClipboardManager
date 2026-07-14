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

declare global {
  interface Window {
    dropforge: {
      transform(request: TransformRequest): Promise<TransformResult>
      runRecipe(request: RecipeRequest): Promise<TransformResult>
      readClipboard(): Promise<ClipboardPayload>
      copyText(value: string): Promise<boolean>
      getWorkspace(): Promise<WorkspaceResult>
      newWorkspace(): Promise<WorkspaceResult>
      clearWorkspaceStorage(): Promise<WorkspaceResult>
      showWorkspaceFolder(): Promise<boolean>
      getPathForFile(file: File): string
      importImagePaths(paths: string[]): Promise<WorkspaceResult>
      importClipboardImage(): Promise<WorkspaceResult>
      transformImage(request: ImageTransformRequest): Promise<ImageTransformResult>
      revealOutput(outputId: string): Promise<boolean>
      openOutput(outputId: string): Promise<boolean>
      copyOutputPath(outputId: string): Promise<boolean>
      hide(): Promise<void>
      onWorkspaceUpdated(listener: (workspace: WorkspaceMetadata) => void): () => void
    }
  }
}

export {}
