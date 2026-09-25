import { useEffect, useState } from 'react'

// Module-level cache shared by every card: each app bundle's icon is fetched
// from the main process once per session, however many clips came from it.
const icons = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()

function loadIcon(appPath: string): Promise<string | null> {
  let pending = inflight.get(appPath)
  if (!pending) {
    pending = window.electronAPI.getAppIcon(appPath)
      .catch(() => null)
      .then(icon => {
        icons.set(appPath, icon)
        inflight.delete(appPath)
        return icon
      })
    inflight.set(appPath, pending)
  }
  return pending
}

export function useAppIcon(appPath: string | undefined): string | null {
  const [icon, setIcon] = useState<string | null>(() => (appPath ? icons.get(appPath) ?? null : null))

  useEffect(() => {
    if (!appPath) {
      setIcon(null)
      return
    }
    if (icons.has(appPath)) {
      setIcon(icons.get(appPath) ?? null)
      return
    }
    let alive = true
    loadIcon(appPath).then(result => {
      if (alive) setIcon(result)
    })
    return () => {
      alive = false
    }
  }, [appPath])

  return icon
}
