import { useMemo, useState } from 'react'
import { ArrowLeftRight, Delete, Dices, Sparkles } from 'lucide-react'
import { EmptyState } from '../components/ui'
import { useToast } from '../components/Toast'
import { evaluateExpression, formatCalcNumber, rawResult } from '../lib/calc'
import { UNIT_CATEGORIES, convertUnits, formatConverted, getCategory } from '../lib/units'
import { copyText, uid } from '../lib/utils'
import { playSound } from '../lib/sound'

/* ------------------------------ Calculator ------------------------------ */

export function CalculatorWidget({ expanded = false }) {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [angle, setAngle] = useState('deg')
  const [history, setHistory] = useState([])
  const [justEvaluated, setJustEvaluated] = useState(false)

  const preview = useMemo(() => {
    if (!expr.trim()) return null
    try {
      return formatCalcNumber(evaluateExpression(expr, angle))
    } catch {
      return null
    }
  }, [expr, angle])

  const reset = () => {
    setExpr('')
    setResult(null)
    setError('')
    setJustEvaluated(false)
  }

  const press = (token, type = 'num') => {
    setError('')
    const continuing = justEvaluated
    if (justEvaluated) {
      setResult(null)
      setJustEvaluated(false)
      if (type === 'op' || type === 'postfix') {
        const base = result?.raw != null ? rawResult(result.raw) : ''
        setExpr(base + token)
        return
      }
      if (type === 'func') {
        setExpr(`${token}(`)
        return
      }
      setExpr(token)
      return
    }
    setExpr((prev) => {
      if (prev.length > 150 && type !== 'op') return prev
      if (type === 'func') return `${prev}${token}(`
      return prev + token
    })
    if (continuing) setResult(null)
  }

  const backspace = () => {
    if (justEvaluated) {
      reset()
      return
    }
    setError('')
    setExpr((prev) => {
      const functions = ['sqrt(', 'sin(', 'cos(', 'tan(', 'ln(', 'log(']
      for (const fn of functions) {
        if (prev.endsWith(fn)) return prev.slice(0, -fn.length)
      }
      return prev.slice(0, -1)
    })
  }

  const toggleSign = () => {
    setError('')
    if (justEvaluated && result) {
      const flipped = -result.raw
      setExpr(rawResult(flipped))
      setResult(null)
      setJustEvaluated(false)
      return
    }
    setExpr((prev) => {
      if (!prev) return '−'
      const match = prev.match(/(\d+\.?\d*)$/)
      if (!match) return prev
      const start = prev.length - match[1].length
      const before = prev.slice(0, start)
      if (before.endsWith('−') || before.endsWith('-')) return before.slice(0, -1) + match[1]
      return `${before}−${match[1]}`
    })
  }

  const evaluate = () => {
    if (!expr.trim()) return
    try {
      const value = evaluateExpression(expr, angle)
      const text = formatCalcNumber(value)
      setResult({ text, raw: value })
      setError('')
      setJustEvaluated(true)
      setHistory((prev) =>
        [{ id: uid('calc'), expr, text, raw: value }, ...prev].slice(0, expanded ? 20 : 6),
      )
      playSound('point')
    } catch (cause) {
      setError(cause.message || 'Expression invalide')
      setResult(null)
    }
  }

  const handleKey = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const key = event.key
    if (/^[0-9.]$/.test(key)) {
      event.preventDefault()
      press(key)
      return
    }
    if (['+', '*', '/', '^'].includes(key)) {
      event.preventDefault()
      press({ '+': '+', '*': '×', '/': '÷', '^': '^' }[key], 'op')
      return
    }
    if (key === '-') {
      event.preventDefault()
      press('−', 'op')
      return
    }
    if (['%', '!'].includes(key)) {
      event.preventDefault()
      press(key, 'postfix')
      return
    }
    if (key === '(' || key === ')') {
      event.preventDefault()
      press(key, 'paren')
      return
    }
    if (key === 'Enter' || key === '=') {
      event.preventDefault()
      evaluate()
      return
    }
    if (key === 'Backspace') {
      event.preventDefault()
      backspace()
      return
    }
    if (key === 'Escape') {
      event.preventDefault()
      reset()
    }
  }

  return (
    <div className={`calculator ${expanded ? 'is-expanded' : ''}`} tabIndex={0} onKeyDown={handleKey} aria-label="Calculatrice scientifique">
      <div className="calc-screen">
        <div className="calc-topline">
          <button
            type="button"
            className="angle-chip"
            onClick={() => setAngle((value) => (value === 'deg' ? 'rad' : 'deg'))}
            aria-label={`Mode ${angle === 'deg' ? 'degrés' : 'radians'}, changer`}
          >
            {angle.toUpperCase()}
          </button>
          <span className="calc-hint">clavier actif</span>
        </div>
        <div className="calc-expression">{expr || '0'}</div>
        <div className={`calc-result ${error ? 'has-error' : ''}`} aria-live="polite">
          {error || (justEvaluated && result ? result.text : justEvaluated ? '' : preview ?? '')}
        </div>
      </div>
      <div className="calc-keys">
        <button type="button" className="calc-key key-ac" onClick={reset}>
          AC
        </button>
        <button type="button" className="calc-key key-fn" onClick={backspace} aria-label="Effacer le dernier caractère">
          <Delete size={16} />
        </button>
        {['sin', 'cos', 'tan'].map((label) => (
          <button
            key={label}
            type="button"
            className="calc-key key-fn"
            onClick={() => press(label, 'func')}
          >
            {label}
          </button>
        ))}
        <button type="button" className="calc-key key-fn" onClick={() => press('sqrt', 'func')}>√</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('ln', 'func')}>ln</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('log', 'func')}>log</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('^2', 'op')}>x²</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('^', 'op')}>xʸ</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('π', 'num')}>π</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('e', 'num')}>e</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('(', 'paren')}>(</button>
        <button type="button" className="calc-key key-fn" onClick={() => press(')', 'paren')}>)</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('abs', 'func')}>|x|</button>
        {['7', '8', '9'].map((digit) => (
          <button key={digit} type="button" className="calc-key key-num" onClick={() => press(digit)}>{digit}</button>
        ))}
        <button type="button" className="calc-key key-op" onClick={() => press('÷', 'op')}>÷</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('%', 'postfix')}>%</button>
        {['4', '5', '6'].map((digit) => (
          <button key={digit} type="button" className="calc-key key-num" onClick={() => press(digit)}>{digit}</button>
        ))}
        <button type="button" className="calc-key key-op" onClick={() => press('×', 'op')}>×</button>
        <button type="button" className="calc-key key-fn" onClick={() => press('!', 'postfix')}>x!</button>
        {['1', '2', '3'].map((digit) => (
          <button key={digit} type="button" className="calc-key key-num" onClick={() => press(digit)}>{digit}</button>
        ))}
        <button type="button" className="calc-key key-op" onClick={() => press('−', 'op')}>−</button>
        <button type="button" className="calc-key key-fn" onClick={toggleSign}>±</button>
        <button type="button" className="calc-key key-num" onClick={() => press('0')}>0</button>
        <button type="button" className="calc-key key-num" onClick={() => press('.')}>.</button>
        <button type="button" className="calc-key key-op" onClick={() => press('+', 'op')}>+</button>
        <button type="button" className="calc-key key-equal" onClick={evaluate}>=</button>
      </div>
      {expanded ? (
        <div className="calc-history">
          <div className="calc-history-head">
            <span>Historique de session</span>
            {history.length ? (
              <button type="button" className="link-btn" onClick={() => setHistory([])}>Effacer</button>
            ) : null}
          </div>
          {history.length ? (
            <ul>
              {history.slice(0, 6).map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setExpr(entry.expr)
                      setResult({ text: entry.text, raw: entry.raw })
                      setJustEvaluated(false)
                    }}
                    title="Réutiliser cette expression"
                  >
                    <span>{entry.expr}</span>
                    <strong>= {entry.text}</strong>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Vos calculs de la session apparaîtront ici.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------ Unit converter ------------------------------ */

export function ConverterWidget({ expanded = false }) {
  const [categoryId, setCategoryId] = useState('length')
  const [fromId, setFromId] = useState('m')
  const [toId, setToId] = useState('km')
  const [value, setValue] = useState('1')
  const { toast } = useToast()
  const category = getCategory(categoryId)
  const result = convertUnits(categoryId, fromId, toId, value)
  const formatted = formatConverted(result)

  const changeCategory = (id) => {
    const next = getCategory(id)
    setCategoryId(id)
    setFromId(next.units[0].id)
    setToId(next.units[1]?.id ?? next.units[0].id)
  }

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
    if (Number.isFinite(result)) setValue(String(Number(result.toPrecision(10))))
  }

  return (
    <div className={`converter ${expanded ? 'is-expanded' : ''}`}>
      <div className="converter-categories">
        <select value={categoryId} onChange={(event) => changeCategory(event.target.value)} aria-label="Catégorie d’unité">
          {UNIT_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="converter-row">
        <label className="converter-field">
          <span>Valeur</span>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            step="any"
            onChange={(event) => setValue(event.target.value)}
            aria-label="Valeur à convertir"
          />
        </label>
        <label className="converter-field">
          <span>De</span>
          <select value={fromId} onChange={(event) => setFromId(event.target.value)} aria-label="Unité de départ">
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="converter-swap">
        <button type="button" className="icon-btn" onClick={swap} aria-label="Inverser les unités">
          <ArrowLeftRight size={15} />
        </button>
      </div>
      <div className="converter-row">
        <label className="converter-field">
          <span>Vers</span>
          <select value={toId} onChange={(event) => setToId(event.target.value)} aria-label="Unité d’arrivée">
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.label}</option>
            ))}
          </select>
        </label>
        <div className="converter-result">
          <span>Résultat</span>
          <strong>{formatted}</strong>
          <button
            type="button"
            className="mini-icon"
            aria-label="Copier le résultat"
            onClick={async () => {
              const ok = await copyText(String(result))
              toast({ title: ok ? 'Résultat copié' : 'Copie impossible', tone: ok ? 'success' : 'error', duration: 2000 })
            }}
          >
            <Sparkles size={13} />
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="converter-table">
          <span className="table-caption">Toutes les unités pour {value || 0} {category.units.find((unit) => unit.id === fromId)?.label}</span>
          <ul>
            {category.units.map((unit) => (
              <li key={unit.id} className={unit.id === toId ? 'is-active' : ''}>
                <span>{unit.label}</span>
                <strong>{formatConverted(convertUnits(categoryId, fromId, unit.id, value))}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------ Random numbers ------------------------------ */

function secureRandom() {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] / 4294967295
  }
  return Math.random()
}

export function RandomWidget({ expanded = false }) {
  const [min, setMin] = useState('1')
  const [max, setMax] = useState('100')
  const [count, setCount] = useState('1')
  const [unique, setUnique] = useState(true)
  const [decimal, setDecimal] = useState(false)
  const [results, setResults] = useState([])
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const generate = () => {
    const low = Number(min)
    const high = Number(max)
    const total = Math.max(1, Math.min(50, Math.round(Number(count) || 1)))
    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      setError('Renseignez des bornes valides.')
      return
    }
    const [a, b] = low <= high ? [low, high] : [high, low]
    setError('')
    let values = []
    if (decimal) {
      values = Array.from({ length: total }, () => Number((a + secureRandom() * (b - a)).toFixed(4)))
    } else {
      const span = Math.floor(b) - Math.ceil(a) + 1
      if (unique && total > span) {
        setError(`Impossible de tirer ${total} entiers uniques entre ${Math.ceil(a)} et ${Math.floor(b)}.`)
        return
      }
      if (unique) {
        const pool = new Set()
        while (pool.size < total) pool.add(Math.floor(Math.ceil(a) + secureRandom() * span))
        values = [...pool]
      } else {
        values = Array.from({ length: total }, () => Math.floor(Math.ceil(a) + secureRandom() * span))
      }
    }
    setResults(values)
    setHistory((prev) => [{ id: uid('rnd'), values, at: Date.now() }, ...prev].slice(0, 10))
    playSound('point')
  }

  return (
    <div className={`random-widget ${expanded ? 'is-expanded' : ''}`}>
      <div className="random-grid">
        <label>
          <span>Min</span>
          <input type="number" value={min} onChange={(event) => setMin(event.target.value)} />
        </label>
        <label>
          <span>Max</span>
          <input type="number" value={max} onChange={(event) => setMax(event.target.value)} />
        </label>
        <label>
          <span>Nombre</span>
          <input type="number" min="1" max="50" value={count} onChange={(event) => setCount(event.target.value)} />
        </label>
      </div>
      <div className="random-options">
        <label className="check-row">
          <input type="checkbox" checked={unique} onChange={(event) => setUnique(event.target.checked)} disabled={decimal} />
          <span>Uniques</span>
        </label>
        <label className="check-row">
          <input type="checkbox" checked={decimal} onChange={(event) => setDecimal(event.target.checked)} />
          <span>Décimaux</span>
        </label>
      </div>
      <button type="button" className="btn btn-primary full" onClick={generate}>
        <Dices size={15} /> Lancer
      </button>
      {error ? <p className="inline-error">{error}</p> : null}
      {results.length ? (
        <div className="random-results" aria-live="polite">
          {results.slice(0, expanded ? 50 : 12).map((value, index) => (
            <span className="random-chip" key={`${value}-${index}`}>
              {new Intl.NumberFormat('fr-FR').format(value)}
            </span>
          ))}
        </div>
      ) : (
        <EmptyState icon={Dices} compact title="Prêt à tirer" description="Définissez une plage puis lancez le hasard." />
      )}
      {expanded && history.length ? (
        <div className="random-history">
          <span className="table-caption">Tirages récents</span>
          {history.map((entry) => (
            <div key={entry.id}>
              <small>{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(entry.at)}</small>
              <span>{entry.values.join(' · ')}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
