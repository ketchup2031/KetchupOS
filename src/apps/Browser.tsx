import { Bookmark, ExternalLink, Globe2, History, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useStorage } from '../system/storage'
import { useWorkspace } from '../system/workspace'

interface Link { id: string; title: string; url: string }
const defaultBookmarks: Link[] = [
  { id: 'wiki', title: 'Wikipedia', url: 'https://www.wikipedia.org/' },
  { id: 'mdn', title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
  { id: 'github', title: 'GitHub', url: 'https://github.com/' },
  { id: 'maps', title: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' },
]

function webAddress(query: string): URL | null {
  const input = query.trim()
  if (!input) return null
  const candidate = /^https?:\/\//i.test(input) ? input
    : /^[^\s/]+\.[a-z]{2,}(?=[:/?#]|$)/i.test(input) ? 'https://' + input : ''
  try {
    const url = new URL(candidate)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url : null
  } catch { return null }
}

export function Browser() {
  const [bookmarks, saveBookmarks, bookmarkError] = useStorage<Link[]>('bookmarks', defaultBookmarks)
  const [history, saveHistory] = useStorage<Link[]>('browser-history', [])
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [tab, setTab] = useState<'bookmarks' | 'history'>('bookmarks')
  const [link, setLink] = useState({ title: '', url: '' })
  const [error, setError] = useState('')
  const { notify } = useWorkspace()

  function visit(url: string, title: string) {
    saveHistory(previous => [{ id: crypto.randomUUID(), title, url }, ...previous.filter(item => item.url !== url)].slice(0, 24))
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function search(event: FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const url = webAddress(value)
    visit(url?.href ?? ('https://duckduckgo.com/?q=' + encodeURIComponent(value)), url?.hostname ?? value)
  }

  function add(event: FormEvent) {
    event.preventDefault()
    const url = webAddress(link.url)
    if (!url) { setError('Enter an HTTP or HTTPS address, such as example.org.'); return }
    if (bookmarks.some(bookmark => bookmark.url === url.href)) { setError('This address is already bookmarked.'); return }
    const title = link.title.trim() || url.hostname
    saveBookmarks(previous => [...previous, { id: crypto.randomUUID(), title, url: url.href }])
    setLink({ title: '', url: '' })
    setAdding(false)
    notify('Bookmark added', title)
  }

  const links = tab === 'bookmarks' ? bookmarks : history
  return <div className="app-stack browser-app">
    <div className="app-toolbar"><Globe2 size={16} /><span>Browser home</span></div>
    <div className="browser-body app-scroll">
      <section className="browser-hero">
        <div className="browser-mark"><Globe2 size={32} /></div><h1>Explore the web</h1>
        <form className="search-field" role="search" onSubmit={search}><Search size={18} /><input aria-label="Search or enter a web address" value={query} maxLength={500} placeholder="Search or enter an address" onChange={event => setQuery(event.target.value)} /><button className="accent-button" type="submit">Go</button></form>
        <p>Links and searches open in a new browser tab.</p>
      </section>
      <div className="browser-links">
        <div className="app-tabs" aria-label="Browser views">
          <button aria-pressed={tab === 'bookmarks'} onClick={() => setTab('bookmarks')}><Bookmark size={15} /> Bookmarks</button>
          <button aria-pressed={tab === 'history'} onClick={() => { setTab('history'); setAdding(false) }}><History size={15} /> History</button>
          {tab === 'bookmarks' ? <button className="browser-action" onClick={() => { setAdding(!adding); setError(''); if (!adding) setLink({ title: '', url: webAddress(query)?.href ?? '' }) }}><Plus size={16} /> Add</button>
            : <button className="browser-action" onClick={() => saveHistory([])} disabled={!history.length}><Trash2 size={15} /> Clear</button>}
        </div>
        {adding && <form className="inline-form" onSubmit={add}>
          <label>Title<input aria-label="Bookmark title" value={link.title} maxLength={60} onChange={event => setLink({ ...link, title: event.target.value })} /></label>
          <label>Address<input autoFocus aria-label="Bookmark address" required value={link.url} maxLength={500} onChange={event => setLink({ ...link, url: event.target.value })} /></label>
          <button className="accent-button" type="submit">Save</button>
          <button className="soft-button" type="button" onClick={() => setAdding(false)}>Cancel</button>
          {error && <span className="form-error" role="alert">{error}</span>}
        </form>}
        {bookmarkError && <p className="app-alert">Browser storage is full or unavailable.</p>}
        {links.length ? <div className="browser-link-list">{links.map(item => (
          <div key={item.id}><button onClick={() => visit(item.url, item.title)} title={item.url}><Globe2 size={16} /><span>{item.title}</span><ExternalLink size={12} /></button>
            {tab === 'bookmarks' && <button className="icon-button warning" aria-label={'Remove ' + item.title} title="Remove bookmark" onClick={() => saveBookmarks(previous => previous.filter(link => link.id !== item.id))}><Trash2 size={14} /></button>}
          </div>
        ))}</div> : <div className="empty-panel">{tab === 'history' ? 'No browsing history yet.' : 'No bookmarks yet.'}</div>}
      </div>
    </div>
  </div>
}
