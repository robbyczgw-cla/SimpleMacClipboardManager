/**
 * IDs cross the renderer/main boundary as untrusted strings. UUIDs are the
 * normal source, but the validator also accepts stable imported IDs so an
 * export/import round trip does not silently rename records.
 */
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID_PATTERN.test(value)
}
