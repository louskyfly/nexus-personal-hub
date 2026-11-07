/* Safe scientific expression evaluator for the calculator widget. */

const FUNCTIONS = {
  sin: (x, deg) => Math.sin(deg ? (x * Math.PI) / 180 : x),
  cos: (x, deg) => Math.cos(deg ? (x * Math.PI) / 180 : x),
  tan: (x, deg) => Math.tan(deg ? (x * Math.PI) / 180 : x),
  asin: (x, deg) => (deg ? (Math.asin(x) * 180) / Math.PI : Math.asin(x)),
  acos: (x, deg) => (deg ? (Math.acos(x) * 180) / Math.PI : Math.acos(x)),
  atan: (x, deg) => (deg ? (Math.atan(x) * 180) / Math.PI : Math.atan(x)),
  sqrt: (x) => Math.sqrt(x),
  abs: (x) => Math.abs(x),
  ln: (x) => Math.log(x),
  log: (x) => Math.log10(x),
  exp: (x) => Math.exp(x),
  round: (x) => Math.round(x),
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
}

const CONSTANTS = {
  pi: Math.PI,
  'π': Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
}

function tokenize(source) {
  const input = source
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .replace(/,/g, '.')
  const tokens = []
  let index = 0
  while (index < input.length) {
    const char = input[index]
    if (/\s/.test(char)) {
      index += 1
      continue
    }
    if (/[0-9.]/.test(char)) {
      let raw = ''
      while (index < input.length && /[0-9.]/.test(input[index])) {
        raw += input[index]
        index += 1
      }
      const value = Number(raw)
      if (!Number.isFinite(value)) throw new Error('Nombre invalide')
      tokens.push({ type: 'number', value })
      continue
    }
    if (/[a-zA-Z_]/.test(char)) {
      let raw = ''
      while (index < input.length && /[a-zA-Z_]/.test(input[index])) {
        raw += input[index]
        index += 1
      }
      tokens.push({ type: 'ident', value: raw.toLowerCase() })
      continue
    }
    if ('+-*/^%!()'.includes(char)) {
      tokens.push({ type: char === '*' || char === '/' || char === '^' ? 'op' : char === '(' || char === ')' ? char : 'op', value: char })
      index += 1
      continue
    }
    throw new Error(`Caractère invalide : ${char}`)
  }
  return tokens
}

function factorial(value) {
  if (!Number.isInteger(value) || value < 0) throw new Error('Factorielle entière uniquement')
  if (value > 170) return Infinity
  let result = 1
  for (let index = 2; index <= value; index += 1) result *= index
  return result
}

class Parser {
  constructor(tokens, angleMode) {
    this.tokens = tokens
    this.index = 0
    this.deg = angleMode === 'deg'
  }

  peek() {
    return this.tokens[this.index]
  }

  next() {
    const token = this.tokens[this.index]
    this.index += 1
    return token
  }

  atEnd() {
    return this.index >= this.tokens.length
  }

  startsPrimary(token) {
    return token && (token.type === 'number' || token.type === 'ident' || token.value === '(')
  }

  parse() {
    if (!this.tokens.length) throw new Error('Expression vide')
    const value = this.parseAdditive()
    if (!this.atEnd()) throw new Error('Expression incomplète')
    if (!Number.isFinite(value)) throw new Error('Résultat hors limites')
    return value
  }

  parseAdditive() {
    let left = this.parseMultiplicative()
    while (this.peek()?.type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value
      const right = this.parseMultiplicative()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  parseMultiplicative() {
    let left = this.parseUnary()
    for (;;) {
      const token = this.peek()
      if (token?.type === 'op' && (token.value === '*' || token.value === '/')) {
        this.next()
        const right = this.parseUnary()
        if (token.value === '/' && right === 0) throw new Error('Division par zéro')
        left = token.value === '*' ? left * right : left / right
        continue
      }
      if (this.startsPrimary(token)) {
        // Implicit multiplication: 2π, 3(4+1), 2sin(30)
        const right = this.parseUnary()
        left *= right
        continue
      }
      break
    }
    return left
  }

  parseUnary() {
    const token = this.peek()
    if (token?.type === 'op' && (token.value === '+' || token.value === '-')) {
      this.next()
      const value = this.parseUnary()
      return token.value === '-' ? -value : value
    }
    return this.parsePower()
  }

  parsePower() {
    const base = this.parsePostfix()
    if (this.peek()?.type === 'op' && this.peek().value === '^') {
      this.next()
      const exponent = this.parseUnary()
      return Math.pow(base, exponent)
    }
    return base
  }

  parsePostfix() {
    let value = this.parsePrimary()
    for (;;) {
      const token = this.peek()
      if (token?.type === 'op' && token.value === '!') {
        this.next()
        value = factorial(value)
        continue
      }
      if (token?.type === 'op' && token.value === '%') {
        this.next()
        value /= 100
        continue
      }
      break
    }
    return value
  }

  parsePrimary() {
    const token = this.next()
    if (!token) throw new Error('Expression incomplète')
    if (token.type === 'number') return token.value
    if (token.value === '(') {
      const value = this.parseAdditive()
      if (this.next()?.value !== ')') throw new Error('Parenthèse manquante')
      return value
    }
    if (token.type === 'ident') {
      const name = token.value
      if (name in CONSTANTS) return CONSTANTS[name]
      const fn = FUNCTIONS[name]
      if (!fn) throw new Error(`Fonction inconnue : ${name}`)
      if (this.next()?.value !== '(') throw new Error('Parenthèse attendue')
      const argument = this.parseAdditive()
      if (this.next()?.value !== ')') throw new Error('Parenthèse manquante')
      const result = fn(argument, this.deg)
      if (typeof result === 'number' && Number.isNaN(result)) throw new Error('Domaine invalide')
      return result
    }
    throw new Error('Expression invalide')
  }
}

export function evaluateExpression(expression, angleMode = 'deg') {
  return new Parser(tokenize(expression), angleMode).parse()
}

export function formatCalcNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Erreur'
  if (!Number.isFinite(value)) return '∞'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e12 || abs < 1e-9) {
    return value
      .toExponential(8)
      .replace('.', ',')
      .replace(/e\+?/, ' × 10^')
  }
  const rounded = Number(value.toPrecision(12))
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 12,
    maximumSignificantDigits: 12,
  }).format(rounded)
}

export function rawResult(value) {
  return String(Number(value.toPrecision(14)))
}
