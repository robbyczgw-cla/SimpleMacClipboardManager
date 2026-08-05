import { memo } from 'react'
import { ClipboardItem, CardSize } from '../types'
import type { Translations } from '../i18n/translations'
import { CARD_DIMENSIONS } from '../cardSizes'
import { Icon, TypeIcon } from './icons'

interface ClipboardCardProps {
  item: ClipboardItem
  isSelected: boolean
  isMultiSelected?: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onDelete: () => void
  onCopy: () => void
  onToggleSaved: () => void
  onPreview?: () => void
  isVertical?: boolean
  cardSize?: CardSize
  t: Translations
}

// Subtle per-type accent applied to the type icon only (not a loud filled pill),
// so content stays the loudest element on the card. Vivid values read well in
// both light and dark themes.
const TYPE_COLOR: Record<ClipboardItem['type'], string> = {
  text: 'var(--text-secondary)',
  link: '#0A84FF',
  image: '#BF5AF2',
  file: '#FF9F0A',
  color: '#30D158'
}

function formatTimeAgo(timestamp: number, t: Translations): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
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

function ClipboardCard({
  item,
  isSelected,
  isMultiSelected = false,
  onClick,
  onDoubleClick,
  onDelete,
  onCopy,
  onToggleSaved,
  onPreview,
  isVertical = false,
  cardSize = 'medium',
  t
}: ClipboardCardProps) {
  const dimensions = CARD_DIMENSIONS[cardSize]
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onCopy()
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (item.type === 'image') {
      const fileUrl = item.metadata.imagePath ? item.content : ''
      const mime = item.metadata.imageMime || 'image/png'
      const ext = mime === 'image/jpeg' ? 'jpg' : 'png'
      const filename = `clipboard-image.${ext}`
      if (fileUrl) {
        e.dataTransfer.setData('DownloadURL', `${mime}:${filename}:${fileUrl}`)
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

  const lineClampClass = cardSize === 'small' ? 'line-clamp-3' : cardSize === 'large' ? 'line-clamp-6' : 'line-clamp-4'
  const imageHeight = cardSize === 'small' ? 'h-14' : cardSize === 'large' ? 'h-24' : 'h-20'
  const colorBoxSize = cardSize === 'small' ? 'w-12 h-12' : cardSize === 'large' ? 'w-20 h-20' : 'w-16 h-16'

  // Contextual action (open link / preview image), shown on hover OR when selected
  // so keyboard users get the affordance too. Positioned absolutely above the
  // footer so it never reflows the card content.
  const actionVisibility = isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className={`w-full ${imageHeight} flex items-center justify-center overflow-hidden rounded relative`}>
            <img
              src={item.thumbnail || item.content}
              alt={t.image}
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          </div>
        )

      case 'color':
        return (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`${colorBoxSize} rounded-lg border border-[var(--border-strong)] shadow-inner`}
              style={{ backgroundColor: item.metadata.colorHex || item.content }}
            />
            <code className="text-xs text-[var(--text-secondary)] font-mono">
              {item.content}
            </code>
          </div>
        )

      case 'link':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {item.metadata.favicon && (
                <img
                  src={item.metadata.favicon}
                  alt=""
                  className="w-4 h-4 flex-shrink-0"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <div className="text-[var(--accent)] text-sm truncate">
                {item.content}
              </div>
            </div>
            <div className="text-[var(--text-tertiary)] text-xs truncate">
              {(() => { try { return new URL(item.content).hostname } catch { return item.content } })()}
            </div>
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Icon name="file" className="w-6 h-6 flex-shrink-0" />
            <span className="text-sm truncate">
              {item.content.split('/').pop()}
            </span>
          </div>
        )

      default:
        return (
          <p className={`text-sm text-[var(--text-primary)] ${lineClampClass} whitespace-pre-wrap break-words leading-snug`}>
            {item.content}
          </p>
        )
    }
  }

  return (
    <div
      draggable
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      role="option"
      aria-selected={isSelected}
      aria-label={`${typeLabel(item.type, t)}: ${item.searchText.slice(0, 80)}`}
      style={isVertical ? { height: dimensions.height - 32 } : { width: dimensions.width, height: dimensions.height }}
      className={`
        relative flex-shrink-0 p-3 rounded-2xl cursor-pointer
        transition-[background,border-color,box-shadow] duration-150 ease-out
        border group
        ${isVertical ? 'w-full' : ''}
        ${isSelected
          ? 'glass-card-selected border-[var(--accent)]/50'
          : 'glass-card card-glow border-[var(--border-color)] hover:bg-[var(--card-hover)] hover:border-[var(--border-strong)]'
        }
        ${item.pinned || item.savedAt !== undefined ? 'ring-1 ring-[var(--warning)]/40' : ''}
        ${isMultiSelected ? 'ring-2 ring-[var(--multi-select)]/70' : ''}
      `}
    >
      {/* Pin button - visible on hover or when selected/pinned */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleSaved()
        }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full bg-black/25 hover:bg-[var(--warning)]/80
                   flex items-center justify-center transition-opacity
                   ${item.pinned || item.savedAt !== undefined ? 'text-[var(--warning)] opacity-100' : 'text-white/70 hover:text-white opacity-0 group-hover:opacity-100'}
                   ${isSelected ? 'opacity-100' : ''}`}
        title={item.pinned || item.savedAt !== undefined ? t.unpin : t.pin}
        aria-label={item.pinned || item.savedAt !== undefined ? t.unpin : t.pin}
      >
        <Icon name="star" filled={item.pinned || item.savedAt !== undefined} className="w-3.5 h-3.5" />
      </button>

      {/* Delete button - visible on hover or when selected */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-black/25 hover:bg-red-500/80
                   flex items-center justify-center transition-opacity
                   text-white/70 hover:text-white
                   ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        title={t.delete}
        aria-label={t.delete}
      >
        <Icon name="trash" className="w-3.5 h-3.5" />
      </button>

      {/* Content - with top padding to avoid overlapping buttons */}
      <div className="overflow-hidden mt-4" style={{ height: dimensions.contentHeight }}>
        {renderContent()}
      </div>

      {/* Contextual action: open link / preview image */}
      {item.type === 'link' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.electronAPI.openExternal(item.content)
          }}
          className={`absolute bottom-9 right-2 w-7 h-7 rounded-lg bg-[var(--card-hover)] border border-[var(--border-color)]
                     hover:border-[var(--accent)]/50 text-[var(--text-secondary)] hover:text-[var(--accent)]
                     flex items-center justify-center transition-opacity ${actionVisibility}`}
          title={t.openInBrowser}
          aria-label={t.openInBrowser}
        >
          <Icon name="open" className="w-4 h-4" />
        </button>
      )}
      {item.type === 'image' && onPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className={`absolute bottom-9 right-2 w-7 h-7 rounded-lg bg-[var(--card-hover)] border border-[var(--border-color)]
                     hover:border-[var(--accent)]/50 text-[var(--text-secondary)] hover:text-[var(--accent)]
                     flex items-center justify-center transition-opacity ${actionVisibility}`}
          title={t.preview}
          aria-label={t.preview}
        >
          <Icon name="search" className="w-4 h-4" />
        </button>
      )}

      {/* Footer — metadata is demoted (tertiary, normal weight) so it never
          competes with the clipboard content above it. */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]" style={{ color: TYPE_COLOR[item.type] }}>
            <TypeIcon type={item.type} className="w-3 h-3" />
          </span>
          {item.metadata.sourceApp && (
            <span className="text-[10px] text-[var(--text-tertiary)] truncate" title={item.metadata.sourceApp}>
              {item.metadata.sourceApp}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
          {formatTimeAgo(item.createdAt, t)}
        </span>
      </div>
    </div>
  )
}

// Memoized: only re-render a card when its own props change, not on every App
// re-render (e.g. the copied toast). The list passes stable-per-data callbacks.
export default memo(ClipboardCard)
