const unaryFunctions: Record<string, (value: number) => number> = {
  sqrt: Math.sqrt, sq: value => value ** 2, inv: value => 1 / value, abs: Math.abs,
}

export function calculate(source: string): number {
  const remaining = source.toLowerCase().replace(/\s/g, '').replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-')
  const tokens = remaining.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+\-*/^%]/gi) ?? []
  if (tokens.join('') !== remaining || !tokens.length || tokens.length > 200) throw new Error('Invalid expression')
  let index = 0

  function take(expected: string) {
    if (tokens[index] !== expected) return false
    index += 1
    return true
  }
  function group(): number {
    const value = sum()
    if (!take(')')) throw new Error('Missing closing parenthesis')
    return value
  }
  function primary(): number {
    if (take('(')) return group()
    const token = tokens[index++]
    if (token === 'pi') return Math.PI
    if (token && Object.hasOwn(unaryFunctions, token)) {
      if (!take('(')) throw new Error('Use parentheses after ' + token)
      return unaryFunctions[token](group())
    }
    if (!token || !/^(?:\d|\.\d)/.test(token)) throw new Error('Expected a number')
    return Number(token)
  }
  function power(): number {
    let value = primary()
    while (take('%')) value /= 100
    return take('^') ? value ** signed() : value
  }
  function signed(): number {
    if (take('+')) return signed()
    if (take('-')) return -signed()
    return power()
  }
  function product(): number {
    let value = signed()
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++]
      const right = signed()
      value = operator === '*' ? value * right : value / right
    }
    return value
  }
  function sum(): number {
    let value = product()
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++]
      const right = product()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }

  const result = sum()
  if (index !== tokens.length) throw new Error('Unexpected token: ' + tokens[index])
  if (!Number.isFinite(result)) throw new Error('Result is undefined')
  return Object.is(result, -0) ? 0 : Number(result.toPrecision(12))
}
