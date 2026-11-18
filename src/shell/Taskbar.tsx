import { Bell, ChevronUp, PanelsTopLeft, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { apps, pinnedApps } from '../system/apps'
import { useWorkspace } from '../system/workspace'
import { AppGlyph, Tomato } from './Brand'

export type Panel = 'start' | 'notifications' | 'tray' | 'context'

export function Taskbar({ now, online, panel, toggle, unread }: {
  now: Date; online: boolean; panel: Panel | null; toggle: (panel: Panel) => void; unread: number
}) {
  const { windows, preferences, launch } = useWorkspace()
  const running = windows.windows.filter(item => !pinnedApps.includes(item.id))
    .sort((left, right) => left.opened - right.opened).map(item => item.id)
  const Sound = preferences.sounds ? Volume2 : VolumeX
  const Network = online ? Wifi : WifiOff

  return <nav className="taskbar" aria-label="Taskbar">
    <button className={'start-button ' + (panel === 'start' ? 'pressed' : '')} aria-label="Start" aria-expanded={panel === 'start'} title="Start (Alt + Shift + S)" onClick={() => toggle('start')}>
      <span className="start-mark"><Tomato size={23} /></span><span>Start</span>
    </button>
    <div className="taskbar-divider" />
    <div className="task-apps" aria-label="Pinned and running apps">
      {[...pinnedApps, ...running].map(id => {
        const item = windows.windows.find(window => window.id === id)
        const active = id === windows.active
        return (
          <button key={id} className={'task-app ' + (active ? 'task-active' : '')} aria-label={apps[id].name}
            aria-pressed={active} title={apps[id].name} data-running={!!item}
            onClick={() => {
              if (active && item?.mode !== 'minimized') windows.minimize(id)
              else launch(id)
            }}>
            <AppGlyph id={id} size={20} />
            {active && <span className="active-app-name">{apps[id].name}</span>}
            {item && <span className="running-dot" />}
          </button>
        )
      })}
    </div>
    <div className="system-tray">
      <button className="tray-button tray-status" aria-label="Quick settings" aria-expanded={panel === 'tray'} title="Quick settings" onClick={() => toggle('tray')}>
        <ChevronUp size={13} /><Network size={16} /><Sound size={16} />
      </button>
      <button className="tray-button bell" aria-label={unread ? `Notifications (${unread} unread)` : 'Notifications'} aria-expanded={panel === 'notifications'} title="Notifications" onClick={() => toggle('notifications')}>
        <Bell size={17} />{unread > 0 && <i />}
      </button>
      <button className="tray-button task-clock" aria-label="Clock and calendar" title="Open Calendar" onClick={() => launch('calendar')}>
        <strong>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: preferences.seconds ? '2-digit' : undefined, hour12: false })}</strong>
        <small>{now.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
      </button>
      <button className="tray-button show-desktop" aria-label="Show desktop" title="Show desktop (Alt + Shift + D)" onClick={windows.toggleDesktop}><PanelsTopLeft size={15} /></button>
    </div>
  </nav>
}
