import { useCallback } from 'react'
import { apps } from './apps'
import type { AppId } from './apps'
import { useStorage } from './storage'

export interface Bounds { x: number; y: number; width: number; height: number }
export interface AppWindow {
  id: AppId
  mode: 'normal' | 'maximized' | 'minimized'
  restoreMode: 'normal' | 'maximized'
  bounds: Bounds
  opened: number
}
export interface WorkspaceSize { width: number; height: number }

export function getWorkspace(): WorkspaceSize {
  const width = document.documentElement.clientWidth
  return { width, height: Math.max(1, window.innerHeight - (width <= 700 ? 105 : 124)) }
}

export function fitWindow(bounds: Bounds, area: WorkspaceSize): Bounds {
  const width = Math.min(bounds.width, area.width)
  const height = Math.min(bounds.height, area.height)
  return {
    x: Math.max(0, Math.min(bounds.x, area.width - width)),
    y: Math.max(0, Math.min(bounds.y, area.height - height)),
    width, height,
  }
}

function createWindow(id: AppId, cascade = 0): AppWindow {
  const area = getWorkspace()
  const { width, height } = apps[id]
  return {
    id, mode: 'normal', restoreMode: 'normal', opened: Date.now(),
    bounds: {
      x: Math.max(0, (area.width - width) / 2 - (id === 'welcome' && area.width > 1150 ? 58 : 0) + cascade),
      y: Math.max(0, (area.height - height) / 2 + cascade - 10),
      width, height,
    },
  }
}

function activate(windows: AppWindow[], id: AppId): AppWindow[] {
  const selected = windows.find(item => item.id === id)
  if (!selected) return windows
  if (selected === windows.at(-1) && selected.mode !== 'minimized') return windows
  return [
    ...windows.filter(item => item.id !== id),
    { ...selected, mode: selected.mode === 'minimized' ? selected.restoreMode : selected.mode },
  ]
}

export function useWindows() {
  const [windows, setWindows] = useStorage<AppWindow[]>('windows', () => [createWindow('welcome')])
  const active = [...windows].reverse().find(item => item.mode !== 'minimized')?.id

  const open = useCallback((id: AppId) => {
    setWindows(current => current.some(item => item.id === id)
      ? activate(current, id)
      : [...current, createWindow(id, (current.length % 5) * 19)])
  }, [])
  const focus = useCallback((id: AppId) => setWindows(current => activate(current, id)), [])
  const close = useCallback((id: AppId) => setWindows(current => current.filter(item => item.id !== id)), [])
  const minimize = useCallback((id: AppId) => {
    setWindows(current => current.map(item => item.id === id && item.mode !== 'minimized'
      ? { ...item, mode: 'minimized', restoreMode: item.mode }
      : item))
  }, [])
  const toggleMaximize = useCallback((id: AppId) => {
    setWindows(current => activate(current, id).map(item => item.id === id
      ? { ...item, mode: item.mode === 'maximized' ? 'normal' : 'maximized' }
      : item))
  }, [])
  const setBounds = useCallback((id: AppId, bounds: Bounds) => {
    setWindows(current => current.map(item => item.id === id ? { ...item, bounds } : item))
  }, [])
  const cycle = useCallback(() => {
    setWindows(current => {
      const visible = current.filter(item => item.mode !== 'minimized')
      const next = visible.length > 1 ? visible[0] : current.find(item => item.mode === 'minimized')
      return next ? activate(current, next.id) : current
    })
  }, [])
  const toggleDesktop = useCallback(() => {
    setWindows(current => {
      const hasVisible = current.some(item => item.mode !== 'minimized')
      return current.map(item => {
        if (!hasVisible) return { ...item, mode: item.restoreMode }
        return item.mode === 'minimized' ? item : { ...item, mode: 'minimized', restoreMode: item.mode }
      })
    })
  }, [])

  return { windows, active, open, focus, close, minimize, toggleMaximize, setBounds, cycle, toggleDesktop }
}

export type WindowManager = ReturnType<typeof useWindows>
