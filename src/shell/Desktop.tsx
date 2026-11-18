import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Activity, ChevronRight, HardDrive, MoreHorizontal, PanelsTopLeft } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { AppContent } from '../apps/AppContent'
import { apps, desktopIcons } from '../system/apps'
import type { AppId } from '../system/apps'
import { accentColors, defaults, wallpapers } from '../system/preferences'
import type { Preferences } from '../system/preferences'
import { useStorage } from '../system/storage'
import { getWorkspace, useWindows } from '../system/windows'
import { initialEntries, WorkspaceContext } from '../system/workspace'
import type { LaunchOptions, Notice } from '../system/workspace'
import { AppGlyph, Tomato } from './Brand'
import { DesktopContext, Notifications, QuickSettings, StartMenu } from './DesktopPanels'
import { Taskbar } from './Taskbar'
import type { Panel } from './Taskbar'
import { WindowFrame } from './WindowFrame'

function chime() {
  try {
    const audio = new AudioContext()
    void audio.resume().catch(() => undefined)
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(640, audio.currentTime)
    oscillator.frequency.setValueAtTime(810, audio.currentTime + .09)
    gain.gain.setValueAtTime(.11, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .24)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.onended = () => { void audio.close().catch(() => undefined) }
    oscillator.start()
    oscillator.stop(audio.currentTime + .24)
  } catch {
    // Some browsers disable Web Audio.
  }
}

const welcomeNotice: Notice[] = [{
  id: 'welcome', title: 'Welcome to Ketchup OS', detail: 'Open Start to find apps or right-click the desktop to personalize it.', time: Date.now(),
}]

