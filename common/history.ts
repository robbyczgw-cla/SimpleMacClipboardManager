import type { ClipboardItem } from './types'

export interface CaptureOptions {
  historyLimit: number
  ignoreDuplicates: boolean
}

/** Saved/Shelf items are durable even when the Recent history limit is reached. */
export function isItemSaved(item: ClipboardItem): boolean {
  return item.pinned === true || typeof item.savedAt === 'number'
}

export function compareItems(a: ClipboardItem, b: ClipboardItem): number {
  if (isItemSaved(a) !== isItemSaved(b)) return isItemSaved(a) ? -1 : 1
  if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * Apply the canonical history ordering and the configured retention limit
 * without mutating the caller's array.
 */
export function limitHistory(history: ClipboardItem[], historyLimit: number): ClipboardItem[] {
  const limit = Number.isFinite(historyLimit) ? Math.max(1, Math.floor(historyLimit)) : 1
  const ordered = [...history].sort(compareItems)
  const saved = ordered.filter(isItemSaved)
  const recent = ordered.filter(item => !isItemSaved(item)).slice(0, limit)
  return [...saved, ...recent]
}

function isSameContent(a: ClipboardItem, b: ClipboardItem): boolean {
  if (a.type === 'image' || b.type === 'image') {
    return (
      a.type === 'image' &&
      b.type === 'image' &&
      !!a.metadata.imageKey &&
      a.metadata.imageKey === b.metadata.imageKey
    )
  }
  return a.content === b.content
}

export function addCapturedItem(
  history: ClipboardItem[],
  captured: ClipboardItem,
  options: CaptureOptions
): ClipboardItem[] {
  let nextItem = captured
  let remaining = history

  if (options.ignoreDuplicates) {
    const existing = history.find(item => isSameContent(item, captured))
    if (existing) {
      nextItem = {
        ...captured,
        id: existing.id,
        pinned: existing.pinned,
        savedAt: existing.savedAt,
        collectionIds: existing.collectionIds,
        tags: existing.tags,
        metadata: { ...existing.metadata, ...captured.metadata }
      }
      remaining = history.filter(item => item.id !== existing.id)
    }
  }

  return limitHistory([nextItem, ...remaining], options.historyLimit)
}
