import { Download, FileText, Plus, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStorage } from '../system/storage'
import { getEntryError, root, useWorkspace } from '../system/workspace'
import type { Entry } from '../system/workspace'

export function Notepad() {
  const { entries, setEntries, notify, options, storageError } = useWorkspace()
  const [note, setNote, noteError] = useStorage('notepad', { title: 'Quick note', content: '' })
  const [file, setFile] = useState<string | undefined>()
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [filename, setFilename] = useState('')
  const [error, setError] = useState('')
  const request = options.notes

  useEffect(() => {
    if (request) {
      setFile(request.fileId)
      setShowSaveAs(false)
    }
  }, [request])

  const linked = entries.find(item => item.id === file && item.kind === 'text')
  const title = linked ? linked.name : note.title
  const content = linked ? linked.content : note.content
  const lines = content ? content.split('\n').length : 1
  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  function changeContent(content: string) {
    if (linked) setEntries(value => value.map(item => item.id === linked.id ? { ...item, content, modified: Date.now() } : item))
    else setNote(value => ({ ...value, content }))
  }

  function exportFile() {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = title.endsWith('.txt') ? title : (title || 'Quick note') + '.txt'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function save() {
    if (noteError || storageError) {
      notify('Storage unavailable', 'Download a copy of your text to keep it.')
      return
    }
    notify('Text saved', title || 'Quick note')
  }

  function saveCopy() {
    const name = filename.trim()
    const parent = linked?.parent ?? (entries.find(item => item.id === 'documents' && item.kind === 'folder')?.id ?? root)
    const issue = getEntryError(entries, parent, name)
    if (issue) { setError(issue); return }
    const item: Entry = { id: crypto.randomUUID(), parent, name, kind: 'text', content, modified: Date.now() }
    setEntries(current => [...current, item])
    setFile(item.id)
    setShowSaveAs(false)
    notify('File saved', name)
  }

  return <div className="app-stack notepad-app" onKeyDown={event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save() }
  }}>
    <div className="app-toolbar wrap">
      <button className="soft-button" onClick={() => { setFile(undefined); setShowSaveAs(false) }}><FileText size={15} /> Quick note</button>
      <button className="soft-button" onClick={save}><Save size={15} /> Save</button>
      <button className="soft-button" onClick={() => { setShowSaveAs(true); setFilename((title || 'New note').replace(/\.txt$/i, '') + (linked ? ' copy.txt' : '.txt')); setError('') }}><Plus size={16} /> Save a copy</button>
      <button className="icon-button" aria-label="Download text" title="Download text" onClick={exportFile}><Download size={16} /></button>
    </div>
    {showSaveAs && <form className="inline-form" onSubmit={event => { event.preventDefault(); saveCopy() }}>
      <label>File name<input autoFocus aria-label="File name" required maxLength={90} value={filename} onChange={event => setFilename(event.target.value)} /></label>
      <button className="accent-button" type="submit">Save file</button>
      <button className="soft-button" type="button" onClick={() => setShowSaveAs(false)}>Cancel</button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </form>}
    {file && !linked && <div className="app-alert" role="status">The virtual file was deleted. Your quick note is open.</div>}
    <input className="note-title" aria-label="Document title" value={title} readOnly={!!linked} maxLength={90} onChange={event => setNote(value => ({ ...value, title: event.target.value }))} />
    <textarea aria-label="Note content" placeholder="Start writing…" spellCheck value={content} maxLength={180000} onChange={event => changeContent(event.target.value)} />
    <footer className="app-status"><span>{lines} lines · {words} words · {content.length} characters</span><span>{noteError || storageError ? 'Storage unavailable' : 'Autosaved locally'}</span></footer>
  </div>
}
