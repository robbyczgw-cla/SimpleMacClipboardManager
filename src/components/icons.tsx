import type { ClipboardItem } from '../types'

// Monochrome, SF-Symbol-style line icons. All share a 24x24 viewBox and inherit
// color via `currentColor`, so they adapt to the active theme automatically and
// look consistent next to the existing search glyph. This replaces the emoji
// type indicators, which rendered as platform-specific colored glyphs and were
// the biggest "web app, not Mac app" tell.

export type IconName =
  | 'all'
  | 'text'
  | 'link'
  | 'image'
  | 'file'
  | 'color'
  | 'star'
  | 'trash'
  | 'open'
  | 'check'
  | 'search'
  | 'clipboard'
  | 'close'
  | 'settings'
  | 'power'
  | 'code'
  | 'braces'
  | 'mail'
  | 'phone'
  | 'pause'
  | 'play'
  | 'stack'
  | 'chevron'
  | 'plus'
  | 'pencil'
  | 'eye'

interface IconProps {
  name: IconName
  className?: string
  /** For `star`: render a filled (pinned) glyph instead of an outline. */
  filled?: boolean
  strokeWidth?: number
}

export function Icon({ name, className = 'w-4 h-4', filled = false, strokeWidth = 1.6 }: IconProps) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className
  }

  switch (name) {
    case 'all':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.6" />
          <rect x="13" y="4" width="7" height="7" rx="1.6" />
          <rect x="4" y="13" width="7" height="7" rx="1.6" />
          <rect x="13" y="13" width="7" height="7" rx="1.6" />
        </svg>
      )
    case 'text':
      return (
        <svg {...common}>
          <line x1="4.5" y1="7" x2="19.5" y2="7" />
          <line x1="4.5" y1="12" x2="19.5" y2="12" />
          <line x1="4.5" y1="17" x2="13.5" y2="17" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common}>
          <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.2 1.2" />
          <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.2-1.2" />
        </svg>
      )
    case 'image':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <circle cx="8.5" cy="10" r="1.6" />
          <path d="M20 16l-4.5-4.5L8 19" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M4 7a2 2 0 0 1 2-2h3.2l2 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
        </svg>
      )
    case 'color':
      return (
        <svg {...common}>
          <path d="M12 3.2s6.2 6.4 6.2 10.4a6.2 6.2 0 0 1-12.4 0C5.8 9.6 12 3.2 12 3.2z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common} fill={filled ? 'currentColor' : 'none'}>
          <path d="M12 3.6l2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.99l-5.1 2.69.98-5.68L3.75 9.6l5.7-.83L12 3.6z" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4.5 7h15" />
          <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
          <path d="M6.5 7l.8 11.3A2 2 0 0 0 9.3 20.2h5.4a2 2 0 0 0 2-1.9L17.5 7" />
        </svg>
      )
    case 'open':
      return (
        <svg {...common}>
          <path d="M14 5h5v5" />
          <path d="M19 5l-8.5 8.5" />
          <path d="M18 13.5V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common} strokeWidth={2.2}>
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20.5 20.5L16.7 16.7" />
        </svg>
      )
    case 'clipboard':
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="16" rx="2.5" />
          <rect x="8.5" y="3" width="7" height="4" rx="1.4" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <line x1="4" y1="7.5" x2="20" y2="7.5" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="16.5" x2="20" y2="16.5" />
          <circle cx="9" cy="7.5" r="2.1" />
          <circle cx="15" cy="12" r="2.1" />
          <circle cx="8" cy="16.5" r="2.1" />
        </svg>
      )
    case 'power':
      return (
        <svg {...common}>
          <path d="M12 3.5v8" />
          <path d="M7.4 6.6a7 7 0 1 0 9.2 0" />
        </svg>
      )
    case 'code':
      return (
        <svg {...common}>
          <path d="M8.5 7.5L4 12l4.5 4.5" />
          <path d="M15.5 7.5L20 12l-4.5 4.5" />
          <path d="M13.2 5.5l-2.4 13" />
        </svg>
      )
    case 'braces':
      return (
        <svg {...common}>
          <path d="M9 4.5H8a2 2 0 0 0-2 2v3a2.5 2.5 0 0 1-2 2.5 2.5 2.5 0 0 1 2 2.5v3a2 2 0 0 0 2 2h1" />
          <path d="M15 4.5h1a2 2 0 0 1 2 2v3a2.5 2.5 0 0 0 2 2.5 2.5 2.5 0 0 0-2 2.5v3a2 2 0 0 1-2 2h-1" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
          <path d="M4.5 7.5l7.5 5.5 7.5-5.5" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M6.6 3.8h2.6l1.4 4-2 1.4a11.5 11.5 0 0 0 6.2 6.2l1.4-2 4 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 6a2 2 0 0 1 2-2.2z" />
        </svg>
      )
    case 'pause':
      return (
        <svg {...common}>
          <rect x="7" y="5.5" width="3" height="13" rx="1" />
          <rect x="14" y="5.5" width="3" height="13" rx="1" />
        </svg>
      )
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.2 5.1A.8.8 0 0 0 8 5.8z" />
        </svg>
      )
    case 'stack':
      return (
        <svg {...common}>
          <path d="M12 4l8 4-8 4-8-4 8-4z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="M7 10l5 5 5-5" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'pencil':
      return (
        <svg {...common}>
          <path d="M15.5 5.5l3 3L9 18H6v-3l9.5-9.5z" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      )
  }
}

const TYPE_ICON: Record<ClipboardItem['type'], IconName> = {
  text: 'text',
  link: 'link',
  image: 'image',
  file: 'file',
  color: 'color'
}

export function TypeIcon({ type, className }: { type: ClipboardItem['type']; className?: string }) {
  return <Icon name={TYPE_ICON[type]} className={className} />
}
