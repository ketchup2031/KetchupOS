import { Bell, Image, Monitor, Moon, Sun, Upload, Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { prepareImage } from '../system/images'
import { accentColors, wallpapers } from '../system/preferences'
import type { Preferences } from '../system/preferences'
import { useWorkspace } from '../system/workspace'
import { Shortcuts } from './Welcome'

type Tab = 'appearance' | 'wallpaper' | 'system'
const tabs = [['appearance', 'Appearance', Moon], ['wallpaper', 'Wallpaper', Image], ['system', 'System', Monitor]] as const

function Toggle({ label, description, enabled, onChange }: { label: string; description: string; enabled: boolean; onChange: () => void }) {
  return <button className="settings-toggle" role="switch" aria-checked={enabled} onClick={onChange}>
    <span><strong>{label}</strong><small>{description}</small></span><i />
  </button>
}

export function Settings() {
  const { preferences, setPreferences, options, notify, storageError } = useWorkspace()
  const [tab, setTab] = useState<Tab>('appearance')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const request = options.settings

  useEffect(() => {
    if (request?.preferenceTab) setTab(request.preferenceTab)
  }, [request])

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const customWallpaper = await prepareImage(file)
      setPreferences({ wallpaper: 'custom', customWallpaper })
      notify('Wallpaper updated', file.name)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Could not set the wallpaper.')
    } finally { setUploading(false) }
  }

  return <div className="settings-app">
    <aside aria-label="Settings sections">{tabs.map(([id, label, Icon]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon size={17} /><span>{label}</span></button>)}</aside>
    <div className="settings-body">
      {storageError && <p className="app-alert" role="alert">Browser storage is full or unavailable. Changes may be lost on reload.</p>}
      {tab === 'appearance' && <section>
        <h1>Appearance</h1><p>Customize the look of your workspace.</p>
        <h2>Theme</h2>
        <div className="theme-options">{(['dark', 'light'] as const).map(theme => {
          const Icon = theme === 'dark' ? Moon : Sun
          return <button key={theme} data-preview={theme} aria-pressed={preferences.theme === theme} onClick={() => setPreferences({ theme })}>
            <span className="theme-preview"><i /><i /><i /></span><span><Icon size={16} /> {theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        })}</div>
        <h2>Accent color</h2>
        <div className="accent-options">{Object.entries(accentColors).map(([accent, color]) =>
          <button title={accent} aria-label={accent} aria-pressed={preferences.accent === accent} key={accent} style={{ backgroundColor: color }} onClick={() => setPreferences({ accent: accent as Preferences['accent'] })} />)}</div>
        <Toggle label="Desktop shortcuts" description="Show app icons on the desktop" enabled={preferences.desktopIcons} onChange={() => setPreferences({ desktopIcons: !preferences.desktopIcons })} />
        <Toggle label="Animations" description="Animate windows and desktop menus" enabled={preferences.motion} onChange={() => setPreferences({ motion: !preferences.motion })} />
      </section>}
      {tab === 'wallpaper' && <section>
        <h1>Wallpaper</h1><p>Choose a background for your desktop.</p>
        <div className="wallpaper-options">{wallpapers.map(wallpaper =>
          <button key={wallpaper.id} aria-pressed={preferences.wallpaper === wallpaper.id} onClick={() => setPreferences({ wallpaper: wallpaper.id })}>
            <img src={wallpaper.image} alt="" style={{ backgroundColor: wallpaper.color }} /><span>{wallpaper.name}</span>
          </button>)}
          {preferences.customWallpaper && <button aria-pressed={preferences.wallpaper === 'custom'} onClick={() => setPreferences({ wallpaper: 'custom' })}>
            <img src={preferences.customWallpaper} alt="" /><span>Custom image</span>
          </button>}
        </div>
        <label className="soft-button upload-label"><Upload size={16} />{uploading ? 'Preparing image…' : 'Use your own image'}<input type="file" aria-label="Use your own image" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" disabled={uploading} onChange={event => void upload(event)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>}
      {tab === 'system' && <section>
        <h1>System</h1><p>Manage notifications, time and keyboard controls.</p>
        <Toggle label="Notification sounds" description="Play a chime for new notifications" enabled={preferences.sounds} onChange={() => setPreferences({ sounds: !preferences.sounds })} />
        <Toggle label="Seconds in clock" description="Show seconds in the taskbar clock" enabled={preferences.seconds} onChange={() => setPreferences({ seconds: !preferences.seconds })} />
        <button className="soft-button system-test" onClick={() => notify('Test notification', 'Notifications are working.')}><Bell size={15} /> Send test notification {preferences.sounds && <Volume2 size={15} />}</button>
        <h2>Keyboard shortcuts</h2><Shortcuts />
      </section>}
    </div>
  </div>
}
