import type {
  ClipboardPayload,
  RecipeRequest,
  TransformRequest,
  TransformResult
} from '../shared/types'

declare global {
  interface Window {
    dropforge: {
      transform(request: TransformRequest): Promise<TransformResult>
      runRecipe(request: RecipeRequest): Promise<TransformResult>
      readClipboard(): Promise<ClipboardPayload>
      copyText(value: string): Promise<boolean>
      hide(): Promise<void>
      onNewWorkspace(listener: () => void): () => void
    }
  }
}

export {}
