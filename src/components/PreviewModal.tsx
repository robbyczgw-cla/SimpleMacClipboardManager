import { useState } from 'react'
import { ClipboardItem } from '../types'

interface PreviewModalProps {
  item: ClipboardItem | null
  onClose: () => void
}

// Simple markdown to HTML converter
function renderMarkdown(text: string): string {
  return text
    // Code blocks (```...```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>')
    // Inline code (`...`)
    .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>')
}

// Check if text looks like markdown
function isMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,3} /m,           // Headers
    /\*\*[^*]+\*\*/,       // Bold
    /```[\s\S]*?```/,      // Code blocks
    /\[.+\]\(.+\)/,        // Links
    /^- /m,                // Unordered lists
    /^\d+\. /m,            // Ordered lists
  ]
  return markdownPatterns.some(pattern => pattern.test(text))
}

export default function PreviewModal({ item, onClose }: PreviewModalProps) {
  const [showMarkdown, setShowMarkdown] = useState(true)

  if (!item) return null

  const hasMarkdown = item.type === 'text' && isMarkdown(item.content)

  // Text transformation functions
  const transformText = (transform: 'upper' | 'lower' | 'title' | 'trim') => {
    let result = item.content
    switch (transform) {
      case 'upper':
        result = item.content.toUpperCase()
        break
      case 'lower':
        result = item.content.toLowerCase()
        break
      case 'title':
        result = item.content.replace(/\b\w/g, c => c.toUpperCase())
        break
      case 'trim':
        result = item.content.trim().replace(/\s+/g, ' ')
        break
    }
    navigator.clipboard.writeText(result)
    onClose()
  }

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
              {/* Smart Actions for links */}
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-secondary)] mb-2">Actions:</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      window.open(item.content, '_blank')
                      onClose()
                    }}
                    className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    Open in Browser
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.content)
                      onClose()
                    }}
                    className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const url = new URL(item.content)
                        navigator.clipboard.writeText(url.hostname)
                        onClose()
                      } catch {}
                    }}
                    className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                  >
                    Copy Domain
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {hasMarkdown && (
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setShowMarkdown(true)}
                    className={`px-2 py-1 text-xs rounded ${showMarkdown ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setShowMarkdown(false)}
                    className={`px-2 py-1 text-xs rounded ${!showMarkdown ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
                  >
                    Raw
                  </button>
                </div>
              )}
              {hasMarkdown && showMarkdown ? (
                <div
                  className="prose prose-invert prose-sm max-h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed max-h-96 overflow-auto">
                  {item.content}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Text Transformations (only for text type) */}
        {item.type === 'text' && (
          <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
            <p className="text-xs text-[var(--text-secondary)] mb-2">Copy as:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => transformText('upper')}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => transformText('lower')}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                lowercase
              </button>
              <button
                onClick={() => transformText('title')}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Title Case
              </button>
              <button
                onClick={() => transformText('trim')}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
              >
                Trim Whitespace
              </button>
            </div>
          </div>
        )}

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
