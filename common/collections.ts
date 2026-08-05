import type { ClipboardItem } from './types'
import { DEFAULT_SAVED_COLLECTION_ID } from './migrations'

export function addItemToCollection(item: ClipboardItem, collectionId: string, now = Date.now()): ClipboardItem {
  const collectionIds = new Set(item.collectionIds || [])
  collectionIds.add(collectionId)
  collectionIds.add(DEFAULT_SAVED_COLLECTION_ID)
  return {
    ...item,
    pinned: true,
    savedAt: item.savedAt ?? now,
    collectionIds: [...collectionIds]
  }
}

export function removeItemFromCollection(item: ClipboardItem, collectionId: string): ClipboardItem {
  const collectionIds = (item.collectionIds || []).filter(id => id !== collectionId)
  if (collectionId === DEFAULT_SAVED_COLLECTION_ID) {
    return { ...item, pinned: false, savedAt: undefined, collectionIds }
  }
  return { ...item, collectionIds }
}
