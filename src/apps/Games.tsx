import { ArrowLeft, AudioLines, CircleDot, Cloud, Flame, Gamepad2, Hexagon, Radio, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStorage } from '../system/storage'
import { useWorkspace } from '../system/workspace'

const symbols = [AudioLines, Cloud, Flame, Hexagon, Radio, Sparkles]

function shuffled() {
  const deck = [...symbols.keys(), ...symbols.keys()]
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[other]] = [deck[other], deck[index]]
  }
  return deck
}

function SignalMatch() {
  const [deck, setDeck] = useState(shuffled)
  const [revealed, setRevealed] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [turns, setTurns] = useState(0)
  const [best, setBest] = useStorage('game-match-best', 0)
  const { notify } = useWorkspace()
  const won = matched.length === symbols.length

  function reset() { setDeck(shuffled()); setRevealed([]); setMatched([]); setTurns(0) }

  useEffect(() => {
    if (revealed.length !== 2) return
    const timer = window.setTimeout(() => setRevealed([]), 650)
    return () => window.clearTimeout(timer)
  }, [revealed])

  function flip(index: number) {
    if (revealed.length === 2 || revealed.includes(index) || matched.includes(deck[index])) return
    const first = revealed[0]
    if (first === undefined) { setRevealed([index]); return }
    const nextTurns = turns + 1
    setTurns(nextTurns)
    if (deck[first] === deck[index]) {
      const completed = [...matched, deck[index]]
      setMatched(completed)
      setRevealed([])
      if (completed.length === symbols.length) {
        if (!best || nextTurns < best) setBest(nextTurns)
        notify('All signals matched', `Completed in ${nextTurns} turns.`)
      }
      return
    }
    setRevealed([first, index])
  }

  return <>
    <div className="game-score"><span><b>{turns}</b> turns</span><span><b>{matched.length}/6</b> pairs</span><span>Best <b>{best || '—'}</b></span>
      <button className="soft-button" onClick={reset}><RotateCcw size={15} /> Restart</button></div>
    <div className="match-grid">{deck.map((symbol, index) => {
      const Icon = symbols[symbol]
      const open = matched.includes(symbol) || revealed.includes(index)
      return <button key={index} className={open ? 'tile-open' : ''} data-matched={matched.includes(symbol)}
        aria-label={open ? ['Sound wave', 'Cloud', 'Flame', 'Hexagon', 'Radio', 'Stars'][symbol] : 'Hidden card ' + (index + 1)}
        disabled={matched.includes(symbol) || revealed.includes(index) || revealed.length === 2} onClick={() => flip(index)}>
        {open ? <Icon size={24} /> : <CircleDot size={16} />}
      </button>
    })}</div>
    <p className="game-message" aria-live="polite">{won ? 'All signals matched!' : 'Flip two cards to find matching signals.'}</p>
  </>
}

function CalderaTap() {
  const [best, setBest] = useStorage('game-tap-best', 0)
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(20)
  const [target, setTarget] = useState(-1)
  const [deadline, setDeadline] = useState(0)
  const { windows } = useWorkspace()
  const visible = windows.active === 'games'

  useEffect(() => {
    if (!deadline) return
    const timer = window.setInterval(() => setTime(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 150)
    return () => window.clearInterval(timer)
  }, [deadline])

  useEffect(() => {
    if (deadline && time === 0) {
      setDeadline(0)
      setTarget(-1)
      setBest(previous => Math.max(previous, score))
    }
  }, [deadline, score, setBest, time])

  function start() {
    setDeadline(Date.now() + 20000)
    setScore(0)
    setTime(20)
    setTarget(Math.floor(Math.random() * 16))
  }

  function collect() {
    if (!visible || Date.now() >= deadline) return
    setScore(score + 1)
    setTarget((target + 1 + Math.floor(Math.random() * 15)) % 16)
  }

  return <>
    <div className="game-score"><span><b>{time}s</b> left</span><span><b>{score}</b> points</span><span>Best <b>{best}</b></span>
      <button className="soft-button" onClick={start}><Zap size={15} /> {deadline ? 'Restart' : 'Start round'}</button></div>
    <div className="match-grid tap-grid">{Array.from({ length: 16 }, (_, index) => <button key={index} className={target === index ? 'tile-open' : ''}
      aria-label={target === index ? 'Collect ember ' + (index + 1) : 'Tile ' + (index + 1)} aria-disabled={target !== index}
      onClick={() => { if (target === index) collect() }}>{target === index ? <Flame size={24} /> : <span />}</button>)}</div>
    <p className="game-message" aria-live="polite">{time === 0 ? `Round finished. You collected ${score} embers.` : 'Collect the glowing embers before time runs out.'}</p>
  </>
}

export function Games() {
  const [game, setGame] = useState<'match' | 'tap' | null>(null)
  return <div className="app-stack games-app">
    <div className="app-toolbar">{game ? <button className="icon-button" title="Back to games" aria-label="Back to games" onClick={() => setGame(null)}><ArrowLeft size={17} /></button> : <Gamepad2 size={19} />}
      <strong>{game === 'match' ? 'Signal Match' : game === 'tap' ? 'Caldera Tap' : 'Local arcade'}</strong></div>
    <div className="app-scroll games-body">
      {game === 'match' ? <SignalMatch /> : game === 'tap' ? <CalderaTap /> : <>
        <h1>Local arcade</h1><p>Play a quick round and beat your personal best.</p>
        <div className="game-picker">
          <button onClick={() => setGame('match')}><span><Radio size={27} /></span><strong>Signal Match</strong><small>Find six pairs of matching symbols.</small></button>
          <button onClick={() => setGame('tap')}><span><Flame size={27} /></span><strong>Caldera Tap</strong><small>Catch as many embers as you can in 20 seconds.</small></button>
        </div>
      </>}
    </div>
  </div>
}
