import { TerminalSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { appIds, apps } from '../system/apps'
import { useStorage } from '../system/storage'
import { findAt, getEntryError, getEntryPath, root, useWorkspace } from '../system/workspace'
import type { Entry } from '../system/workspace'

interface Line { command: string; path: string; output: string }
const help = `Commands
  help                 Show this list
  ls [path]            List files and folders
  pwd                  Show the current path
  cd <folder>          Change folder
  cat <file>           Read a text file
  mkdir <name>         Create a folder here
  touch <name>         Create an empty file here
  open <app>           Launch an app (try open notes)
  apps                 List launch names
  echo <text>          Print text
  date                 Show the current date and time
  whoami               Show the local user
  clear                Clear the screen

Use ↑ and ↓ to browse command history. Quote paths with spaces.`

export function Terminal() {
  const { entries, setEntries, launch, notify, windows } = useWorkspace()
  const [history, saveHistory] = useStorage<string[]>('terminal-history', [])
  const [position, setPosition] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [input, setInput] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [cwd, setCwd] = useState(root)
  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const active = windows.active === 'terminal'
  const folder = entries.some(entry => entry.id === cwd && entry.kind === 'folder') ? cwd : root
  const path = '/' + getEntryPath(entries, folder).map(item => item.name).join('/')

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight
  }, [lines])

  useEffect(() => {
    if (active) inputRef.current?.focus({ preventScroll: true })
  }, [active])

  function commandResult(command: string, args: string[]): string {
    const inputPath = args.join(' ')
    switch (command) {
      case 'help': return help
      case 'pwd': return path
      case 'whoami': return 'guest'
      case 'date': return new Date().toLocaleString()
      case 'echo': return inputPath
      case 'apps': return appIds.map(id => id.padEnd(13) + apps[id].name).join('\n')
      case 'open': {
        const app = appIds.find(id => id === inputPath.toLowerCase() || apps[id].name.toLowerCase() === inputPath.toLowerCase())
        if (!app) return 'App not found. Run apps to list launch names.'
        launch(app)
        return 'Opened ' + apps[app].name + '.'
      }
      case 'ls': {
        const target = findAt(entries, folder, inputPath || '.')
        if (!target) return 'Path not found: ' + inputPath
        if (target.kind !== 'folder') return target.name
        return entries.filter(item => item.parent === target.id).map(entry => entry.name + (entry.kind === 'folder' ? '/' : '')).sort().join('   ') || '(empty)'
      }
      case 'cd': {
        const target = findAt(entries, folder, inputPath || '/')
        if (!target || target.kind !== 'folder') return 'Folder not found: ' + inputPath
        setCwd(target.id)
        return ''
      }
      case 'cat': {
        const target = inputPath ? findAt(entries, folder, inputPath) : undefined
        return target?.kind === 'text' ? target.content : 'Usage: cat <text file>'
      }
      case 'mkdir':
      case 'touch': {
        const kind = command === 'mkdir' ? 'folder' : 'text'
        const problem = getEntryError(entries, folder, inputPath)
        if (problem) return problem
        const item: Entry = { id: crypto.randomUUID(), parent: folder, name: inputPath, kind, content: '', modified: Date.now() }
        setEntries(current => [...current, item])
        notify(kind === 'folder' ? 'Folder created' : 'File created', inputPath)
        return 'Created ' + inputPath
      }
      default: return command + ': command not found. Try help.'
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text) return
    saveHistory(previous => previous.at(-1) === text ? previous : [...previous, text].slice(-100))
    setPosition(null)
    setInput('')
    const words = [...text.matchAll(/"([^"]*)"|'([^']*)'|[^\s"']+/g)].map(match => match[1] ?? match[2] ?? match[0])
    const [command, ...args] = words
    if (command?.toLowerCase() === 'clear') {
      setLines([])
      return
    }
    const output = command ? commandResult(command.toLowerCase(), args) : 'Enter a command.'
    setLines(previous => [...previous, { command: text, path, output }].slice(-150))
  }

  function restoreHistory(direction: -1 | 1) {
    if (!history.length) return
    if (position === null && direction > 0) return
    if (position === null) setDraft(input)
    const next = Math.max(0, (position ?? history.length) + direction)
    if (next >= history.length) {
      setPosition(null)
      setInput(draft)
    } else {
      setPosition(next)
      setInput(history[next])
    }
  }

  return <div className="terminal-app">
    <div className="terminal-tab"><TerminalSquare size={15} /> workspace <span>local shell</span></div>
    <div className="terminal-output" ref={outputRef} aria-live="polite" aria-label="Terminal output">
      <p className="terminal-intro">Ketchup OS Online · Local terminal<br /><span>Type <button onClick={() => { setInput('help'); inputRef.current?.focus() }}>help</button> to list available commands.</span></p>
      {lines.map((line, index) => <div className="terminal-entry" key={index}>
        <div><span className="prompt-user">guest@ketchup</span><span className="prompt-path">{line.path}</span> $ {line.command}</div>
        {line.output && <pre>{line.output}</pre>}
      </div>)}
    </div>
    <form className="terminal-input" onSubmit={submit}>
      <label htmlFor="terminal-command"><span className="prompt-user">guest@ketchup</span><span className="prompt-path">{path}</span> $</label>
      <input ref={inputRef} id="terminal-command" aria-label="Terminal command" autoComplete="off" spellCheck={false} maxLength={500}
        value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => {
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); restoreHistory(event.key === 'ArrowUp' ? -1 : 1) }
          if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); setLines([]) }
        }} />
    </form>
  </div>
}
