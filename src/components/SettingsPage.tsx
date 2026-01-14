import { useState, useEffect } from 'react'

interface Settings {
  historyLimit: number
  pollingInterval: number
  launchAtLogin: boolean
  clearOnQuit: boolean
  showInDock: boolean
  hotkey: string
  playSoundOnCopy: boolean
  ignoreDuplicates: boolean
  ignorePasswordManagers: boolean
}

const defaultSettings: Settings = {
  historyLimit: 500,
  pollingInterval: 500,
  launchAtLogin: false,
  clearOnQuit: false,
  showInDock: false,
  hotkey: 'CommandOrControl+Shift+V',
  playSoundOnCopy: false,
  ignoreDuplicates: true,
  ignorePasswordManagers: true
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    await window.electronAPI.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#2a2a2a] text-white p-6 pt-10">
      {/* Drag region for title bar */}
      <div className="absolute top-0 left-0 right-0 h-8 app-drag" />

      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6 max-h-[320px] overflow-y-auto pr-2">
        {/* History Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">History</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Maximum items</label>
              <select
                value={settings.historyLimit}
                onChange={e => handleChange('historyLimit', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Ignore duplicates</label>
                <p className="text-xs text-white/40">Don't save consecutive identical copies</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ignoreDuplicates}
                onChange={e => handleChange('ignoreDuplicates', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Clear history on quit</label>
                <p className="text-xs text-white/40">Erase all data when closing</p>
              </div>
              <input
                type="checkbox"
                checked={settings.clearOnQuit}
                onChange={e => handleChange('clearOnQuit', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">Behavior</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Polling interval</label>
              <select
                value={settings.pollingInterval}
                onChange={e => handleChange('pollingInterval', Number(e.target.value))}
                className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={250}>250ms (Fast)</option>
                <option value={500}>500ms (Default)</option>
                <option value={1000}>1000ms (Slow)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Launch at login</label>
                <p className="text-xs text-white/40">Start automatically when you log in</p>
              </div>
              <input
                type="checkbox"
                checked={settings.launchAtLogin}
                onChange={e => handleChange('launchAtLogin', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Show in Dock</label>
                <p className="text-xs text-white/40">Display app icon in the Dock</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showInDock}
                onChange={e => handleChange('showInDock', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Play sound on copy</label>
                <p className="text-xs text-white/40">Audio feedback when saving to history</p>
              </div>
              <input
                type="checkbox"
                checked={settings.playSoundOnCopy}
                onChange={e => handleChange('playSoundOnCopy', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">Privacy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white/70">Ignore password managers</label>
                <p className="text-xs text-white/40">Don't capture from 1Password, Bitwarden, etc.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.ignorePasswordManagers}
                onChange={e => handleChange('ignorePasswordManagers', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Keyboard Section */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white/80 mb-4">Keyboard</h3>
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">Global hotkey</label>
            <select
              value={settings.hotkey}
              onChange={e => handleChange('hotkey', e.target.value)}
              className="bg-white/10 border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Option+Space">⌥Space (Default)</option>
              <option value="CommandOrControl+Shift+V">⌘⇧V</option>
              <option value="CommandOrControl+Shift+C">⌘⇧C</option>
              <option value="CommandOrControl+Shift+H">⌘⇧H</option>
              <option value="CommandOrControl+Option+V">⌘⌥V</option>
              <option value="CommandOrControl+Option+C">⌘⌥C</option>
              <option value="CommandOrControl+Option+H">⌘⌥H</option>
              <option value="CommandOrControl+Option+P">⌘⌥P</option>
            </select>
          </div>
          <p className="text-xs text-white/40 mt-2">
            Restart app after changing hotkey
          </p>
        </section>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-between">
        <span className={`text-sm transition-opacity ${saved ? 'text-green-400 opacity-100' : 'opacity-0'}`}>
          ✓ Settings saved
        </span>
        <button
          onClick={handleSave}
          className="px-5 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
