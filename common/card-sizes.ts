import type { CardSize, PanelPosition } from './types'

// Single source of truth for card geometry, shared by ClipboardPanel (which sets
// the react-window itemSize), ClipboardCard (which renders at this size) and the
// main process (which sizes the panel window). If these drift apart the rows
// overlap or the cards get clipped by the footer.
export const CARD_DIMENSIONS: Record<CardSize, {
  width: number
  height: number
  /** Height of the content area above the footer. */
  contentHeight: number
  /** Text lines that fit the content area. */
  lines: number
  /** Rough characters visible before clamping (for search snippets). */
  previewChars: number
}> = {
  small: { width: 168, height: 140, contentHeight: 88, lines: 4, previewChars: 90 },
  medium: { width: 216, height: 172, contentHeight: 120, lines: 6, previewChars: 170 },
  large: { width: 288, height: 204, contentHeight: 152, lines: 8, previewChars: 320 }
}

/** Left/right panels trade some height for full-width cards. */
export const VERTICAL_CARD_TRIM = 28

export const CARD_GAP = 12

// Vertical chrome of the horizontal panel: padding, search row, shelf row,
// list breathing room for the selection glow, and the footer.
export const PANEL_CHROME_HEIGHT = 150
export const PANEL_SIDE_WIDTH = 340

export function panelThickness(position: PanelPosition, cardSize: CardSize): number {
  if (position === 'left' || position === 'right') return PANEL_SIDE_WIDTH
  return PANEL_CHROME_HEIGHT + CARD_DIMENSIONS[cardSize].height
}
