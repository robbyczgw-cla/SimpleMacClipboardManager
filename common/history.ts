import type { ClipboardItem } from './types'

export interface CaptureOptions {
  historyLimit: number
  ignoreDuplicates: boolean
}

export function compareItems(a: ClipboardItem, b: ClipboardItem): number {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
  if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * Apply the canonical history ordering and the configured retention limit
 * without mutating the caller's array.
 */
export function limitHistory(history: ClipboardItem[], historyLimit: number): ClipboardItem[] {
  const limit = Number.isFinite(historyLimit) ? Math.max(1, Math.floor(historyLimit)) : 1
  return [...history]
    .sort(compareItems)
    .slice(0, limit)
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
        metadata: { ...existing.metadata, ...captured.metadata }
      }
      remaining = history.filter(item => item.id !== existing.id)
    }
  }

  return limitHistory([nextItem, ...remaining], options.historyLimit)
}
