import { memo, useMemo, type ReactNode } from 'react'
import { ClipboardItem, CardSize } from '../types'
import type { Translations } from '../i18n/translations'
import { CARD_DIMENSIONS, VERTICAL_CARD_TRIM } from '../cardSizes'
import { compactPreview, detectTextKind, formatJson, matchRanges, snippetStart, type HighlightRange, type TextKind } from '../../common/content'
import { useAppIcon } from '../hooks/useAppIcon'
import { Icon, TypeIcon, type IconName } from './icons'

interface ClipboardCardProps {
  item: ClipboardItem
  /** Position in the current list; also drives the ⌘1–⌘9 badge. */
  index: number
  isSelected: boolean
  isMultiSelected?: boolean
  showQuickKeys?: boolean
  searchQuery?: string
  // Stable (useCallback) handlers taking index/id, so memo() actually holds:
  // arrow-key navigation re-renders only the two cards whose selection changed.
  onSelect: (index: number) => void
  onToggleSelect: (id: string) => void
  onPaste: (item: ClipboardItem) => void
  onDelete: (id: string) => void
  onToggleSaved: (id: string) => void
  onPreview: (item: ClipboardItem) => void
  isVertical?: boolean
  cardSize?: CardSize
  now: number
  t: Translations
}

// Accent per type, applied to small glyphs only so content stays the loudest
// element on the card. Vivid values read well in both themes.
const TYPE_COLOR: Record<ClipboardItem['type'], string> = {
  text: 'var(--text-tertiary)',
  link: '#0A84FF',
  image: '#BF5AF2',
  file: '#FF9F0A',
  color: '#30D158'
}

const KIND_META: Partial<Record<TextKind, { icon: IconName; labelKey: keyof Translations }>> = {
  code: { icon: 'code', labelKey: 'kindCode' },
  json: { icon: 'braces', labelKey: 'kindJson' },
  email: { icon: 'mail', labelKey: 'kindEmail' },
  phone: { icon: 'phone', labelKey: 'kindPhone' }
}

const PREVIEW_SOURCE_LIMIT = 4000
// Long texts are only classified on their head; enough for the heuristics.
const DETECT_LIMIT = 20000

