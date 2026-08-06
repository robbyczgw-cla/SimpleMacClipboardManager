import { createHash } from 'node:crypto'

/**
 * Return a stable image identity for a decoded bitmap.
 *
 * Dimensions alone are not content identity: two screenshots can have the
 * same size and different pixels. The bitmap digest is deliberately computed
 * from decoded pixels so PNG/JPEG container differences do not create false
 * duplicates.
 */
export function getBitmapFingerprint(width: number, height: number, bitmap: Uint8Array): string {
  const digest = createHash('sha256').update(bitmap).digest('hex')
  return `${width}x${height}:${digest}`
}
