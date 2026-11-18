import { Maximize2, Minus, Square, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import { apps } from '../system/apps'
import { fitWindow } from '../system/windows'
import type { AppWindow, Bounds, WorkspaceSize } from '../system/windows'
import { useWorkspace } from '../system/workspace'
import { AppGlyph } from './Brand'

type Edge = 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw'
const edges: Edge[] = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

export function WindowFrame({ item, z, area, children }: { item: AppWindow; z: number; area: WorkspaceSize; children: ReactNode }) {
  const { windows, preferences } = useWorkspace()
  const gesture = useRef<{ startX: number; startY: number; bounds: Bounds; edge?: Edge } | null>(null)
  const { id, mode } = item
  const compact = area.width <= 700 || area.height < 260
  const maximized = mode === 'maximized' || compact
  const minimized = mode === 'minimized'
  const bounds = maximized
    ? { x: 0, y: 0, width: area.width, height: area.height }
    : fitWindow(item.bounds, area)

  function start(event: PointerEvent<HTMLElement>, edge?: Edge) {
    if (event.button !== 0 || maximized || (event.target as HTMLElement).closest('button')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = { startX: event.clientX, startY: event.clientY, bounds, edge }
  }

  function move(event: PointerEvent<HTMLElement>) {
    const start = gesture.current
    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    const dx = event.clientX - start.startX
    const dy = event.clientY - start.startY
    const { bounds: initial, edge } = start
    if (!edge) {
      windows.setBounds(id, fitWindow({ ...initial, x: initial.x + dx, y: initial.y + dy }, area))
      return
    }
    const right = initial.x + initial.width
    const bottom = initial.y + initial.height
    const minWidth = Math.min(id === 'calculator' ? 306 : 350, area.width)
    const minHeight = Math.min(id === 'calculator' ? 420 : 250, area.height)
    const x = edge.includes('w') ? Math.max(0, Math.min(right - minWidth, initial.x + dx)) : initial.x
    const y = edge.includes('n') ? Math.max(0, Math.min(bottom - minHeight, initial.y + dy)) : initial.y
    const newRight = edge.includes('e') ? Math.min(area.width, Math.max(x + minWidth, right + dx)) : right
    const newBottom = edge.includes('s') ? Math.min(area.height, Math.max(y + minHeight, bottom + dy)) : bottom
    windows.setBounds(id, { x, y, width: newRight - x, height: newBottom - y })
  }

  const motionEnabled = preferences.motion
  const active = windows.active === id
  return (
    <motion.section
      role="region"
      aria-label={apps[id].name + ' window'}
      inert={minimized || undefined}
      aria-hidden={minimized || undefined}
      className={['os-window', active ? 'focused' : '', maximized ? 'maximized' : '', minimized ? 'minimized' : ''].join(' ')}
      style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, zIndex: z }}
      initial={motionEnabled ? { opacity: 0, scale: .975, y: 12 } : false}
      animate={minimized ? { opacity: 0, scale: .95, y: 28 } : { opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: .97, y: 9, pointerEvents: 'none' }}
      transition={{ duration: motionEnabled ? .17 : 0 }}
      onPointerDownCapture={() => windows.focus(id)}
      onFocusCapture={() => windows.focus(id)}
    >
      <header className="window-bar select-none" onPointerDown={event => start(event)} onPointerMove={move}
        onLostPointerCapture={() => { gesture.current = null }}
        onDoubleClick={event => {
          if (!compact && !(event.target as HTMLElement).closest('button')) windows.toggleMaximize(id)
        }}>
        <span className="window-title"><AppGlyph id={id} size={17} />{apps[id].name}</span>
        <div className="window-actions">
          <button aria-label="Minimize" title="Minimize" onClick={() => windows.minimize(id)}><Minus size={15} /></button>
          {!compact && <button aria-label={maximized ? 'Restore' : 'Maximize'} title={maximized ? 'Restore' : 'Maximize'} onClick={() => windows.toggleMaximize(id)}>
            {maximized ? <Maximize2 size={13} /> : <Square size={12} />}
          </button>}
          <button aria-label="Close" title="Close" className="close-window" onClick={() => windows.close(id)}><X size={16} /></button>
        </div>
      </header>
      <div className="window-content">{children}</div>
      {!maximized && edges.map(edge => (
        <div key={edge} className={'resize-edge resize-' + edge} aria-hidden="true"
          onPointerDown={event => start(event, edge)} onPointerMove={move}
          onLostPointerCapture={() => { gesture.current = null }} />
      ))}
    </motion.section>
  )
}
