import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { ClipboardItem } from '../types'
import type { Translations } from '../i18n/translations'
import { Icon } from './icons'
import { detectTextKind, formatJson, phoneDigits, textStats } from '../../common/content'

interface PreviewModalProps {
  item: ClipboardItem | null
  onClose: () => void
  t: Translations
}

// Simple markdown to HTML converter
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/30 p-3 rounded-lg overflow-x-auto my-2"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/\n/g, '<br>')
}

function isMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,3} /m,
    /\*\*[^*]+\*\*/,
    /```[\s\S]*?```/,
    /\[.+\]\(.+\)/,
    /^- /m,
    /^\d+\. /m
  ]
  return markdownPatterns.some(pattern => pattern.test(text))
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

export default function PreviewModal({ item, onClose, t }: PreviewModalProps) {
  const [showMarkdown, setShowMarkdown] = useState(true)

  // Hooks must run unconditionally — these are computed BEFORE the early return
  // and guarded internally so it's safe when item is null. (Calling useMemo after
  // `if (!item) return null` would change the hook count between renders → crash.)
  const hasMarkdown = !!item && item.type === 'text' && isMarkdown(item.content)
  const sanitizedMarkdownHtml = useMemo(() => {
    if (!item || !hasMarkdown) return ''
    const raw = renderMarkdown(item.content)
    // SECURITY: explicit allowlist (no reliance on profile defaults). Strips
    // scripts, event handlers, inline styles, and non-http(s)/mailto URLs.
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'blockquote'],
      ALLOWED_ATTR: ['href', 'class'],
      ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
      FORBID_ATTR: ['style', 'onerror', 'onclick', 'target']
    })
  }, [item, hasMarkdown])

  const kind = useMemo(() => (item && item.type === 'text' ? detectTextKind(item.content.slice(0, 200_000)) : 'plain'), [item])
  const stats = useMemo(() => (item && item.type === 'text' ? textStats(item.content) : null), [item])

  if (!item) return null

  const copyAndClose = (text: string) => {
    window.electronAPI.copyText(text)
    onClose()
  }

  // Route clipboard writes through IPC so the main process updates its
  // lastClipboardContent tracker and the poller doesn't re-capture them as new
  // history items (navigator.clipboard would desync and create duplicates).
  const transformText = (transform: 'upper' | 'lower' | 'title' | 'trim') => {
    let result = item.content
    switch (transform) {
      case 'upper': result = item.content.toUpperCase(); break
      case 'lower': result = item.content.toLowerCase(); break
      case 'title': result = item.content.replace(/\b\w/g, c => c.toUpperCase()); break
      case 'trim': result = item.content.trim().replace(/\s+/g, ' '); break
    }
    window.electronAPI.copyText(result)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-24px)] w-full max-w-2xl m-3 flex-col overflow-hidden rounded-2xl bg-[var(--menu-bg)] border border-[var(--border-strong)]
                   shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header — fixed; only the content scrolls, so actions stay reachable
            even in the short bottom panel. */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-4">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <Icon name={item.type === 'color' ? 'color' : item.type === 'image' ? 'image' : item.type === 'link' ? 'link' : item.type === 'file' ? 'file' : kind === 'json' ? 'braces' : kind === 'code' ? 'code' : kind === 'email' ? 'mail' : kind === 'phone' ? 'phone' : 'text'} className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium">
              {kind === 'json' ? t.kindJson : kind === 'code' ? t.kindCode : kind === 'email' ? t.kindEmail : kind === 'phone' ? t.kindPhone : typeLabel(item.type, t)}
            </span>
            {item.metadata.sourceApp && (
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                {t.from} {item.metadata.sourceApp}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="icon-btn rounded-full"
            aria-label={t.close}
          >
            <Icon name="close" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-container min-h-0 flex-1 overflow-auto px-5 text-[var(--text-primary)]">
          {item.type === 'image' ? (
            <img
              src={item.content}
              alt={t.preview}
              className="max-w-full rounded-lg"
              onError={(e) => {
                // file:// can be blocked under webSecurity; fall back to the
                // embedded data-URL thumbnail so the preview is never broken.
                const el = e.currentTarget
                if (item.thumbnail && !el.dataset.fellBack) {
                  el.dataset.fellBack = '1'
                  el.src = item.thumbnail
                }
              }}
            />
          ) : item.type === 'color' ? (
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl border border-[var(--border-strong)] shadow-lg"
                style={{ backgroundColor: item.content }}
              />
              <div>
                <p className="font-mono text-lg">{item.content}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{t.colorValue}</p>
              </div>
            </div>
          ) : item.type === 'link' ? (
            <div>
              <a
                href={item.content}
                onClick={(e) => {
                  e.preventDefault()
                  window.electronAPI.openExternal(item.content)
                  onClose()
                }}
                className="text-[var(--accent)] hover:underline break-all"
              >
                {item.content}
              </a>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                {(() => { try { return new URL(item.content).hostname } catch { return item.content } })()}
              </p>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-secondary)] mb-2">{t.actions}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { window.electronAPI.openExternal(item.content); onClose() }}
                    className="px-3 py-1.5 text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded transition-colors"
                  >
                    {t.openInBrowser}
                  </button>
                  <button
                    onClick={() => { window.electronAPI.copyText(item.content); onClose() }}
                    className="px-3 py-1.5 text-xs chip rounded-md"
                  >
                    {t.copyUrl}
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const url = new URL(item.content)
                        window.electronAPI.copyText(url.hostname)
                        onClose()
                      } catch {}
                    }}
                    className="px-3 py-1.5 text-xs chip rounded-md"
                  >
                    {t.copyDomain}
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
                    className={`px-2 py-1 text-xs rounded ${showMarkdown ? 'bg-[var(--accent)] text-white' : 'bg-[var(--chip-bg)] text-[var(--text-secondary)]'}`}
                  >
                    {t.preview}
                  </button>
                  <button
                    onClick={() => setShowMarkdown(false)}
                    className={`px-2 py-1 text-xs rounded ${!showMarkdown ? 'bg-[var(--accent)] text-white' : 'bg-[var(--chip-bg)] text-[var(--text-secondary)]'}`}
                  >
                    {t.raw}
                  </button>
                </div>
              )}
              {hasMarkdown && showMarkdown ? (
                <div
                  className="prose prose-sm"
                  onClick={(e) => {
                    const target = e.target as HTMLElement | null
                    const anchor = target?.closest?.('a') as HTMLAnchorElement | null
                    if (!anchor) return
                    const href = anchor.getAttribute('href')
                    if (!href) return
                    e.preventDefault()
                    window.electronAPI.openExternal(href)
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedMarkdownHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed select-text">
                  {kind === 'json' ? formatJson(item.content) ?? item.content : item.content}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Text Transformations (only for text type) */}
        {item.type === 'text' && (
          <div className="mx-5 mt-3 shrink-0 border-t border-[var(--border-color)] pt-3">
            <p className="text-xs text-[var(--text-secondary)] mb-2">{t.copyAs}</p>
            <div className="flex gap-2 flex-wrap">
              {kind === 'json' && (
                <>
                  <button onClick={() => { const pretty = formatJson(item.content); if (pretty) copyAndClose(pretty) }} className="px-2 py-1 text-xs chip chip-accent rounded-md">
                    <Icon name="braces" className="h-3 w-3" />{t.copyFormatted}
                  </button>
                  <button onClick={() => { const min = formatJson(item.content, 0); if (min) copyAndClose(min) }} className="px-2 py-1 text-xs chip rounded-md">{t.copyMinified}</button>
                </>
              )}
              {kind === 'email' && (
                <button onClick={() => { window.electronAPI.openExternal(`mailto:${item.content.trim()}`); onClose() }} className="px-2 py-1 text-xs chip chip-accent rounded-md">
                  <Icon name="mail" className="h-3 w-3" />{t.writeEmail}
                </button>
              )}
              {kind === 'phone' && (
                <button onClick={() => copyAndClose(phoneDigits(item.content))} className="px-2 py-1 text-xs chip chip-accent rounded-md">
                  <Icon name="phone" className="h-3 w-3" />{t.copyDigits}
                </button>
              )}
              {kind === 'plain' && <button onClick={() => transformText('upper')} className="px-2 py-1 text-xs chip rounded-md">{t.transformUpper}</button>}
              {kind === 'plain' && <button onClick={() => transformText('lower')} className="px-2 py-1 text-xs chip rounded-md">{t.transformLower}</button>}
              {kind === 'plain' && <button onClick={() => transformText('title')} className="px-2 py-1 text-xs chip rounded-md">{t.transformTitle}</button>}
              <button onClick={() => transformText('trim')} className="px-2 py-1 text-xs chip rounded-md">{t.transformTrim}</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mx-5 mt-3 flex shrink-0 items-center justify-between border-t border-[var(--border-color)] pb-3.5 pt-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-2">
            {new Date(item.createdAt).toLocaleString()}
            {stats && (
              <span className="text-[var(--text-tertiary)]">
                · {stats.characters.toLocaleString()} {stats.characters === 1 ? t.statsChar : t.statsChars} · {stats.words.toLocaleString()} {stats.words === 1 ? t.statsWord : t.statsWords} · {stats.lines.toLocaleString()} {stats.lines === 1 ? t.statsLine : t.statsLines}
              </span>
            )}
            {item.type === 'image' && item.metadata.imageWidth && (
              <span className="text-[var(--text-tertiary)]">· {item.metadata.imageWidth}×{item.metadata.imageHeight}</span>
            )}
          </span>
          <span>{t.pressToClose}</span>
        </div>
      </div>
    </div>
  )
}
