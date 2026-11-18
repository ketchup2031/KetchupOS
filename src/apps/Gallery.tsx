import { ChevronLeft, ChevronRight, Image, Images, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { prepareImage } from '../system/images'
import { wallpapers } from '../system/preferences'
import type { WallpaperId } from '../system/preferences'
import { useStorage } from '../system/storage'
import { useWorkspace } from '../system/workspace'

interface Photo { id: string; name: string; image: string; builtin?: WallpaperId }

export function Gallery() {
  const [photos, setPhotos, storageError] = useStorage<Photo[]>('gallery', [])
  const [current, setCurrent] = useState<string>(wallpapers[0].id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { setPreferences, notify } = useWorkspace()
  const allPhotos: Photo[] = [...wallpapers.map(item => ({ ...item, builtin: item.id })), ...photos]
  const activeIndex = Math.max(0, allPhotos.findIndex(photo => photo.id === current))
  const active = allPhotos[activeIndex]

  function move(step: number) {
    setCurrent(allPhotos[(activeIndex + step + allPhotos.length) % allPhotos.length].id)
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (photos.length >= 12) { setError('Remove a saved photo to add another. Gallery holds up to 12 photos.'); return }
    setBusy(true)
    setError('')
    try {
      const photo = { id: crypto.randomUUID(), name: file.name, image: await prepareImage(file, 1300, 170000) }
      setPhotos(previous => [...previous, photo])
      setCurrent(photo.id)
      notify('Photo imported', photo.name)
    } catch (issue) { setError(issue instanceof Error ? issue.message : 'Could not open photo.') }
    finally { setBusy(false) }
  }

  return <div className="app-stack gallery-app" onKeyDown={event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1) }
  }}>
    <div className="app-toolbar wrap">
      <label className="soft-button upload-label"><Upload size={16} /> {busy ? 'Importing…' : 'Import photo'}<input type="file" aria-label="Import photo" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" disabled={busy} onChange={event => void upload(event)} /></label>
      <button className="soft-button" onClick={() => {
        if (active.builtin) setPreferences({ wallpaper: active.builtin })
        else setPreferences({ wallpaper: 'custom', customWallpaper: active.image })
        notify('Wallpaper updated', active.name)
      }}><Image size={16} /> Set as wallpaper</button>
      {!active.builtin && <button className="icon-button warning" aria-label="Remove photo" title="Remove photo" onClick={() => { setPhotos(previous => previous.filter(item => item.id !== active.id)); setCurrent(wallpapers[0].id) }}><Trash2 size={16} /></button>}
    </div>
    {(error || storageError) && <div className="app-alert" role="alert">{error || 'Browser storage is full or unavailable.'}</div>}
    <div className="gallery-view">
      <img src={active.image} alt={active.name} />
      <button className="gallery-prev" aria-label="Previous photo" title="Previous photo" onClick={() => move(-1)}><ChevronLeft size={23} /></button>
      <button className="gallery-next" aria-label="Next photo" title="Next photo" onClick={() => move(1)}><ChevronRight size={23} /></button>
    </div>
    <div className="gallery-strip" aria-label="Photos">
      {allPhotos.map(photo => <button key={photo.id} title={photo.name} aria-label={photo.name} aria-pressed={photo.id === active.id} onClick={() => setCurrent(photo.id)}><img src={photo.image} alt="" /></button>)}
    </div>
    <footer className="app-status"><span><Images size={15} />{active.name}</span><span>{activeIndex + 1} / {allPhotos.length}</span></footer>
  </div>
}
