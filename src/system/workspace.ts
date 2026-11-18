import { createContext, useContext } from 'react'
import type { AppId } from './apps'
import type { Preferences } from './preferences'
import type { WindowManager } from './windows'

export interface Entry {
  id: string
  parent: string
  name: string
  kind: 'folder' | 'text'
  content: string
  modified: number
}

export interface Notice {
  id: string
  title: string
  detail: string
  time: number
}

export const root = 'root'
export const initialEntries: Entry[] = [
  { id: 'documents', parent: root, name: 'Documents', kind: 'folder', content: '', modified: 0 },
  { id: 'downloads', parent: root, name: 'Downloads', kind: 'folder', content: '', modified: 0 },
  { id: 'projects', parent: root, name: 'Projects', kind: 'folder', content: '', modified: 0 },
  {
    id: 'readme', parent: 'documents', name: 'Getting Started.txt', kind: 'text', modified: 0,
    content: 'Welcome to Ketchup OS Online!\n\nYour workspace lives in this browser.\n\n• Open applications from Start or the desktop.\n• Run help in Terminal to discover commands.\n• Personalize your wallpaper and colors in Settings.',
  },
]

export function findAt(entries: Entry[], cwd: string, path: string): Entry | undefined {
  let id = path.startsWith('/') ? root : cwd
  for (const name of path.split('/').filter(Boolean)) {
    if (name === '.') continue
    if (name === '..') {
      id = entries.find(entry => entry.id === id)?.parent ?? root
      continue
    }
    const entry = entries.find(item => item.parent === id && item.name.toLowerCase() === name.toLowerCase())
    if (!entry) return undefined
    id = entry.id
  }
  return id === root ? { id: root, parent: root, name: 'Home', kind: 'folder', content: '', modified: 0 }
    : entries.find(entry => entry.id === id)
}

export function getEntryPath(entries: Entry[], id: string): Entry[] {
  const path: Entry[] = []
  let entry = entries.find(item => item.id === id)
  while (entry && !path.some(item => item.id === entry!.id)) {
    const parent = entry.parent
    path.unshift(entry)
    entry = entries.find(item => item.id === parent)
  }
  return path
}

export function getEntryError(entries: Entry[], parent: string, name: string, id?: string) {
  if (parent !== root && !entries.some(entry => entry.id === parent && entry.kind === 'folder')) return 'Folder no longer exists.'
  if (!name || name.length > 90 || name === '.' || name === '..' || name.includes('/') || name.includes(String.fromCharCode(92))) {
    return 'Enter a name from 1 to 90 characters, without slashes.'
  }
  if (entries.some(entry => entry.id !== id && entry.parent === parent && entry.name.toLowerCase() === name.toLowerCase())) return 'This name is already in use.'
  return ''
}

export function entryTree(entries: Entry[], id: string) {
  const removed = new Set([id])
  const queue = [id]
  for (const parent of queue) {
    for (const entry of entries) {
      if (entry.parent !== parent || removed.has(entry.id)) continue
      removed.add(entry.id)
      queue.push(entry.id)
    }
  }
  return entries.filter(entry => !removed.has(entry.id))
}

export interface LaunchOptions {
  preferenceTab?: 'appearance' | 'wallpaper' | 'system'
  fileId?: string
  folderId?: string
}

export interface Workspace {
  preferences: Preferences
  setPreferences: (update: Partial<Preferences>) => void
  entries: Entry[]
  setEntries: (update: (entries: Entry[]) => Entry[]) => void
  windows: WindowManager
  launch: (app: AppId, options?: LaunchOptions) => void
  notify: (title: string, detail: string) => void
  options: Partial<Record<AppId, LaunchOptions & { requestId: string }>>
  storageError: boolean
}

export const WorkspaceContext = createContext<Workspace | null>(null)

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('Desktop context is missing.')
  return context
}
