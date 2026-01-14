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
        relative flex-shrink-0 p-3 rounded-2xl cursor-pointer
        transition-all duration-200 ease-out
        border group
        ${isVertical ? 'w-full h-28' : 'w-52 h-44'}
        ${isSelected
          ? 'glass-card-selected border-blue-500/40 scale-[1.02]'
          : 'glass-card card-glow border-[var(--border-color)] hover:bg-[var(--card-hover)] hover:border-white/20'
        }
        ${item.pinned ? 'ring-1 ring-yellow-400/40' : ''}
      `}
    >
      {/* Pin button - visible on hover or when selected/pinned */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onTogglePin()
        }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-full bg-black/30 hover:bg-yellow-500/80
                   flex items-center justify-center transition-all
                   text-sm ${item.pinned ? 'text-yellow-400 opacity-100' : 'text-white/70 hover:text-white opacity-0 group-hover:opacity-100'}
                   ${isSelected ? 'opacity-100' : ''}`}
        title={item.pinned ? 'Unpin' : 'Pin'}
      >
        {item.pinned ? '★' : '☆'}
      </button>

      {/* Delete button - visible on hover or when selected */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-black/30 hover:bg-red-500/80
                   flex items-center justify-center transition-all
                   text-sm text-white/70 hover:text-white
                   ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        title="Delete"
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
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getTypeBadgeClass(item.type)} text-white drop-shadow-sm`}>
            {getTypeIcon(item.type)} {item.type}
          </span>
          {item.metadata.sourceApp && (
            <span className="text-[10px] text-[var(--text-primary)] font-medium truncate max-w-[60px]" title={item.metadata.sourceApp}>
              {item.metadata.sourceApp}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-primary)] font-medium">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  )
}
