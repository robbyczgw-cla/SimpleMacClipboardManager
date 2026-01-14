import { useState, useEffect } from 'react'

interface Settings {
  historyLimit: number
  pollingInterval: number
  launchAtLogin: boolean
  clearOnQuit: boolean
  showInDock: boolean
  hotkey: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const defaultSettings: Settings = {
  historyLimit: 500,
  pollingInterval: 500,
  launchAtLogin: false,
  clearOnQuit: false,
  showInDock: false,
  hotkey: 'CommandOrControl+Shift+V'
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getSettings().then(setSettings)
    }
  }, [isOpen])

  const handleSave = async () => {
    await window.electronAPI.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#2a2a2a] rounded-xl w-[480px] shadow-2xl border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* History Section */}
          <section>
            <h3 className="text-sm font-medium text-white/80 mb-3">History</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70">Maximum items</label>
                <select
                  value={settings.historyLimit}
                  onChange={e => handleChange('historyLimit', Number(e.target.value))}
                  className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={2000}>2000</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70">Clear history on quit</label>
                <input
                  type="checkbox"
                  checked={settings.clearOnQuit}
                  onChange={e => handleChange('clearOnQuit', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </div>
            </div>
          </section>

          {/* Behavior Section */}
          <section>
            <h3 className="text-sm font-medium text-white/80 mb-3">Behavior</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70">Polling interval (ms)</label>
                <select
                  value={settings.pollingInterval}
                  onChange={e => handleChange('pollingInterval', Number(e.target.value))}
                  className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white"
                >
                  <option value={250}>250 (Fast)</option>
                  <option value={500}>500 (Default)</option>
                  <option value={1000}>1000 (Slow)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70">Launch at login</label>
                <input
                  type="checkbox"
                  checked={settings.launchAtLogin}
                  onChange={e => handleChange('launchAtLogin', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70">Show in Dock</label>
                <input
                  type="checkbox"
                  checked={settings.showInDock}
                  onChange={e => handleChange('showInDock', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </div>
            </div>
          </section>

          {/* Keyboard Section */}
          <section>
            <h3 className="text-sm font-medium text-white/80 mb-3">Keyboard</h3>
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Global hotkey</label>
              <div className="text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded border border-white/10">
                ⌘⇧V
              </div>
            </div>
            <p className="text-xs text-white/40 mt-2">
              Hotkey customization coming soon
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
          <span className={`text-sm ${saved ? 'text-green-400' : 'text-transparent'}`}>
            Settings saved!
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
