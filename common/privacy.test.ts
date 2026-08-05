import { describe, expect, it } from 'vitest'
import type { ClipboardItem } from './types'
import { matchesIgnoredApplication, pruneHistory } from './privacy'

const item = (id: string, createdAt: number, savedAt?: number): ClipboardItem => ({
  id,
  type: 'text',
  content: id,
  metadata: {},
  createdAt,
  searchText: id,
  savedAt,
  pinned: savedAt !== undefined
})

describe('privacy controls', () => {
  it('matches bundle IDs and exact display-name fallbacks', () => {
    expect(matchesIgnoredApplication({ name: '1Password', bundleId: 'com.agilebits.onepassword' }, ['com.agilebits.onepassword'])).toBe(true)
    expect(matchesIgnoredApplication({ name: 'Visual Studio Code', bundleId: 'com.microsoft.VSCode' }, ['Visual Studio Code'])).toBe(true)
    expect(matchesIgnoredApplication({ name: 'Xcode', bundleId: 'com.apple.dt.Xcode' }, ['Code'])).toBe(false)
  })

  it('does not expire Saved items', () => {
    const result = pruneHistory([
      item('old-recent', 1),
      item('old-saved', 1, 1),
      item('new-recent', 90_000_000)
    ], 1, 172_800_000)

    expect(result.map(entry => entry.id)).toEqual(['old-saved', 'new-recent'])
  })

  it('leaves history unchanged when retention is Never', () => {
    const history = [item('one', 1)]
    expect(pruneHistory(history, 0, 999_999_999)).toBe(history)
  })
})
