import { Bell, CheckCheck, ChevronRight, CircleHelp, Image, LayoutGrid, Monitor, Moon, Search, Settings, Sun, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { appIds, apps } from '../system/apps'
import { useWorkspace } from '../system/workspace'
import type { Notice } from '../system/workspace'
import { AppGlyph, Tomato } from './Brand'

export function StartMenu() {
  const [query, setQuery] = useState('')
  const { launch } = useWorkspace()
  const filtered = appIds.filter(id => (apps[id].name + ' ' + apps[id].description).toLowerCase().includes(query.trim().toLowerCase()))
  function submit(event: FormEvent) {
    event.preventDefault()
    if (filtered[0]) launch(filtered[0])
  }
  return <section className="start-menu" aria-label="Start menu">
    <div className="start-heading"><span className="start-mark"><Tomato size={23} /></span><div><strong>Ketchup OS</strong><small>Local workspace</small></div></div>
    <form className="search-field" onSubmit={submit}><Search size={17} /><input aria-label="Search apps" placeholder="Search apps…" autoFocus value={query} onChange={event => setQuery(event.target.value)} /><kbd>↵</kbd></form>
    <div className="panel-label">{query ? 'Search results' : 'All apps'}</div>
    {filtered.length ? <div className="start-grid">{filtered.map(id => (
      <button key={id} onClick={() => launch(id)}><AppGlyph id={id} tile size={18} /><span>{apps[id].name}</span></button>
    ))}</div> : <div className="empty-panel">No apps match your search.</div>}
    <div className="start-footer">
      <button className="soft-button" onClick={() => launch('settings', { preferenceTab: 'system' })}><CircleHelp size={16} /> Keyboard shortcuts</button>
      <button className="icon-button" title="Open Settings" aria-label="Open Settings" onClick={() => launch('settings')}><Settings size={18} /></button>
    </div>
  </section>
}

export function Notifications({ notices, clear }: { notices: Notice[]; clear: () => void }) {
  return <section className="notification-panel" aria-label="Notification center">
    <header><h2><Bell size={19} /> Notifications</h2><button className="soft-button" disabled={!notices.length} onClick={clear}><CheckCheck size={15} /> Clear all</button></header>
    {notices.length === 0 && <div className="empty-panel">You’re all caught up.</div>}
    <div className="notice-list">{notices.map(notice => (
      <article className="notice" key={notice.id}>
        <span className="notice-icon"><Bell size={16} /></span>
        <div><strong>{notice.title}</strong><p>{notice.detail}</p><small><time dateTime={new Date(notice.time).toISOString()}>{new Date(notice.time).toLocaleString()}</time></small></div>
      </article>
    ))}</div>
  </section>
}

export function QuickSettings({ online }: { online: boolean }) {
  const { preferences, setPreferences, launch } = useWorkspace()
  const Sound = preferences.sounds ? Volume2 : VolumeX
  const Network = online ? Wifi : WifiOff
  const Theme = preferences.theme === 'dark' ? Moon : Sun
  return <section className="tray-panel" aria-label="Quick settings">
    <header><h2>Quick settings</h2><button className="icon-button" aria-label="Open Settings" title="Open Settings" onClick={() => launch('settings')}><Settings size={18} /></button></header>
    <div className="tray-grid">
      <div><Network size={20} /><span>Network</span><small>{online ? 'Online' : 'Offline'}</small></div>
      <button aria-pressed={preferences.sounds} onClick={() => setPreferences({ sounds: !preferences.sounds })}><Sound size={20} /><span>Sounds</span><small>{preferences.sounds ? 'On' : 'Off'}</small></button>
      <button aria-pressed={preferences.theme === 'dark'} onClick={() => setPreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' })}><Theme size={20} /><span>Theme</span><small>{preferences.theme === 'dark' ? 'Dark' : 'Light'}</small></button>
    </div>
  </section>
}

export function DesktopContext({ dismiss }: { dismiss: () => void }) {
  const { preferences, setPreferences, launch, windows } = useWorkspace()
  return <div className="desktop-context" aria-label="Desktop options">
    <button autoFocus onClick={() => { windows.toggleDesktop(); dismiss() }}><Monitor size={16} /> Show or restore windows</button>
    <button onClick={() => { setPreferences({ desktopIcons: !preferences.desktopIcons }); dismiss() }}><LayoutGrid size={16} /> {preferences.desktopIcons ? 'Hide' : 'Show'} desktop icons</button>
    <div />
    <button onClick={() => launch('settings', { preferenceTab: 'wallpaper' })}><Image size={16} /> Change wallpaper<ChevronRight size={14} /></button>
    <button onClick={() => launch('settings')}><Settings size={16} /> Open Settings</button>
  </div>
}
