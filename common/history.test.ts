import { describe, expect, it } from 'vitest'
import type { ClipboardItem } from './types'
import { addCapturedItem, limitHistory } from './history'

function item(
  id: string,
  content: string,
  createdAt: number,
  overrides: Partial<ClipboardItem> = {}
): ClipboardItem {
  return {
    id,
    type: 'text',
    content,
    metadata: {},
    createdAt,
    searchText: content.toLowerCase(),
    pinned: false,
    ...overrides
  }
}

describe('addCapturedItem', () => {
  it('keeps pinned items ahead of a newer unpinned capture', () => {
    const pinned = item('pinned', 'keep me', 1, { pinned: true })
    const captured = item('new', 'new value', 2)

    expect(addCapturedItem([pinned], captured, {
      historyLimit: 10,
      ignoreDuplicates: true
    }).map(entry => entry.id)).toEqual(['pinned', 'new'])
  })

  it('preserves pin and identity when recapturing duplicate content', () => {
    const pinned = item('original', 'same value', 1, {
      pinned: true,
      metadata: { sourceApp: 'old app' }
    })
    const captured = item('replacement', 'same value', 2, {
      metadata: { sourceApp: 'new app' }
    })

    const [result] = addCapturedItem([pinned], captured, {
      historyLimit: 10,
      ignoreDuplicates: true
    })

    expect(result.id).toBe('original')
    expect(result.pinned).toBe(true)
    expect(result.metadata.sourceApp).toBe('new app')
  })

  it('allows duplicate entries when duplicate suppression is disabled', () => {
    const existing = item('first', 'same value', 1)
    const captured = item('second', 'same value', 2)

    expect(addCapturedItem([existing], captured, {
      historyLimit: 10,
      ignoreDuplicates: false
    }).map(entry => entry.id)).toEqual(['second', 'first'])
  })

  it('matches image duplicates by fingerprint rather than file URL', () => {
    const existing = item('first', 'file:///old.png', 1, {
      type: 'image',
      pinned: true,
      metadata: { imageKey: '100x100:abc', imagePath: '/old.png' }
    })
    const captured = item('second', 'file:///new.png', 2, {
      type: 'image',
      metadata: { imageKey: '100x100:abc', imagePath: '/new.png' }
    })

    const [result] = addCapturedItem([existing], captured, {
      historyLimit: 10,
      ignoreDuplicates: true
    })

    expect(result.id).toBe('first')
    expect(result.pinned).toBe(true)
    expect(result.metadata.imagePath).toBe('/new.png')
  })

  it('enforces the configured history limit after ordering', () => {
    const history = [item('one', 'one', 1), item('two', 'two', 2)]
    const captured = item('three', 'three', 3)

    expect(addCapturedItem(history, captured, {
      historyLimit: 2,
      ignoreDuplicates: true
    }).map(entry => entry.id)).toEqual(['three', 'two'])
  })

  it('uses the stable id tie-breaker when timestamps are equal', () => {
    const sameTime = [
      item('z-item', 'z', 100),
      item('a-item', 'a', 100)
    ]

    expect(limitHistory(sameTime, 10).map(entry => entry.id)).toEqual(['a-item', 'z-item'])
    expect(sameTime.map(entry => entry.id)).toEqual(['z-item', 'a-item'])
  })

  it('keeps a pinned item and retains the configured number of recent items', () => {
    const pinned = item('saved', 'keep me', 1, { pinned: true })
    const captured = item('new', 'new value', 2)

    expect(addCapturedItem([pinned], captured, {
      historyLimit: 1,
      ignoreDuplicates: true
    }).map(entry => entry.id)).toEqual(['saved', 'new'])
  })

  it('retains saved items outside the recent history limit', () => {
    const saved = item('saved', 'keep forever', 1, { savedAt: 1, pinned: false })
    const recent = [item('newest', 'newest', 3), item('older', 'older', 2)]

    expect(limitHistory([saved, ...recent], 1).map(entry => entry.id))
      .toEqual(['saved', 'newest'])
  })

  it('preserves saved state and collection membership on duplicate capture', () => {
    const existing = item('original', 'same', 1, {
      savedAt: 1,
      collectionIds: ['system-saved', 'project-a'],
      tags: ['important']
    })
    const captured = item('replacement', 'same', 2)

    const [result] = addCapturedItem([existing], captured, {
      historyLimit: 1,
      ignoreDuplicates: true
    })

    expect(result.id).toBe('original')
    expect(result.savedAt).toBe(1)
    expect(result.collectionIds).toEqual(['system-saved', 'project-a'])
    expect(result.tags).toEqual(['important'])
  })
})
