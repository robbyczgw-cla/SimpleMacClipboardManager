import type {
  ActionId,
  ContentKind,
  RecipeDefinition,
  TransformResult
} from './types'

export interface ActionDefinition {
  id: ActionId
  label: string
  description: string
  supportedKinds: ContentKind[]
}

export const ACTION_DEFINITIONS: ActionDefinition[] = [
  {
    id: 'trim',
    label: 'Trim',
    description: 'Remove whitespace at the beginning and end.',
    supportedKinds: ['text', 'json', 'url']
  },
  {
    id: 'normalize-whitespace',
    label: 'Normalize whitespace',
    description: 'Collapse repeated whitespace into single spaces.',
    supportedKinds: ['text']
  },
  {
    id: 'uppercase',
    label: 'UPPERCASE',
    description: 'Convert all letters to uppercase.',
    supportedKinds: ['text']
  },
  {
    id: 'lowercase',
    label: 'lowercase',
    description: 'Convert all letters to lowercase.',
    supportedKinds: ['text']
  },
  {
    id: 'title-case',
    label: 'Title Case',
    description: 'Capitalize the first letter of each word.',
    supportedKinds: ['text']
  },
  {
    id: 'slugify',
    label: 'Slugify',
    description: 'Create a clean, lowercase, hyphen-separated value.',
    supportedKinds: ['text']
  },
  {
    id: 'json-pretty',
    label: 'Pretty JSON',
    description: 'Validate and format JSON with two-space indentation.',
    supportedKinds: ['json']
  },
  {
    id: 'json-minify',
    label: 'Minify JSON',
    description: 'Validate JSON and remove unnecessary whitespace.',
    supportedKinds: ['json']
  },
  {
    id: 'clean-url',
    label: 'Clean URL',
    description: 'Remove common marketing and click-tracking parameters.',
    supportedKinds: ['url']
  }
]

export const BUILTIN_RECIPES: RecipeDefinition[] = [
  {
    id: 'clean-text',
    label: 'Clean Text',
    description: 'Trim and normalize whitespace.',
    supportedKinds: ['text'],
    steps: ['trim', 'normalize-whitespace']
  },
  {
    id: 'clean-url',
    label: 'Clean URL',
    description: 'Trim the URL and remove tracking parameters.',
    supportedKinds: ['url'],
    steps: ['trim', 'clean-url']
  }
]

const TRACKING_PARAMETERS = new Set([
  'gclid',
  'dclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'vero_conv',
  'vero_id'
])

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidJson(value: string): boolean {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export function detectKind(value: string): ContentKind {
  const trimmed = value.trim()
  if (isHttpUrl(trimmed)) return 'url'
  if (isValidJson(trimmed)) return 'json'
  return 'text'
}

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function titleCase(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/(^|[\s\-_])([\p{L}\p{N}])/gu, (_match, separator: string, character: string) => {
      return `${separator}${character.toLocaleUpperCase()}`
    })
}

export function cleanUrl(value: string): string {
  const url = new URL(value.trim())
  const keysToDelete = [...url.searchParams.keys()].filter((key) => {
    const normalized = key.toLowerCase()
    return normalized.startsWith('utm_') || TRACKING_PARAMETERS.has(normalized)
  })

  for (const key of keysToDelete) {
    url.searchParams.delete(key)
  }

  return url.toString()
}

function ensureSupported(actionId: ActionId, input: string): void {
  const definition = ACTION_DEFINITIONS.find((action) => action.id === actionId)
  if (!definition) {
    throw new Error(`Unknown action: ${actionId}`)
  }

  const kind = detectKind(input)
  if (!definition.supportedKinds.includes(kind)) {
    throw new Error(`${definition.label} is not available for ${kind} content.`)
  }
}

export function executeAction(actionId: ActionId, input: string): string {
  ensureSupported(actionId, input)

  switch (actionId) {
    case 'trim':
      return input.trim()
    case 'normalize-whitespace':
      return normalizeWhitespace(input)
    case 'uppercase':
      return input.toLocaleUpperCase()
    case 'lowercase':
      return input.toLocaleLowerCase()
    case 'title-case':
      return titleCase(input)
    case 'slugify':
      return slugify(input)
    case 'json-pretty':
      return JSON.stringify(JSON.parse(input), null, 2)
    case 'json-minify':
      return JSON.stringify(JSON.parse(input))
    case 'clean-url':
      return cleanUrl(input)
  }
}

export function executeRecipe(recipe: RecipeDefinition, input: string): string {
  const kind = detectKind(input)
  if (!recipe.supportedKinds.includes(kind)) {
    throw new Error(`${recipe.label} is not available for ${kind} content.`)
  }

  return recipe.steps.reduce((current, actionId) => executeAction(actionId, current), input)
}

export function runSafely(operation: () => string): TransformResult {
  try {
    return { ok: true, output: operation() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transformation failed.'
    return { ok: false, error: message }
  }
}
