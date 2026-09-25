// Derived, render-time classification of text clips. Nothing here is persisted:
// the stored item type stays `text`, so detection can improve without a
// migration and old history benefits immediately.

export type TextKind = 'plain' | 'code' | 'json' | 'email' | 'phone'

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i
// Digits with the usual separators; at least 7 digits so dates/prices don't match.
const PHONE = /^\+?[\d\s()./-]{7,24}$/
const MAX_JSON_PARSE = 200_000

const CODE_SIGNALS: RegExp[] = [
  /^\s*(import|export|from|const|let|var|function|class|def|return|if|for|while|public|private|fn|func|package|#include|using)\b/m,
  /[{};]\s*$/m,
  /=>|===|!==|\|\||&&|::|->/,
  /^\s{2,}\S/m,
  /\b\w+\([^)]*\)\s*[{;]?\s*$/m,
  /^\s*(<\/?[a-z][\w-]*[^>]*>)/im,
  /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\s/im,
  /^\s*[$#]\s?\w+/m
]

export function detectTextKind(content: string): TextKind {
  const trimmed = content.trim()
  if (!trimmed) return 'plain'

  if (!trimmed.includes('\n')) {
    if (EMAIL.test(trimmed)) return 'email'
    if (PHONE.test(trimmed) && (trimmed.match(/\d/g) || []).length >= 7) return 'phone'
  }

  const first = trimmed[0]
  if ((first === '{' || first === '[') && trimmed.length <= MAX_JSON_PARSE) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed !== null && typeof parsed === 'object') return 'json'
    } catch {
      // not JSON — fall through to the code heuristic
    }
  }

  // Code needs several independent signals; prose with a semicolon or an
  // indented quote shouldn't flip into monospace.
  const hits = CODE_SIGNALS.reduce((count, signal) => count + (signal.test(trimmed) ? 1 : 0), 0)
  const lines = trimmed.split('\n').length
  if (hits >= 3 || (hits >= 2 && lines >= 2)) return 'code'
  return 'plain'
}

export function formatJson(content: string, indent = 2): string | null {
  try {
    return JSON.stringify(JSON.parse(content.trim()), null, indent)
  } catch {
    return null
  }
}

export function phoneDigits(content: string): string {
  const trimmed = content.trim()
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, '')
}

export interface TextStats {
  characters: number
  words: number
  lines: number
}

export function textStats(content: string): TextStats {
  const trimmed = content.trim()
  return {
    characters: [...content].length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: content ? content.split('\n').length : 0
  }
}

/** Collapse runs of blank lines and leading indentation noise for card previews. */
export function compactPreview(content: string): string {
  return content.replace(/^\s*\n/, '').replace(/\n\s*\n+/g, '\n').trimEnd()
}

export type HighlightRange = [start: number, end: number]

/**
 * Character ranges in `text` that match `query`, for highlighting. Mirrors the
 * fuzzy matcher: every case-insensitive substring occurrence if there is one,
 * otherwise the in-order subsequence positions (merged into runs).
 */
export function matchRanges(query: string, text: string, maxRanges = 50): HighlightRange[] {
  const q = query.trim().toLowerCase()
  if (!q || !text) return []
  const lower = text.toLowerCase()
  // toLowerCase can change length for a few scripts; offsets would drift.
  if (lower.length !== text.length) return []

  const ranges: HighlightRange[] = []
  let from = lower.indexOf(q)
  if (from !== -1) {
    while (from !== -1 && ranges.length < maxRanges) {
      ranges.push([from, from + q.length])
      from = lower.indexOf(q, from + q.length)
    }
    return ranges
  }

  let ti = 0
  for (const ch of q) {
    const found = lower.indexOf(ch, ti)
    if (found === -1) return []
    const last = ranges[ranges.length - 1]
    if (last && last[1] === found) last[1] = found + 1
    else ranges.push([found, found + 1])
    ti = found + 1
  }
  return ranges.slice(0, maxRanges)
}

/**
 * When the first match sits beyond what a clamped card can show, start the
 * preview a little before it so the hit is visible. Returns the offset to cut.
 */
export function snippetStart(ranges: HighlightRange[], visibleChars: number): number {
  if (ranges.length === 0) return 0
  const first = ranges[0][0]
  if (first < visibleChars * 0.6) return 0
  const start = Math.max(0, first - Math.floor(visibleChars * 0.25))
  return start
}
