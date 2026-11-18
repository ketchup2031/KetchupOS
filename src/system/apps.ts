import { Activity, AppWindow, Calculator, CalendarDays, FileText, Folder, Gamepad2, Globe2, Images, Settings, SquareTerminal } from 'lucide-react'

export const apps = {
  welcome: { name: 'Welcome', description: 'Get to know your desktop', icon: AppWindow, color: 'red', width: 684, height: 456 },
  explorer: { name: 'File Explorer', description: 'Manage your local files', icon: Folder, color: 'amber', width: 720, height: 482 },
  terminal: { name: 'Terminal', description: 'Run desktop commands', icon: SquareTerminal, color: 'violet', width: 650, height: 436 },
  notes: { name: 'Notepad', description: 'Write and save text', icon: FileText, color: 'blue', width: 610, height: 462 },
  calculator: { name: 'Calculator', description: 'Work with numbers', icon: Calculator, color: 'cyan', width: 384, height: 530 },
  browser: { name: 'Browser', description: 'Search and keep bookmarks', icon: Globe2, color: 'blue', width: 700, height: 498 },
  settings: { name: 'Settings', description: 'Personalize your desktop', icon: Settings, color: 'slate', width: 700, height: 500 },
  tasks: { name: 'Task Manager', description: 'Manage running apps', icon: Activity, color: 'green', width: 650, height: 460 },
  gallery: { name: 'Gallery', description: 'View wallpapers and photos', icon: Images, color: 'pink', width: 700, height: 500 },
  calendar: { name: 'Calendar', description: 'Plan days and events', icon: CalendarDays, color: 'amber', width: 710, height: 500 },
  games: { name: 'Games', description: 'Play local arcade games', icon: Gamepad2, color: 'pink', width: 620, height: 520 },
} as const

export type AppId = keyof typeof apps
export const appIds = Object.keys(apps) as AppId[]
export const desktopIcons: AppId[] = ['explorer', 'terminal', 'notes', 'browser', 'gallery', 'games']
export const pinnedApps: AppId[] = ['explorer', 'terminal', 'notes', 'browser', 'settings']
