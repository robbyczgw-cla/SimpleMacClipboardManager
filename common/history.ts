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

  return [nextItem, ...remaining]
    .sort(compareItems)
    .slice(0, Math.max(1, options.historyLimit))
}
