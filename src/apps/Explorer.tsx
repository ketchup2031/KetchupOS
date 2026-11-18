import { ArrowLeft, ArrowUp, ChevronRight, FilePlus2, FileText, Folder, FolderPlus, HardDrive, Home, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { entryTree, getEntryError, getEntryPath, root, useWorkspace } from '../system/workspace'
import type { Entry } from '../system/workspace'

type Edit = { kind: 'folder' | 'text' | 'rename' | 'delete'; id?: string }

export function Explorer() {
  const { entries, setEntries, launch, notify, options, storageError } = useWorkspace()
  const [folder, setFolder] = useState(root)
  const [history, setHistory] = useState<string[]>([])
  const [selection, setSelection] = useState('')
  const [edit, setEdit] = useState<Edit | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const request = options.explorer

  useEffect(() => {
    if (request?.folderId) {
      setFolder(request.folderId)
      setSelection('')
    }
  }, [request])

  const location = folder === root || entries.some(item => item.id === folder && item.kind === 'folder') ? folder : root
  const current = entries.find(entry => entry.id === location)
  const selected = entries.find(entry => entry.id === selection && entry.parent === location)
  const crumbs = getEntryPath(entries, location)
  const visible = entries.filter(entry => entry.parent === location)
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
  const folders = entries.filter(entry => entry.parent === root && entry.kind === 'folder')

  function navigate(id: string) {
    if (id === location) return
    setHistory(previous => [...previous, location])
    setFolder(id)
    setSelection('')
    setEdit(null)
  }

  function back() {
    const previous = history.at(-1)
    if (!previous) return
    setFolder(previous)
    setHistory(history.slice(0, -1))
    setSelection('')
    setEdit(null)
  }

  function open(item: Entry) {
    if (item.kind === 'folder') navigate(item.id)
    else launch('notes', { fileId: item.id })
  }

  function begin(kind: Edit['kind'], item?: Entry) {
    setError('')
    setName(item?.name ?? '')
    setEdit({ kind, id: item?.id })
  }

  function commit(event: FormEvent) {
    event.preventDefault()
    if (!edit) return
    const label = name.trim()
    if (edit.kind === 'delete' && edit.id) {
      const id = edit.id
      setEntries(value => entryTree(value, id))
      notify('Item deleted', name)
      setSelection('')
      setEdit(null)
      return
    }
    const problem = getEntryError(entries, location, label, edit.id)
    if (problem) {
      setError(problem)
      return
    }
    if (edit.kind === 'rename') {
      setEntries(value => value.map(item => item.id === edit.id ? { ...item, name: label, modified: Date.now() } : item))
      notify('Item renamed', label)
    } else if (edit.kind === 'text' || edit.kind === 'folder') {
      const item: Entry = { id: crypto.randomUUID(), parent: location, name: label, kind: edit.kind, content: '', modified: Date.now() }
      setEntries(value => [...value, item])
      setSelection(item.id)
      notify(item.kind === 'folder' ? 'Folder created' : 'File created', item.name)
    }
    setEdit(null)
  }

  function itemKey(event: KeyboardEvent, item: Entry) {
    if (event.key === 'Enter') {
      event.preventDefault()
      open(item)
    }
    if (event.key === 'F2') { event.preventDefault(); begin('rename', item) }
    if (event.key === 'Delete') { event.preventDefault(); begin('delete', item) }
  }

  return <div className="app-stack explorer-app">
    <div className="app-toolbar file-toolbar">
      <button className="icon-button" title="Back" aria-label="Back" disabled={!history.length} onClick={back}><ArrowLeft size={17} /></button>
      <button className="icon-button" title="Go up" aria-label="Go up" disabled={location === root} onClick={() => navigate(current?.parent ?? root)}><ArrowUp size={17} /></button>
      <div className="file-path" aria-label="Current path">
        <button onClick={() => navigate(root)}><HardDrive size={15} /> Home</button>
        {crumbs.map(crumb => <div key={crumb.id}><ChevronRight size={13} /><button onClick={() => navigate(crumb.id)}>{crumb.name}</button></div>)}
      </div>
    </div>
    <div className="app-toolbar wrap">
      <button className="soft-button" onClick={() => begin('folder')}><FolderPlus size={16} /> New folder</button>
      <button className="soft-button" onClick={() => begin('text')}><FilePlus2 size={16} /> New file</button>
      <button className="icon-button" title="Rename" aria-label="Rename" disabled={!selected} onClick={() => begin('rename', selected)}><Pencil size={15} /></button>
      <button className="icon-button warning" title="Delete" aria-label="Delete" disabled={!selected} onClick={() => begin('delete', selected)}><Trash2 size={16} /></button>
    </div>
    {edit && <form className="inline-form" onSubmit={commit}>
      {edit.kind === 'delete' ? <label>Delete <strong>{name}</strong>{selected?.kind === 'folder' ? ' and its contents?' : '?'}</label>
        : <label>{edit.kind === 'rename' ? 'Rename item' : edit.kind === 'folder' ? 'Folder name' : 'File name'}
          <input key={(edit.id ?? '') + edit.kind} aria-label={edit.kind === 'rename' ? 'Rename item' : edit.kind === 'folder' ? 'Folder name' : 'File name'} autoFocus type="text" value={name} maxLength={90} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setEdit(null) }} />
        </label>}
      <button className={'accent-button ' + (edit.kind === 'delete' ? 'danger-button' : '')} type="submit">{edit.kind === 'delete' ? 'Delete item' : 'Save'}</button>
      <button className="soft-button" type="button" onClick={() => setEdit(null)}>Cancel</button>
      {error && <span className="form-error" role="alert">{error}</span>}
    </form>}
    <div className="file-body">
      <aside className="file-sidebar" aria-label="Folders">
        <button aria-current={location === root} onClick={() => navigate(root)}><Home size={16} /> Home</button>
        {folders.map(item => <button key={item.id} aria-current={location === item.id} onClick={() => navigate(item.id)}><Folder size={16} /> <span>{item.name}</span></button>)}
      </aside>
      <div className="file-list">
        {visible.length ? <>
          <div className="file-row file-head"><span>Name</span><span>Type</span><span>Modified</span></div>
          {visible.map(item => {
            const Icon = item.kind === 'folder' ? Folder : FileText
            return <button className="file-row" key={item.id} aria-pressed={selected?.id === item.id}
              onClick={() => setSelection(item.id)} onDoubleClick={() => open(item)} onKeyDown={event => itemKey(event, item)}>
              <span><Icon size={19} className={item.kind === 'folder' ? 'folder-color' : 'file-color'} />{item.name}</span>
              <span>{item.kind === 'folder' ? 'Folder' : 'Text file'}</span>
              <span>{item.modified ? new Date(item.modified).toLocaleDateString() : '—'}</span>
            </button>
          })}
        </> : <div className="app-empty"><Folder size={35} /><strong>This folder is empty</strong><span>Create a file or folder using the toolbar.</span></div>}
      </div>
    </div>
    <footer className="app-status"><span>{visible.length} {visible.length === 1 ? 'item' : 'items'}{storageError ? ' · Browser storage is full or unavailable' : ''}</span>
      {selected && <button className="soft-button" onClick={() => open(selected)}>Open {selected.kind === 'folder' ? 'folder' : 'file'}</button>}
    </footer>
  </div>
}
