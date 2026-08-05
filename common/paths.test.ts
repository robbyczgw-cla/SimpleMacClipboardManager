import { describe, expect, it } from 'vitest'
import { isPathWithinDirectory } from './paths'

describe('isPathWithinDirectory', () => {
  const managed = '/tmp/clipshelf/images'

  it('accepts descendants of the managed directory', () => {
    expect(isPathWithinDirectory('/tmp/clipshelf/images/item.png', managed)).toBe(true)
  })

  it('rejects the directory itself and sibling prefixes', () => {
    expect(isPathWithinDirectory(managed, managed)).toBe(false)
    expect(isPathWithinDirectory('/tmp/clipshelf/images-old/item.png', managed)).toBe(false)
  })

  it('rejects traversal outside the managed directory', () => {
    expect(isPathWithinDirectory('/tmp/clipshelf/images/../secrets.txt', managed)).toBe(false)
  })
})