export function Desktop() {
  const [preferences, savePreferences, preferencesError] = useStorage('preferences', defaults)
  const [entries, setEntries, entriesError] = useStorage('files', initialEntries)
  const [notices, setNotices] = useStorage('notices', welcomeNotice)
  const [seenTime, setSeenTime] = useStorage('notice-seen', 0)
  const [toast, setToast] = useState<Notice | null>(null)
  const [options, setOptions] = useState<Partial<Record<AppId, LaunchOptions & { requestId: string }>>>({})
  const [area, setArea] = useState(getWorkspace)
  const [now, setNow] = useState(() => new Date())
  const [online, setOnline] = useState(navigator.onLine)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [context, setContext] = useState({ x: 0, y: 0 })
  const workspaceRef = useRef<HTMLDivElement>(null)
  const windows = useWindows()
  const { open, close, cycle, toggleDesktop, active } = windows
  const unread = notices.filter(notice => notice.time > seenTime).length

  const toggle = useCallback((next: Panel) => {
    if (next === 'notifications') setSeenTime(Date.now())
    setPanel(current => current === next ? null : next)
  }, [setSeenTime])
  const launch = useCallback((id: AppId, extra?: LaunchOptions) => {
    if (extra) setOptions(current => ({ ...current, [id]: { ...extra, requestId: crypto.randomUUID() } }))
    open(id)
    setPanel(null)
  }, [open])
  const setPreferences = useCallback((update: Partial<Preferences>) => {
    savePreferences(current => ({ ...current, ...update }))
  }, [savePreferences])
  const notify = useCallback((title: string, detail: string) => {
    const notice = { id: crypto.randomUUID(), title, detail, time: Date.now() }
    setNotices(current => [notice, ...current].slice(0, 24))
    setToast(notice)
    if (preferences.sounds) chime()
  }, [preferences.sounds, setNotices])

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    const updateOnline = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    const observer = new ResizeObserver(([rect]) => {
      if (rect) setArea({ width: Math.round(rect.contentRect.width), height: Math.round(rect.contentRect.height) })
    })
    if (workspaceRef.current) observer.observe(workspaceRef.current)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4500)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.key === 'Escape') setPanel(null)
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'Space') {
        event.preventDefault()
        toggle('start')
      }
      if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return
      const actions: Record<string, (() => void) | undefined> = {
        KeyW: cycle, KeyD: toggleDesktop, KeyX: () => { if (active) close(active) },
        KeyT: () => launch('terminal'), KeyS: () => toggle('start'),
      }
      const action = actions[event.code]
      if (action) {
        event.preventDefault()
        if (event.code !== 'KeyS') setPanel(null)
        action()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => document.removeEventListener('keydown', keydown)
  }, [active, close, cycle, launch, toggle, toggleDesktop])

  function desktopMenu(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.os-window, .taskbar, .desktop-popover')) return
    event.preventDefault()
    setContext({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 258)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 225)),
    })
    setPanel('context')
  }

  const wallpaper = wallpapers.find(item => item.id === preferences.wallpaper) ?? wallpapers[0]
  const image = preferences.wallpaper === 'custom' && preferences.customWallpaper ? preferences.customWallpaper : wallpaper.image
  const usedKb = Math.ceil(new Blob([JSON.stringify(entries)]).size / 1024)
  const onlineLabel = online ? 'Online' : 'Offline'

  return <WorkspaceContext.Provider value={{ preferences, setPreferences, entries, setEntries, windows, launch, notify, options, storageError: preferencesError || entriesError }}>
    <MotionConfig reducedMotion={preferences.motion ? 'user' : 'always'}>
      <main className="desktop" data-theme={preferences.theme} data-motion={preferences.motion}
        style={{ '--accent': accentColors[preferences.accent] } as CSSProperties} onContextMenu={desktopMenu}>
        <div className="desktop-wallpaper" style={{ backgroundImage: `url("${image}")` }} />
        <header className="desktop-top">
          <button className="desktop-brand" onClick={() => launch('welcome')} aria-label="Ketchup OS Welcome">
            <span className="desktop-brand-icon"><Tomato size={25} /></span>
            <span>KETCHUP<span className="brand-os"> OS</span><small>ONLINE</small></span>
          </button>
          <div className="top-actions">
            <span className="session-status"><i className={online ? '' : 'offline'} />{online ? 'System online' : 'Local mode'}</span>
            <button className="top-options" aria-label="Desktop options" title="Desktop options"
              onClick={event => {
                const rect = event.currentTarget.getBoundingClientRect()
                setContext({ x: Math.max(8, rect.right - 250), y: rect.bottom + 8 })
                toggle('context')
              }}><MoreHorizontal size={20} /></button>
          </div>
        </header>
        <div ref={workspaceRef} className="relative min-h-0 min-w-0">
          {preferences.desktopIcons && <div className="desktop-icons" aria-label="Desktop shortcuts">
            {desktopIcons.map(id => <button key={id} title={apps[id].name} onClick={() => launch(id)}><AppGlyph id={id} tile size={23} /><span>{apps[id].name}</span></button>)}
          </div>}
          <aside className="system-widget" aria-label="System status">
            <h2><Activity size={17} /> SYSTEM STATUS</h2>
            <div className="widget-state"><i className={online ? '' : 'offline'} /><strong>{onlineLabel}</strong><small>Browser session</small></div>
            <div className="widget-metric"><PanelsTopLeft size={15} /><span>Running apps</span><b>{windows.windows.length.toString().padStart(2, '0')}</b></div>
            <div className="widget-metric"><HardDrive size={15} /><span>Workspace data</span><b>{usedKb} KB</b></div>
            <button onClick={() => launch('tasks')}>Task Manager<ChevronRight size={15} /></button>
          </aside>
          <button className="wallpaper-caption" onClick={() => launch('settings', { preferenceTab: 'wallpaper' })} title="Change wallpaper">
            <span /><div><small>WALLPAPER</small><strong>{preferences.wallpaper === 'custom' ? 'Custom image' : wallpaper.name}</strong></div>
          </button>
          <AnimatePresence>{windows.windows.map((item, index) => (
            <WindowFrame key={item.id} item={item} z={index + 10} area={area}><AppContent id={item.id} /></WindowFrame>
          ))}</AnimatePresence>
        </div>
        <Taskbar now={now} online={online} panel={panel} toggle={toggle} unread={unread} />
        <AnimatePresence>
          {panel && <motion.div key={panel} className="popover-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: preferences.motion ? .13 : 0 }}>
            <div className="popover-dismiss" onPointerDown={() => setPanel(null)} />
            <motion.div className={'desktop-popover popover-' + panel} style={panel === 'context' ? { left: context.x, top: context.y } : undefined}
              initial={preferences.motion ? { y: 6 } : false} animate={{ y: 0 }} transition={{ duration: preferences.motion ? .14 : 0 }}>
              {panel === 'start' && <StartMenu />}
              {panel === 'notifications' && <Notifications notices={notices} clear={() => setNotices([])} />}
              {panel === 'tray' && <QuickSettings online={online} />}
              {panel === 'context' && <DesktopContext dismiss={() => setPanel(null)} />}
            </motion.div>
          </motion.div>}
        </AnimatePresence>
        <div className="toast-region" aria-live="polite">
          <AnimatePresence>{toast && panel !== 'notifications' && <motion.button className="system-toast" key={toast.id}
              initial={preferences.motion ? { opacity: 0, y: 8 } : false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={() => { setToast(null); toggle('notifications') }}>
              <span className="notice-icon"><Tomato size={19} /></span><span><strong>{toast.title}</strong><small>{toast.detail}</small></span><ChevronRight size={16} />
            </motion.button>}</AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  </WorkspaceContext.Provider>
}
