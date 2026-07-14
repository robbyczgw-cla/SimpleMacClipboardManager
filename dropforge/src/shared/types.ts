export type ContentKind = 'text' | 'json' | 'url'

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
