import { ArrowRight, Command, Keyboard, MoveUpRight, Sparkles } from 'lucide-react'
import { AppGlyph, Tomato } from '../shell/Brand'
import { useWorkspace } from '../system/workspace'

export function Welcome() {
  const { launch } = useWorkspace()
  return (
    <div className="welcome-app">
      <div className="welcome-hero">
        <div className="welcome-orbit orbit-outer" />
        <div className="welcome-orbit orbit-inner" />
        <div className="welcome-mark" aria-hidden="true"><Tomato size={72} /></div>
        <div className="welcome-eyebrow"><span /> KETCHUP OS ONLINE</div>
        <h1>Make yourself<br />at home<span>.</span></h1>
        <p>Explore your files, open an app, or make this desktop your own.</p>
      </div>
      <div className="welcome-main">
        <h2>Get started</h2>
        <div className="quick-actions">
          <button onClick={() => launch('explorer')}>
            <AppGlyph id="explorer" tile size={19} />
            <span><strong>Explore files</strong><small>Open File Explorer</small></span><MoveUpRight size={14} />
          </button>
          <button onClick={() => launch('terminal')}>
            <AppGlyph id="terminal" tile size={19} />
            <span><strong>Run a command</strong><small>Open Terminal</small></span><MoveUpRight size={14} />
          </button>
          <button onClick={() => launch('settings', { preferenceTab: 'wallpaper' })}>
            <AppGlyph id="settings" tile size={19} />
            <span><strong>Personalize</strong><small>Change your wallpaper</small></span><MoveUpRight size={14} />
          </button>
        </div>
      </div>
      <footer className="welcome-footer">
        <span><Sparkles size={13} /> Your workspace is saved on this device.</span>
        <button onClick={() => launch('settings', { preferenceTab: 'system' })}><Keyboard size={15} /> Shortcuts <ArrowRight size={13} /></button>
      </footer>
    </div>
  )
}

export const shortcuts = [
  ['Alt + Shift + S', 'Open Start'],
  ['Alt + Shift + W', 'Switch windows'],
  ['Alt + Shift + D', 'Show or restore desktop'],
  ['Alt + Shift + X', 'Close active window'],
  ['Alt + Shift + T', 'Open Terminal'],
  ['Esc', 'Dismiss desktop menus'],
] as const

export function Shortcuts() {
  return <div className="shortcuts-list">{shortcuts.map(([key, purpose]) => (
    <div key={key}><span><Command size={14} />{purpose}</span><kbd>{key}</kbd></div>
  ))}</div>
}
