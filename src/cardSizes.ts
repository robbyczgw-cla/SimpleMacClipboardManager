import type { CardSize } from './types'

// Single source of truth for card geometry, shared by ClipboardPanel (which sets
// the react-window itemSize) and ClipboardCard (which renders at this size). If
// these ever drift apart the virtualized rows overlap or leave gaps, so they
// MUST come from one place.
export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number; contentHeight: number }> = {
  small: { width: 160, height: 140, contentHeight: 72 },
  medium: { width: 208, height: 176, contentHeight: 96 },
  large: { width: 280, height: 200, contentHeight: 120 }
}

export const CARD_GAP = 12
