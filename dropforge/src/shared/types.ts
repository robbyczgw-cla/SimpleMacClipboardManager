export type ContentKind = 'text' | 'json' | 'url' | 'image'

export type ActionId =
  | 'trim'
  | 'normalize-whitespace'
  | 'uppercase'
  | 'lowercase'
  | 'title-case'
  | 'slugify'
  | 'json-pretty'
  | 'json-minify'
  | 'clean-url'

export type ImageActionId =
  | 'resize-image'
  | 'convert-webp'
  | 'compress-image'
  | 'strip-metadata'
  | 'shop-image'

export interface TransformRequest {
  actionId: ActionId
  input: string
}

export interface TransformResult {
  ok: boolean
  output?: string
  error?: string
}

export interface RecipeDefinition {
  id: string
  label: string
  description: string
  supportedKinds: ContentKind[]
  steps: ActionId[]
}

export interface RecipeRequest {
  recipeId: string
  input: string
}

export interface ClipboardPayload {
  kind: 'text' | 'empty'
  value: string
}

export interface ImageTransformOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface ImageTransformRequest {
  itemId: string
  actionId: ImageActionId
  options?: ImageTransformOptions
}

export interface WorkspaceImageItem {
  id: string
  kind: 'image'
  name: string
  sourceName: string
  relativePath: string
  previewRelativePath: string
  mimeType: string
  format: string
  width: number
  height: number
  sizeBytes: number
  createdAt: string
  previewDataUrl?: string
}

export interface WorkspaceOutput {
  id: string
  sourceItemId: string
  kind: 'image'
  actionId: ImageActionId
  name: string
  relativePath: string
  previewRelativePath: string
  mimeType: string
  format: string
  width: number
  height: number
  sizeBytes: number
  createdAt: string
  previewDataUrl?: string
}

export interface WorkspaceMetadata {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: WorkspaceImageItem[]
  outputs: WorkspaceOutput[]
}

export interface WorkspaceResult {
  ok: boolean
  workspace?: WorkspaceMetadata
  error?: string
}

export interface ImageTransformResult extends WorkspaceResult {
  output?: WorkspaceOutput
}
