import { describe, expect, it } from 'vitest'
import { getBitmapFingerprint } from './image-fingerprint'

describe('getBitmapFingerprint', () => {
  it('distinguishes different pixels with identical dimensions', () => {
    expect(getBitmapFingerprint(2, 2, Uint8Array.from([0, 1, 2, 3])))
      .not.toBe(getBitmapFingerprint(2, 2, Uint8Array.from([0, 1, 2, 4])))
  })

  it('is stable for the same decoded bitmap', () => {
    const bitmap = Uint8Array.from([10, 20, 30, 40])
    expect(getBitmapFingerprint(1, 4, bitmap)).toBe(getBitmapFingerprint(1, 4, bitmap))
  })
})
