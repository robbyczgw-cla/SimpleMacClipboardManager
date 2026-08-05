import { describe, expect, it } from 'vitest'
import { isSafeId } from './ids'

describe('isSafeId', () => {
  it('accepts UUID-like and imported stable identifiers', () => {
    expect(isSafeId('4f2c4d2b-4de7-4e7c-9f4f-clip')).toBe(true)
    expect(isSafeId('legacy_item_01')).toBe(true)
  })

  it('rejects empty, oversized and control-containing values', () => {
    expect(isSafeId('')).toBe(false)
    expect(isSafeId('bad id')).toBe(false)
    expect(isSafeId('a'.repeat(129))).toBe(false)
    expect(isSafeId('../outside')).toBe(false)
  })
})
