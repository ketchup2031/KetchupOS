import type { ComponentType } from 'react'
import { Browser } from './Browser'
import { Calculator } from './Calculator'
import { Calendar } from './Calendar'
import { Explorer } from './Explorer'
import { Gallery } from './Gallery'
import { Games } from './Games'
import { Notepad } from './Notepad'
import { Settings } from './Settings'
import { TaskManager } from './TaskManager'
import { Terminal } from './Terminal'
import { Welcome } from './Welcome'
import type { AppId } from '../system/apps'

const content = {
  browser: Browser, calculator: Calculator, calendar: Calendar, explorer: Explorer, gallery: Gallery, games: Games,
  notes: Notepad, settings: Settings, tasks: TaskManager, terminal: Terminal, welcome: Welcome,
} satisfies Record<AppId, ComponentType>

export function AppContent({ id }: { id: AppId }) {
  const Content = content[id]
  return <Content />
}
