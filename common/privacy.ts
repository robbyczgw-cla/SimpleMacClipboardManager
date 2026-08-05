import type { ClipboardItem, RetentionDays } from './types'
import { isItemSaved } from './history'

export interface ApplicationIdentity {
  name: string
  bundleId?: string
}

/** Match exact bundle IDs or exact display names entered by the user. */
export function matchesIgnoredApplication(
  identity: ApplicationIdentity,
  exclusions: string[]
): boolean {
  const candidates = [identity.bundleId, identity.name]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(value => value.trim().toLowerCase())
  return exclusions.some(exclusion => {
    const normalized = exclusion.trim().toLowerCase()
    return normalized.length > 0 && candidates.includes(normalized)
  })
}

/** Keep Saved items while expiring only unsaved Recent items. */
export function pruneHistory(
  history: ClipboardItem[],
  retentionDays: RetentionDays,
  now = Date.now()
): ClipboardItem[] {
  if (retentionDays === 0) return history
  const cutoff = now - retentionDays * 24 * 60 * 60 * 1000
  return history.filter(item => isItemSaved(item) || item.createdAt >= cutoff)
}
