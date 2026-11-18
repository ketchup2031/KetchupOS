import { Activity, Cpu, HardDrive, Server, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppGlyph } from '../shell/Brand'
import { appIds, apps } from '../system/apps'
import type { AppId } from '../system/apps'
import { useWorkspace } from '../system/workspace'

export function TaskManager() {
  const { windows, notify, entries } = useWorkspace()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [tick, setTick] = useState(0)
  const { close, focus, windows: running } = windows
  const current = running.find(item => item.id === selected)
  const isVisible = windows.active === 'tasks'

  useEffect(() => {
    if (!isVisible) return
    const interval = window.setInterval(() => setTick(previous => previous + 1), 1700)
    return () => window.clearInterval(interval)
  }, [isVisible])

  const processes = [...running].sort((first, second) => first.opened - second.opened).map(item => {
    const order = appIds.indexOf(item.id)
    const cpu = item.mode === 'minimized' ? .1 : (order % 4 + 1) * .65 + (Math.sin(tick + order) + 1) * .52
    return { ...item, cpu, memory: 12 + order * 3 + (item.mode === 'minimized' ? 0 : 8) }
  })
  const cpu = processes.reduce((total, item) => total + item.cpu, 3)
  const memory = processes.reduce((total, item) => total + item.memory, 64)
  const bytes = new Blob([JSON.stringify(entries)]).size

  return <div className="app-stack task-manager">
    <div className="app-toolbar wrap"><Activity size={17} /><strong>Processes</strong><button className="soft-button warning push" disabled={!current} onClick={() => {
      if (current) { close(current.id); setSelected(null); notify('Process ended', apps[current.id].name) }
    }}><X size={15} /> End process</button></div>
    <div className="resource-stats">
      <div><Cpu size={19} /><span>Virtual CPU<strong>{Math.round(cpu)}%</strong></span><meter min="0" max="100" value={cpu} aria-label="Virtual CPU load" /></div>
      <div><Server size={19} /><span>Virtual memory<strong>{memory} MB</strong></span><meter min="0" max="512" value={memory} aria-label="Virtual memory load" /></div>
      <div><HardDrive size={19} /><span>File storage<strong>{(bytes / 1024).toFixed(1)} KB</strong></span></div>
    </div>
    <div className="app-scroll process-list">
      <div className="process-row process-head"><span>App</span><span>Status</span><span>CPU</span><span>Memory</span></div>
      {processes.map(item => <button key={item.id} className="process-row" aria-pressed={item.id === selected}
        onClick={() => setSelected(item.id)} onDoubleClick={() => focus(item.id)}>
        <span><AppGlyph id={item.id} size={17} /> {apps[item.id].name}</span>
        <span>{item.mode === 'minimized' ? 'Minimized' : 'Running'}</span><span>{item.cpu.toFixed(1)}%</span><span>{item.memory} MB</span>
      </button>)}
    </div>
    <footer className="app-status"><span>{running.length} open · Simulated CPU and memory</span>{current && <button className="soft-button" onClick={() => focus(current.id)}>Switch to app</button>}</footer>
  </div>
}
