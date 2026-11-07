import { useMemo, useState } from 'react'
import { Coins, Dices, RotateCcw, Sparkles } from 'lucide-react'
import { Segmented } from '../components/ui'
import { useToast } from '../components/Toast'
import { RandomWidget } from '../widgets/MiscWidgets'
import { playSound } from '../lib/sound'
import { uid } from '../lib/utils'

const DICE = [4, 6, 8, 10, 12, 20, 100]

function secureInt(max) {
  if (globalThis.crypto?.getRandomValues) {
    const buffer = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / max) * max
    let value
    do {
      globalThis.crypto.getRandomValues(buffer)
      value = buffer[0]
    } while (value >= limit)
    return value % max
  }
  return Math.floor(Math.random() * max)
}

export default function RandomTool() {
  const [tab, setTab] = useState('numbers')
  const { toast } = useToast()

  return (
    <div className="tool random-tool">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'numbers', label: 'Nombres', icon: Sparkles },
          { value: 'dice', label: 'Dés', icon: Dices },
          { value: 'coin', label: 'Pile ou face', icon: Coins },
        ]}
        ariaLabel="Type de tirage"
      />
      {tab === 'numbers' ? <RandomWidget expanded /> : null}
      {tab === 'dice' ? <DicePanel toast={toast} /> : null}
      {tab === 'coin' ? <CoinPanel toast={toast} /> : null}
    </div>
  )
}

function DicePanel({ toast }) {
  const [sides, setSides] = useState(6)
  const [count, setCount] = useState(2)
  const [results, setResults] = useState([])
  const [history, setHistory] = useState([])

  const roll = () => {
    const values = Array.from({ length: count }, () => secureInt(sides) + 1)
    setResults(values)
    setHistory((prev) => [{ id: uid('roll'), values, sides, at: Date.now() }, ...prev].slice(0, 6))
    playSound('point')
  }

  return (
    <div className="dice-panel">
      <div className="dice-config">
        <label className="field">
          <span className="field-label">Type de dé</span>
          <select value={sides} onChange={(event) => setSides(Number(event.target.value))}>
            {DICE.map((value) => <option key={value} value={value}>Dé à {value} faces</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Nombre de dés</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <button type="button" className="btn btn-primary" onClick={roll}>
          <Dices size={15} /> Lancer
        </button>
      </div>
      <div className="dice-result">
        {results.length ? results.map((value, index) => (
          <span className={`die-face ${value === sides ? 'is-max' : ''}`} key={`${index}-${value}`}>{value}</span>
        )) : <span className="hint">Les dés apparaîtront ici.</span>}
      </div>
      {results.length > 1 ? (
        <div className="dice-total">
          <span>Total</span>
          <strong>{results.reduce((sum, value) => sum + value, 0)}</strong>
        </div>
      ) : null}
      {history.length ? (
        <div className="mini-history">
          <span className="table-caption">Lancers récents</span>
          {history.map((entry) => (
            <div key={entry.id}>
              <span>d{entry.sides} · {entry.values.join(' + ')}</span>
              <small>= {entry.values.reduce((sum, value) => sum + value, 0)}</small>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function CoinPanel({ toast }) {
  const [result, setResult] = useState(null)
  const [counts, setCounts] = useState({ pile: 0, face: 0 })
  const [flipping, setFlipping] = useState(false)

  const flip = () => {
    if (flipping) return
    setFlipping(true)
    playSound('click')
    setTimeout(() => {
      const next = secureInt(2) === 0 ? 'pile' : 'face'
      setResult(next)
      setCounts((prev) => ({ ...prev, [next]: prev[next] + 1 }))
      setFlipping(false)
      playSound('point')
    }, 520)
  }

  const reset = () => {
    setResult(null)
    setCounts({ pile: 0, face: 0 })
    toast({ title: 'Compteurs remis à zéro', duration: 2000 })
  }

  return (
    <div className="coin-panel">
      <button type="button" className={`coin ${flipping ? 'is-flipping' : ''} ${result ? `is-${result}` : ''}`} onClick={flip} aria-label="Lancer la pièce">
        <span>{result === 'pile' ? 'P' : result === 'face' ? 'F' : '?'}</span>
      </button>
      <div className="coin-copy">
        <strong>{flipping ? 'La pièce tourne…' : result ? (result === 'pile' ? 'Pile !' : 'Face !') : 'Lancez la pièce'}</strong>
        <span>Pile {counts.pile} · Face {counts.face}</span>
      </div>
      <div className="form-actions center">
        <button type="button" className="btn btn-primary" onClick={flip} disabled={flipping}>Lancer</button>
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={!counts.pile && !counts.face}>
          <RotateCcw size={14} /> Réinitialiser
        </button>
      </div>
    </div>
  )
}
