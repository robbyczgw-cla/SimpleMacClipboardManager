import { ClipboardItem } from '../types'

interface PreviewModalProps {
  item: ClipboardItem | null
  onClose: () => void
}

export default function PreviewModal({ item, onClose }: PreviewModalProps) {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-w-2xl max-h-[70vh] m-4 p-6 rounded-2xl bg-[var(--panel-bg)] border border-[var(--border-color)]
                   shadow-2xl overflow-auto backdrop-blur-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {item.type === 'text' && '📝'}
              {item.type === 'link' && '🔗'}
              {item.type === 'image' && '🖼️'}
              {item.type === 'file' && '📁'}
              {item.type === 'color' && '🎨'}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)] capitalize">
              {item.type}
            </span>
            {item.metadata.sourceApp && (
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                from {item.metadata.sourceApp}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="text-[var(--text-primary)]">
          {item.type === 'image' ? (
            <img
              src={item.content}
              alt="Preview"
              className="max-w-full rounded-lg"
            />
          ) : item.type === 'color' ? (
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl border border-white/20 shadow-lg"
                style={{ backgroundColor: item.content }}
              />
              <div>
                <p className="font-mono text-lg">{item.content}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Color value</p>
              </div>
            </div>
          ) : item.type === 'link' ? (
            <div>
              <a
                href={item.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 break-all"
              >
                {item.content}
              </a>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {new URL(item.content).hostname}
              </p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed max-h-96 overflow-auto">
              {item.content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between items-center text-xs text-[var(--text-secondary)]">
          <span>
            {new Date(item.createdAt).toLocaleString()}
          </span>
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-[var(--kbd-bg)] rounded">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  )
}
