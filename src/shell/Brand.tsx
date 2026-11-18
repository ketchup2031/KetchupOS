import { apps } from '../system/apps'
import type { AppId } from '../system/apps'

export function Tomato({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 10.5C8.7 7.7 4 10.6 4 15.3C4 20.4 8.4 24 14 24C19.6 24 24 20.4 24 15.3C24 10.6 19.3 7.7 14 10.5ZM14 10.5L15 4M14 10.5L9.5 7M14 10.5L18.5 7M8 15.8C8.2 17.4 9 18.5 10.4 19.3" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function AppGlyph({ id, size = 21, tile = false }: { id: AppId; size?: number; tile?: boolean }) {
  const { icon: Icon, color } = apps[id]
  const icon = id === 'welcome' ? <Tomato size={size} /> : <Icon size={size} strokeWidth={1.75} />
  return <span aria-hidden="true" className={tile ? 'app-glyph app-tile ' + color : 'app-glyph ' + color}>{icon}</span>
}
