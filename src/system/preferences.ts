const asset = (name: string) => import.meta.env.BASE_URL + 'wallpapers/' + name + '.webp'

export const wallpapers = [
  { id: 'caldera', name: 'The Caldera', color: '#38151b', image: asset('caldera') },
  { id: 'eclipse', name: 'Red Eclipse', color: '#3c1026', image: asset('eclipse') },
  { id: 'drift', name: 'Midnight Drift', color: '#122637', image: asset('drift') },
] as const

export type WallpaperId = typeof wallpapers[number]['id']
export interface Preferences {
  theme: 'dark' | 'light'
  accent: 'tomato' | 'coral' | 'violet' | 'teal'
  wallpaper: WallpaperId | 'custom'
  customWallpaper: string
  sounds: boolean
  motion: boolean
  seconds: boolean
  desktopIcons: boolean
}

export const defaults: Preferences = {
  theme: 'dark', accent: 'tomato', wallpaper: 'caldera', customWallpaper: '',
  sounds: false, motion: true, seconds: false, desktopIcons: true,
}

export const accentColors: Record<Preferences['accent'], string> = {
  tomato: '#f44850', coral: '#ff754f', violet: '#a781ff', teal: '#38cfb1',
}
