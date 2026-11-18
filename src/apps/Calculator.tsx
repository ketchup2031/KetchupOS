import { Delete } from 'lucide-react'
import { useState } from 'react'
import { calculate } from '../system/calculator'

const keys = [
  ['(', 'Left parenthesis'], [')', 'Right parenthesis'], ['%', 'Percent'], ['C', 'Clear'],
  ['√', 'Square root'], ['x²', 'Square'], ['⅟x', 'Reciprocal'], ['⌫', 'Backspace'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['÷', 'Divide'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['×', 'Multiply'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['−', 'Subtract'],
  ['±', 'Change sign'], ['0', '0'], ['.', 'Decimal point'], ['+', 'Add'],
] as const

export function Calculator() {
  const [expression, setExpression] = useState('')
  const [previous, setPrevious] = useState('')
  const [error, setError] = useState('')
  const [finished, setFinished] = useState(false)

  function solve() {
    if (!expression.trim()) return
    try {
      const result = calculate(expression)
      setPrevious(expression + ' =')
      setExpression(String(result))
      setFinished(true)
      setError('')
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Invalid expression')
    }
  }

  function press(key: string) {
    if (key === '=') { solve(); return }
    setError('')
    if (key === 'C') { setExpression(''); setPrevious(''); setFinished(false); return }
    if (key === '⌫') { setExpression(expression.slice(0, -1)); setFinished(false); return }
    const operation = ({ '±': '-', '√': 'sqrt', 'x²': 'sq', '⅟x': 'inv' } as Record<string, string>)[key]
    if (operation) {
      setExpression(expression ? operation + '(' + expression + ')' : key === '±' ? '-' : operation + '(')
      setFinished(false)
      return
    }
    const append = finished && /^[\d.(]$/.test(key) ? key : expression + key
    setExpression(append.slice(0, 200))
    setFinished(false)
  }

  return <form className="calculator-app" onSubmit={event => { event.preventDefault(); solve() }}>
    <div className="calc-screen">
      <div aria-live="polite">{error || previous || 'Standard calculator'}</div>
      <input aria-label="Expression" placeholder="0" value={expression} maxLength={200} spellCheck={false} onChange={event => {
        setExpression(event.target.value); setError(''); setFinished(false)
      }} onKeyDown={event => {
        if (event.key === '=' || event.key === 'Escape') {
          event.preventDefault()
          press(event.key === '=' ? '=' : 'C')
        }
      }} />
    </div>
    <div className="calc-keys">{keys.map(([key, title]) => <button type="button" key={key} aria-label={title} title={title} onClick={() => press(key)}>{key === '⌫' ? <Delete size={17} /> : key}</button>)}
      <button type="submit" className="calc-equals" aria-label="Equals">=</button>
    </div>
  </form>
}