function formatTimeAgo(timestamp: number, now: number, t: Translations): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 60) return t.justNow
  if (seconds < 3600) return `${Math.floor(seconds / 60)}${t.minutesAgo}`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t.hoursAgo}`
  return `${Math.floor(seconds / 86400)}${t.daysAgo}`
}

function typeLabel(type: ClipboardItem['type'], t: Translations): string {
  switch (type) {
    case 'text': return t.text
    case 'link': return t.link
    case 'image': return t.image
    case 'file': return t.file
    case 'color': return t.color
  }
}

// Items captured before v0.15 stored the lowercased process name ("safari").
function displayAppName(name: string | undefined): string | undefined {
  if (!name) return undefined
  return name === name.toLowerCase() ? name.charAt(0).toUpperCase() + name.slice(1) : name
}

function hexToRgb(hex: string): string | null {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6)
  if (!/^[0-9a-f]{6}$/i.test(full)) return null
  const n = parseInt(full, 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

/** Renders `text` with `<mark>` around the given ranges. */
function Highlighted({ text, ranges }: { text: string; ranges: HighlightRange[] }) {
  if (ranges.length === 0) return <>{text}</>
  const parts: ReactNode[] = []
  let cursor = 0
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start))
    parts.push(<mark key={i} className="search-hit">{text.slice(start, end)}</mark>)
    cursor = end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}

/**
 * Card text plus highlight ranges for the active query. If the first hit would
 * be clipped by the line clamp, the preview starts shortly before it instead.
 */
function buildPreview(content: string, query: string, keepLines: boolean, visibleChars: number) {
  const head = content.slice(0, PREVIEW_SOURCE_LIMIT)
  const source = keepLines ? head.replace(/^\s*\n/, '').trimEnd() : compactPreview(head)
  const q = query.trim()
  if (!q) return { text: source, ranges: [] as HighlightRange[] }

  let ranges = matchRanges(q, source)
  // Scattered single-letter fuzzy hits read as noise; only highlight tidy matches.
  if (ranges.length > 3 && ranges.some(([a, b]) => b - a < q.length)) ranges = []

  if (ranges.length === 0 && content.length > PREVIEW_SOURCE_LIMIT) {
    const deep = matchRanges(q, content, 1)
    if (deep.length > 0 && deep[0][1] - deep[0][0] === q.length) {
      const from = Math.max(0, deep[0][0] - 40)
      const text = '…' + content.slice(from, from + 1200).replace(/\s+/g, ' ')
      return { text, ranges: matchRanges(q, text) }
    }
  }

  const start = snippetStart(ranges, visibleChars)
  if (start > 0) {
    const text = '…' + source.slice(start)
    return { text, ranges: ranges.map(([a, b]) => [a - start + 1, b - start + 1] as HighlightRange) }
  }
  return { text: source, ranges }
}

function ClipboardCard({
  item,
  index,
  isSelected,
  isMultiSelected = false,
  showQuickKeys = false,
  searchQuery = '',
  onSelect,
  onToggleSelect,
  onPaste,
  onDelete,
  onToggleSaved,
  onPreview,
  isVertical = false,
  cardSize = 'medium',
  now,
  t
}: ClipboardCardProps) {
  const dims = CARD_DIMENSIONS[cardSize]
  const cardHeight = isVertical ? dims.height - VERTICAL_CARD_TRIM : dims.height
  const contentHeight = isVertical ? dims.contentHeight - VERTICAL_CARD_TRIM : dims.contentHeight
  const lines = isVertical ? dims.lines - 2 : dims.lines
  const saved = item.pinned === true || item.savedAt !== undefined
  const appIcon = useAppIcon(item.metadata.sourceAppPath)
  const appName = displayAppName(item.metadata.sourceApp)

  const kind: TextKind = useMemo(
    () => (item.type === 'text' ? detectTextKind(item.content.length > DETECT_LIMIT ? item.content.slice(0, DETECT_LIMIT) : item.content) : 'plain'),
    [item.type, item.content]
  )
  const monospace = kind === 'code' || kind === 'json'

  // Minified JSON is one endless line; show it indented like an editor would.
  const displayContent = useMemo(
    () => (kind === 'json' && item.content.length <= DETECT_LIMIT ? formatJson(item.content) ?? item.content : item.content),
    [kind, item.content]
  )
  const preview = useMemo(
    () => (item.type === 'text' || item.type === 'link' ? buildPreview(displayContent, searchQuery, monospace, dims.previewChars) : null),
    [item.type, displayContent, searchQuery, monospace, dims.previewChars]
  )

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onPaste(item)
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (item.type === 'image') {
      const fileUrl = item.metadata.imagePath ? item.content : ''
      const mime = item.metadata.imageMime || 'image/png'
      const ext = mime === 'image/jpeg' ? 'jpg' : 'png'
      if (fileUrl) {
        e.dataTransfer.setData('DownloadURL', `${mime}:clipboard-image.${ext}:${fileUrl}`)
      } else {
        e.dataTransfer.setData('text/plain', item.content)
      }
    } else if (item.type === 'link') {
      e.dataTransfer.setData('text/uri-list', item.content)
      e.dataTransfer.setData('text/plain', item.content)
    } else {
      e.dataTransfer.setData('text/plain', item.content)
    }
    e.dataTransfer.effectAllowed = 'copy'
  }

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="card-media h-full w-full">
            <img src={item.thumbnail || item.content} alt={t.image} className="h-full w-full object-cover" draggable={false} />
          </div>
        )

      case 'color': {
        const hex = item.metadata.colorHex || item.content
        const rgb = hexToRgb(hex)
        return (
          <div className="flex h-full flex-col gap-2">
            <div className="card-media min-h-0 flex-1" style={{ backgroundColor: hex }} />
            <div className="flex items-baseline justify-between gap-2">
              <code className="font-mono text-[13px] font-medium text-[var(--text-primary)]">{item.content.toUpperCase()}</code>
              {rgb && cardSize !== 'small' && <span className="truncate font-mono text-[10.5px] text-[var(--text-tertiary)]">{rgb}</span>}
            </div>
          </div>
        )
      }

      case 'link': {
        let host = item.content
        let rest = ''
        try {
          const url = new URL(item.content)
          host = url.hostname.replace(/^www\./, '')
          rest = (url.pathname + url.search).replace(/^\/$/, '')
        } catch {
          // malformed URL — show it verbatim
        }
        return (
          <div className="flex h-full flex-col gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {item.metadata.favicon ? (
                <img src={item.metadata.favicon} alt="" className="h-4 w-4 shrink-0 rounded-sm" onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <Icon name="link" className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
              )}
              <span className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{host}</span>
            </div>
            <p className="clamp break-all text-[12px] leading-[1.35] text-[var(--accent)]" style={{ WebkitLineClamp: Math.max(1, lines - 2) }}>
              {preview && preview.ranges.length > 0 ? <Highlighted text={preview.text} ranges={preview.ranges} /> : rest || item.content}
            </p>
          </div>
        )
      }

      case 'file': {
        const parts = item.content.split('/')
        const name = parts.pop() || item.content
        const dir = (parts.join('/') || '/').replace(/^\/Users\/[^/]+/, '~')
        return (
          <div className="flex h-full flex-col justify-center gap-2">
            <Icon name="file" className="h-8 w-8 text-[#FF9F0A]" strokeWidth={1.4} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
              <p className="truncate text-[11px] text-[var(--text-tertiary)]" title={item.content}>{dir}</p>
            </div>
          </div>
        )
      }

      default: {
        if (kind === 'email' || kind === 'phone') {
          return (
            <div className="flex h-full flex-col justify-center gap-2">
              <Icon name={kind === 'email' ? 'mail' : 'phone'} className="h-6 w-6 text-[var(--accent)]" strokeWidth={1.5} />
              <p className="break-all text-[15px] font-medium leading-tight text-[var(--text-primary)]">
                {preview ? <Highlighted text={preview.text} ranges={preview.ranges} /> : item.content}
              </p>
            </div>
          )
        }
        if (monospace) {
          return (
            <pre className="h-full overflow-hidden whitespace-pre font-mono text-[11.5px] leading-[1.45] text-[var(--text-primary)]">
              {preview ? <Highlighted text={preview.text} ranges={preview.ranges} /> : item.content}
            </pre>
          )
        }
        return (
          <p className="clamp whitespace-pre-wrap break-words text-[13px] leading-[1.38] text-[var(--text-primary)]" style={{ WebkitLineClamp: lines }}>
            {preview ? <Highlighted text={preview.text} ranges={preview.ranges} /> : item.content}
          </p>
        )
      }
    }
  }

  const kindMeta = KIND_META[kind]
  const detail = kindMeta
    ? t[kindMeta.labelKey]
    : item.type === 'image' && item.metadata.imageWidth && item.metadata.imageHeight
      ? `${item.metadata.imageWidth}×${item.metadata.imageHeight}`
      : null

  return (
    <div
      draggable
      onClick={e => (e.shiftKey ? onToggleSelect(item.id) : onSelect(index))}
      onDoubleClick={() => onPaste(item)}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      role="option"
      aria-selected={isSelected}
      aria-label={`${typeLabel(item.type, t)}: ${item.searchText.slice(0, 80)}`}
      style={isVertical ? { height: cardHeight } : { width: dims.width, height: cardHeight }}
      className={`card group ${isVertical ? 'w-full' : ''} ${isSelected ? 'card-selected' : ''} ${isMultiSelected ? 'card-multi' : ''}`}
    >
      <div className="overflow-hidden" style={{ height: contentHeight }}>
        {renderContent()}
      </div>

      {/* Footer — source app and age, demoted so content stays primary */}
      <div className="mt-auto flex h-5 items-center justify-between gap-2 text-[10.5px] text-[var(--text-tertiary)]">
        <div className="flex min-w-0 items-center gap-1.5">
          {appIcon ? (
            <img src={appIcon} alt="" className="h-3.5 w-3.5 shrink-0" draggable={false} />
          ) : (
            <span style={{ color: TYPE_COLOR[item.type] }}>
              <TypeIcon type={item.type} className="h-3 w-3" />
            </span>
          )}
          {appName && <span className="truncate" title={appName}>{appName}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {detail && (
            <span className="kind-chip">
              {kindMeta && <Icon name={kindMeta.icon} className="h-2.5 w-2.5" strokeWidth={2} />}
              {detail}
            </span>
          )}
          <span>{formatTimeAgo(item.createdAt, now, t)}</span>
        </div>
      </div>

      {/* ⌘1–⌘9 quick-paste badge, shown while ⌘ is held */}
      {showQuickKeys && index < 9 && <span className="quick-key">⌘{index + 1}</span>}

      {/* Saved marker stays visible; the toolbar replaces it on hover/selection */}
      {saved && (
        <span className="absolute right-2.5 top-2.5 text-[var(--warning)] transition-opacity group-hover:opacity-0" aria-hidden>
          <Icon name="star" filled className="h-3.5 w-3.5" />
        </span>
      )}

      {/* Mouse affordances only; keyboard users have ⌘S / ⌘⌫ / Space (see footer). */}
      <div className="card-toolbar opacity-0 group-hover:opacity-100">
        {item.type === 'link' && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              window.electronAPI.openExternal(item.content)
            }}
            className="icon-btn"
            title={t.openInBrowser}
            aria-label={t.openInBrowser}
          >
            <Icon name="open" className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onPreview(item)
          }}
          className="icon-btn"
          title={t.preview}
          aria-label={t.preview}
        >
          <Icon name="eye" className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleSaved(item.id)
          }}
          className={`icon-btn ${saved ? '!text-[var(--warning)]' : ''}`}
          title={saved ? t.unsave : t.save}
          aria-label={saved ? t.unsave : t.save}
        >
          <Icon name="star" filled={saved} className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          className="icon-btn hover:!text-[var(--danger)]"
          title={t.delete}
          aria-label={t.delete}
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
        </button>
      </div>

      {isMultiSelected && (
        <span className="multi-badge" aria-hidden>
          <Icon name="check" className="h-2.5 w-2.5" />
        </span>
      )}
    </div>
  )
}

// Memoized: only re-render a card when its own props change, not on every App
// re-render (e.g. the copied toast). The list passes stable-per-data callbacks.
export default memo(ClipboardCard)
