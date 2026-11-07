import { useEffect, useRef, useState } from 'react'
import { Eye, RotateCcw, Trophy, Timer } from 'lucide-react'
import { useData } from '../state/DataContext'
import { Segmented } from '../components/ui'
import { playSound } from '../lib/sound'
import { formatTimer } from '../lib/utils'

const LEVELS = {
  easy: { cols: 4, rows: 4, pairs: 8, label: 'Facile' },
  medium: { cols: 5, rows: 4, pairs: 10, label: 'Moyen' },
  hard: { cols: 6, rows: 5, pairs: 15, label: 'Difficile' },
}

const SYMBOLS = ['🍎', '🚀', '🌙', '⚡', '🎧', '🌈', '🪐', '🍀', '🎲', '🦊', '🔥', '🌊', '🍋', '🛰️', '🦋']

function buildDeck(pairs) {
  const chosen = SYMBOLS.slice(0, pairs)
  const cards = chosen.flatMap((symbol, index) => [
    { id: `pair-${index}-a`, symbol, pair: index, matched: false },
    { id: `pair-${index}-b`, symbol, pair: index, matched: false },
  ])
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards
}

export default function MemoryGame({ onFinish }) {
  const { data } = useData()
  const [level, setLevel] = useState('easy')
  const config = LEVELS[level]
  const [cards, setCards] = useState(() => buildDeck(LEVELS.easy.pairs))
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [status, setStatus] = useState('idle')
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef(null)
  const recordedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const timerRef = useRef(null)
  onFinishRef.current = onFinish

  const best = data.stats.bests.memory

  useEffect(() => {
    if (status !== 'playing') return undefined
    timerRef.current = setInterval(() => {
      if (startRef.current) {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
      }
    }, 250)
    return () => clearInterval(timerRef.current)
  }, [status])

  useEffect(() => {
    if (flipped.length !== 2) return undefined
    setLocked(true)
    const [first, second] = flipped
    const isPair = cards[first]?.symbol === cards[second]?.symbol
    const delay = isPair ? 420 : 820
    const timer = setTimeout(() => {
      if (isPair) {
        setCards((prev) =>
          prev.map((card, index) =>
            index === first || index === second ? { ...card, matched: true } : card,
          ),
        )
        const nextMatched = matched + 1
        setMatched(nextMatched)
        playSound('point')
        if (nextMatched >= config.pairs) {
          const finalSeconds = startRef.current
            ? Math.max(1, Math.round((Date.now() - startRef.current) / 1000))
            : 0
          setSeconds(finalSeconds)
          setStatus('won')
          if (!recordedRef.current) {
            recordedRef.current = true
            onFinishRef.current?.({
              score: attempts,
              outcome: 'win',
              detail: { completed: true, attempts, seconds: finalSeconds, level },
              label: `${config.label} · ${attempts} essais · ${finalSeconds} s`,
            })
          }
          playSound('win')
        } else {
          setFlipped([])
          setLocked(false)
        }
      } else {
        setFlipped([])
        setLocked(false)
        playSound('flip')
      }
    }, delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped])

  const flip = (index) => {
    if (locked || status === 'won') return
    const card = cards[index]
    if (!card || card.matched || flipped.includes(index)) return
    if (status === 'idle') {
      startRef.current = Date.now()
      setStatus('playing')
    }
    if (flipped.length === 1) {
      setAttempts((value) => value + 1)
      playSound('flip')
    } else {
      playSound('click')
    }
    setFlipped((prev) => [...prev, index])
  }

  const restart = (nextLevel = level) => {
    setLevel(nextLevel)
    const nextConfig = LEVELS[nextLevel]
    setCards(buildDeck(nextConfig.pairs))
    setFlipped([])
    setMatched(0)
    setAttempts(0)
    setLocked(false)
    setStatus('idle')
    setSeconds(0)
    startRef.current = null
    recordedRef.current = false
  }

  return (
    <div className="game memory-game">
      <div className="memory-toolbar">
        <Segmented
          size="sm"
          value={level}
          onChange={restart}
          options={Object.entries(LEVELS).map(([value, item]) => ({ value, label: item.label }))}
          ariaLabel="Niveau de Memory"
        />
        <div className="memory-stats">
          <span><Eye size={14} /> {attempts} essais</span>
          <span><Timer size={14} /> {formatTimer(seconds * 1000)}</span>
          <span><Trophy size={14} /> {best ? `${best.attempts} essais` : '—'}</span>
        </div>
      </div>

      <div
        className={`memory-board ${config.cols >= 6 ? 'is-dense' : ''}`}
        style={{ '--cols': config.cols, '--rows': config.rows }}
      >
        {cards.map((card, index) => {
          const isUp = card.matched || flipped.includes(index)
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card ${isUp ? 'is-up' : ''} ${card.matched ? 'is-matched' : ''}`}
              onClick={() => flip(index)}
              disabled={card.matched || status === 'won' || locked}
              aria-label={isUp ? card.symbol : 'Carte face cachée'}
            >
              <span className="memory-inner">
                <span className="memory-face memory-back">
                  <span className="memory-pattern" />
                </span>
                <span className="memory-face memory-front">{card.symbol}</span>
              </span>
            </button>
          )
        })}
      </div>

      {status === 'won' ? (
        <div className="memory-result glass">
          <strong>Toutes les paires trouvées !</strong>
          <span>{attempts} essais · {formatTimer(seconds * 1000)}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => restart()}>
            <RotateCcw size={14} /> Rejouer
          </button>
        </div>
      ) : (
        <div className="memory-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => restart()}>
            <RotateCcw size={14} /> Nouvelle partie
          </button>
          <span className="hint">{matched} / {config.pairs} paires trouvées · {config.cols}×{config.rows}</span>
        </div>
      )}
      <p className="game-hint">Retournez deux cartes identiques. Moins d’essais et moins de temps, meilleur est le score.</p>
    </div>
  )
}
