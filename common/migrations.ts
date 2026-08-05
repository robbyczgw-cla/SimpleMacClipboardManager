import type { ClipboardItem, ClipboardItemMetadata, Collection, Settings, StoreState } from './types'
import { isSafeId } from './ids'

export const CURRENT_SCHEMA_VERSION = 1
export const DEFAULT_SAVED_COLLECTION_ID = 'system-saved'
export const DEFAULT_SAVED_COLLECTION_NAME = 'Saved'

interface RecordLike {
  [key: string]: unknown
}

function isRecord(value: unknown): value is RecordLike {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0).slice(0, 100)
}

function normalizeMetadata(value: unknown): ClipboardItemMetadata {
  if (!isRecord(value)) return {}
  return {
    url: typeof value.url === 'string' ? value.url : undefined,
    fileName: typeof value.fileName === 'string' ? value.fileName : undefined,
    colorHex: typeof value.colorHex === 'string' ? value.colorHex : undefined,
    sourceApp: typeof value.sourceApp === 'string' ? value.sourceApp : undefined,
    favicon: typeof value.favicon === 'string' ? value.favicon : undefined,
    title: typeof value.title === 'string' ? value.title : undefined,
    imagePath: typeof value.imagePath === 'string' ? value.imagePath : undefined,
    imageMime: typeof value.imageMime === 'string' ? value.imageMime : undefined,
    imageKey: typeof value.imageKey === 'string' ? value.imageKey : undefined
  }
}

function normalizeItem(value: unknown, now: number): ClipboardItem | null {
  if (!isRecord(value)) return null
  if (!isSafeId(value.id)) return null
  if (typeof value.content !== 'string') return null

  const createdAt = finiteNumber(value.createdAt, now)
  const pinned = value.pinned === true
  const savedAt = typeof value.savedAt === 'number' && Number.isFinite(value.savedAt)
    ? value.savedAt
    : pinned ? createdAt : undefined
  const collectionIds = stringArray(value.collectionIds)
  if (savedAt !== undefined && !collectionIds.includes(DEFAULT_SAVED_COLLECTION_ID)) {
    collectionIds.unshift(DEFAULT_SAVED_COLLECTION_ID)
  }

  return {
    id: value.id,
    type: typeof value.type === 'string' ? value.type as ClipboardItem['type'] : 'text',
    content: value.content,
    thumbnail: typeof value.thumbnail === 'string' ? value.thumbnail : undefined,
    metadata: normalizeMetadata(value.metadata),
    createdAt,
    searchText: typeof value.searchText === 'string' && value.searchText.length > 0
      ? value.searchText
      : value.content.slice(0, 5000).toLowerCase(),
    savedAt,
    collectionIds,
    tags: stringArray(value.tags),
    pinned
  }
}

function normalizeCollection(value: unknown, now: number): Collection | null {
  if (!isRecord(value)) return null
  if (!isSafeId(value.id)) return null
  if (typeof value.name !== 'string' || value.name.trim().length === 0) return null
  const createdAt = finiteNumber(value.createdAt, now)
  return {
    id: value.id,
    name: value.name.trim().slice(0, 120),
    icon: typeof value.icon === 'string' ? value.icon : undefined,
    createdAt,
    updatedAt: finiteNumber(value.updatedAt, createdAt),
    sortOrder: finiteNumber(value.sortOrder, 0),
    system: value.system === true
  }
}

export function createDefaultSavedCollection(now = Date.now()): Collection {
  return {
    id: DEFAULT_SAVED_COLLECTION_ID,
    name: DEFAULT_SAVED_COLLECTION_NAME,
    createdAt: now,
    updatedAt: now,
    sortOrder: 0,
    system: true
  }
}

export interface MigrationResult {
  state: StoreState
  changed: boolean
}

/**
 * Normalize the legacy electron-store shape into the versioned v1 state.
 *
 * The migration is deliberately pure so it can be tested without Electron or
 * filesystem access. The main process is responsible for backing up the store
 * before persisting a changed result.
 */
export function migrateStoreState(
  raw: unknown,
  fallbackSettings: Settings,
  now = Date.now()
): MigrationResult {
  const record = isRecord(raw) ? raw : {}
  const history = Array.isArray(record.history)
    ? record.history.map(value => normalizeItem(value, now)).filter((item): item is ClipboardItem => item !== null)
    : []
  const collections = Array.isArray(record.collections)
    ? record.collections.map(value => normalizeCollection(value, now)).filter((collection): collection is Collection => collection !== null)
    : []
  const rawSettings = isRecord(record.settings) ? record.settings : {}
  const onboardingCompleted = typeof rawSettings.onboardingCompleted === 'boolean'
    ? rawSettings.onboardingCompleted
    : record.schemaVersion === undefined
      ? true
      : fallbackSettings.onboardingCompleted

  if (history.some(item => item.savedAt !== undefined) && !collections.some(collection => collection.id === DEFAULT_SAVED_COLLECTION_ID)) {
    collections.unshift(createDefaultSavedCollection(now))
  }

  const state: StoreState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    history,
    collections,
    settings: {
      ...fallbackSettings,
      ...rawSettings,
      onboardingCompleted
    } as Settings
  }
  const changed = JSON.stringify(state) !== JSON.stringify(raw)
  return { state, changed }
}
