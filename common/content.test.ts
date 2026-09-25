import { describe, expect, it } from 'vitest'
import { compactPreview, detectTextKind, formatJson, matchRanges, phoneDigits, snippetStart, textStats } from './content'

describe('detectTextKind', () => {
  it('recognises single-line emails and phone numbers', () => {
    expect(detectTextKind('jane.doe@example.com')).toBe('email')
    expect(detectTextKind('+43 1 234 56 78')).toBe('phone')
    expect(detectTextKind('(0664) 123-4567')).toBe('phone')
  })

  it('does not treat short numbers, dates or prices as phone numbers', () => {
    expect(detectTextKind('2026')).toBe('plain')
    expect(detectTextKind('1.299,00')).toBe('plain')
  })

  it('recognises JSON objects and arrays but not scalars', () => {
    expect(detectTextKind('{"a": 1, "b": [2, 3]}')).toBe('json')
    expect(detectTextKind('[1, 2, 3]')).toBe('json')
    expect(detectTextKind('{not json}')).not.toBe('json')
  })

  it('recognises code with several signals', () => {
    expect(detectTextKind('const result = await api.get()\nsetHistory(result.filter(i => !i.pinned));')).toBe('code')
    expect(detectTextKind('def main():\n    return 42')).toBe('code')
  })

  it('keeps ordinary prose plain', () => {
    expect(detectTextKind('Hello Jane,\n\nthe quote is attached; delivery takes about two weeks.')).toBe('plain')
    expect(detectTextKind('Delivery in 2–3 weeks, pickup is possible.')).toBe('plain')
  })
})

describe('matchRanges', () => {
  it('returns every substring occurrence case-insensitively', () => {
    expect(matchRanges('ab', 'xAbyab')).toEqual([[1, 3], [4, 6]])
  })

  it('falls back to merged subsequence runs', () => {
    expect(matchRanges('hwd', 'hello world')).toEqual([[0, 1], [6, 7], [10, 11]])
    expect(matchRanges('wor', 'hello world')).toEqual([[6, 9]])
  })

  it('returns nothing when the query does not match', () => {
    expect(matchRanges('zz', 'hello')).toEqual([])
    expect(matchRanges('   ', 'hello')).toEqual([])
  })
})

describe('helpers', () => {
  it('formats JSON or returns null', () => {
    expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatJson('nope')).toBeNull()
  })

  it('strips phone formatting but keeps a leading plus', () => {
    expect(phoneDigits('+43 (1) 234-56 78')).toBe('+4312345678')
  })

  it('counts characters, words and lines', () => {
    expect(textStats('one two\nthree')).toEqual({ characters: 13, words: 3, lines: 2 })
    expect(textStats('')).toEqual({ characters: 0, words: 0, lines: 0 })
  })

  it('collapses blank lines for previews', () => {
    expect(compactPreview('\n\nHallo,\n\n\nanbei\n')).toBe('Hallo,\nanbei')
  })

  it('moves the snippet only when the hit would be clipped', () => {
    expect(snippetStart([[10, 12]], 200)).toBe(0)
    expect(snippetStart([[500, 505]], 200)).toBe(450)
  })
})
