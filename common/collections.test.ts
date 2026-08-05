import { describe, expect, it } from 'vitest'
import type { ClipboardItem } from './types'
import { addItemToCollection, removeItemFromCollection } from './collections'
import { DEFAULT_SAVED_COLLECTION_ID } from './migrations'

const item: ClipboardItem = {
  id: 'item-1',
  type: 'text',
  content: 'hello',
  metadata: {},
  createdAt: 1,
  searchText: 'hello',
  pinned: false,
  collectionIds: []
}

describe('collection item semantics', () => {
  it('saves an item and adds the default Saved collection', () => {
    const result = addItemToCollection(item, 'project-a', 20)

    expect(result.savedAt).toBe(20)
    expect(result.pinned).toBe(true)
    expect(result.collectionIds).toEqual(['project-a', DEFAULT_SAVED_COLLECTION_ID])
  })

  it('removing a custom collection keeps the item saved', () => {
    const saved = addItemToCollection(item, 'project-a', 20)
    const result = removeItemFromCollection(saved, 'project-a')

    expect(result.savedAt).toBe(20)
    expect(result.collectionIds).toEqual([DEFAULT_SAVED_COLLECTION_ID])
  })

  it('removing the system Saved collection returns the item to Recent', () => {
    const saved = addItemToCollection(item, 'project-a', 20)
    const result = removeItemFromCollection(saved, DEFAULT_SAVED_COLLECTION_ID)

    expect(result.savedAt).toBeUndefined()
    expect(result.pinned).toBe(false)
    expect(result.collectionIds).toEqual(['project-a'])
  })
})
