import { ClipboardItem } from '../types'

interface ClipboardCardProps {
  item: ClipboardItem
  isSelected: boolean
  onClick: () => void
  onDoubleClick: () => void
  onDelete: () => void
  onCopy: () => void
  onTogglePin: () => void
  isVertical?: boolean
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getTypeIcon(type: ClipboardItem['type']): string {
  switch (type) {
    case 'text': return '📝'
    case 'link': return '🔗'
    case 'image': return '🖼️'
    case 'file': return '📁'
    case 'color': return '🎨'
    default: return '📋'
  }
}

function getTypeBadgeClass(type: ClipboardItem['type']): string {
  switch (type) {
    case 'text': return 'badge-text'
    case 'link': return 'badge-link'
    case 'image': return 'badge-image'
    case 'file': return 'badge-file'
    case 'color': return 'badge-color'
    default: return 'badge-text'
  }
}

export default function ClipboardCard({
  item,
  isSelected,
  onClick,
  onDoubleClick,
  onDelete,
  onCopy,
  onTogglePin,
  isVertical = false
}: ClipboardCardProps) {
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onCopy()
  }
  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="w-full h-24 flex items-center justify-center overflow-hidden rounded">
            <img
              src={item.thumbnail || item.content}
              alt="Clipboard image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )

      case 'color':
        return (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 rounded-lg border border-white/20 shadow-inner"
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
            <div className="text-blue-400 text-sm truncate">
              {item.content}
            </div>
            <div className="text-[var(--text-secondary)] text-xs truncate">
              {new URL(item.content).hostname}
            </div>
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className="text-sm truncate text-[var(--text-secondary)]">
              {item.content.split('/').pop()}
            </span>
          </div>
        )

      default:
        return (
          <p className="text-base text-[var(--text-primary)] line-clamp-3 whitespace-pre-wrap break-words">
            {item.content}
          </p>
        )
    }
  }

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleContextMenu}
      className={`
        card-animate relative flex-shrink-0 p-3 rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        border
        ${isVertical ? 'w-full h-28' : 'w-52 h-44'}
        ${isSelected
          ? 'glass-card-selected border-blue-500/40 scale-[1.02]'
          : 'glass-card card-glow border-[var(--border-color)] hover:bg-[var(--card-hover)] hover:border-white/20'
        }
        ${item.pinned ? 'ring-1 ring-yellow-400/40' : ''}
      `}
    >
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
        className={`absolute top-2 left-2 w-5 h-5 rounded-full
                   flex items-center justify-center transition-opacity
                   text-xs ${item.pinned ? 'text-yellow-400 opacity-100' : 'text-white/40 opacity-0 hover:opacity-100'}`}
        title={item.pinned ? 'Unpin' : 'Pin'}
      >
        {item.pinned ? '★' : '☆'}
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-red-500/50
                   flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity
                   text-xs text-white/60 hover:text-white"
        style={{ opacity: isSelected ? 0.5 : undefined }}
      >
        ×
      </button>

      {/* Content */}
      <div className="h-24 overflow-hidden">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTypeBadgeClass(item.type)} text-white/80`}>
            {getTypeIcon(item.type)} {item.type}
          </span>
          {item.metadata.sourceApp && (
            <span className="text-[9px] text-[var(--text-secondary)] truncate max-w-[60px]" title={item.metadata.sourceApp}>
              {item.metadata.sourceApp}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  )
}
