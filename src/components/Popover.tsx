import { useEffect, useRef, type ReactNode } from 'react'

interface PopoverProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

// Lightweight anchored menu. Escape and outside clicks close it, and are
// swallowed in the capture phase so the panel's own Escape (hide window) and
// arrow/Enter shortcuts don't fire underneath an open menu.
export default function Popover({ open, onClose, children, align = 'left', className = '' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const anchor = ref.current?.parentElement
      if (anchor && !anchor.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('pointerdown', onPointer, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('pointerdown', onPointer, true)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      ref={ref}
      role="menu"
      data-popover
      className={`popover absolute top-full z-40 mt-1.5 min-w-[200px] animate-pop-in ${align === 'right' ? 'right-0' : 'left-0'} ${className}`}
    >
      {children}
    </div>
  )
}

export function MenuItem({
  onClick,
  children,
  active = false,
  trailing
}: {
  onClick: () => void
  children: ReactNode
  active?: boolean
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`menu-item group/item ${active ? 'menu-item-active' : ''}`}
    >
      <span className="min-w-0 flex-1 truncate text-left">{children}</span>
      {trailing}
    </button>
  )
}
