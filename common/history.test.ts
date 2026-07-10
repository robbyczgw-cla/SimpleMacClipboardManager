import { describe, expect, it } from 'vitest'
import type { ClipboardItem } from './types'
import { addCapturedItem } from './history'

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
})
