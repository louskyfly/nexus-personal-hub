import { useEffect, useRef, useState } from 'react'
import { Flag, RotateCcw, ShieldQuestion, Timer, Trophy } from 'lucide-react'
import { useData } from '../state/DataContext'
import { Segmented } from '../components/ui'
import { playSound } from '../lib/sound'

const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10, label: 'Débutant' },
  intermediate: { rows: 16, cols: 16, mines: 40, label: 'Intermédiaire' },
  expert: { rows: 16, cols: 30, mines: 99, label: 'Expert' },
}

function blankBoard(rows, cols) {
  return Array.from({ length: rows * cols }, () => ({
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  }))
}

function around(index, rows, cols) {
  const row = Math.floor(index / cols)
  const col = index % cols
  const list = []
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (!dr && !dc) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) list.push(nr * cols + nc)
    }
  }
  return list
}

function placeMines(board, rows, cols, mines, safeIndex) {
  const safe = new Set([safeIndex, ...around(safeIndex, rows, cols)])
  const candidates = []
  for (let index = 0; index < rows * cols; index += 1) {
    if (!safe.has(index)) candidates.push(index)
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[candidates[index], candidates[swap]] = [candidates[swap], candidates[index]]
  }
  const next = board.map((cell) => ({ ...cell }))
  candidates.slice(0, mines).forEach((index) => {
    next[index].mine = true
  })
  for (let index = 0; index < next.length; index += 1) {
    if (next[index].mine) continue
    next[index].adjacent = around(index, rows, cols).filter((neighbor) => next[neighbor].mine).length
  }
  return next
}

function revealCells(board, startIndex, rows, cols) {
  const next = board.map((cell) => ({ ...cell }))
  const stack = [startIndex]
  while (stack.length) {
    const index = stack.pop()
    const cell = next[index]
    if (!cell || cell.revealed || cell.flagged) continue
    cell.revealed = true
    if (cell.mine) continue
    if (cell.adjacent === 0) {
      for (const neighbor of around(index, rows, cols)) {
        if (!next[neighbor].revealed && !next[neighbor].flagged && !next[neighbor].mine) {
          stack.push(neighbor)
        }
      }
    }
  }
  return next
}

export default function Minesweeper({ onFinish }) {
  const { data } = useData()
  const [difficulty, setDifficulty] = useState('beginner')
  const config = DIFFICULTIES[difficulty]
  const [board, setBoard] = useState(() => blankBoard(config.rows, config.cols))
  const [status, setStatus] = useState('idle')
  const [time, setTime] = useState(0)
  const [flagMode, setFlagMode] = useState(false)
  const [exploded, setExploded] = useState(null)
  const boardRef = useRef(board)
  const statusRef = useRef(status)
  const startRef = useRef(null)
  const recordedRef = useRef(false)
  const onFinishRef = useRef(onFinish)

  boardRef.current = board
  statusRef.current = status
  onFinishRef.current = onFinish

  const best = data.stats.bests.minesweeper?.[difficulty] ?? null
  const flags = board.filter((cell) => cell.flagged).length
  const remaining = config.mines - flags

  useEffect(() => {
    if (status !== 'playing') return undefined
    const timer = setInterval(() => {
      if (!startRef.current) return
      setTime(Math.floor((Date.now() - startRef.current) / 1000))
    }, 250)
    return () => clearInterval(timer)
  }, [status])

  const restart = (nextDifficulty = difficulty) => {
    const nextConfig = DIFFICULTIES[nextDifficulty]
    setDifficulty(nextDifficulty)
    setBoard(blankBoard(nextConfig.rows, nextConfig.cols))
    setStatus('idle')
    setTime(0)
    setExploded(null)
    startRef.current = null
    recordedRef.current = false
    playSound('click')
  }

  const finish = (won, seconds) => {
    if (recordedRef.current) return
    recordedRef.current = true
    onFinishRef.current?.({
      score: won ? seconds : 0,
      outcome: won ? 'win' : 'loss',
      detail: { difficulty, won, seconds },
      label: `${config.label} · ${won ? `gagné en ${seconds} s` : 'partie perdue'}`,
    })
  }

  const evaluate = (nextBoard, seconds) => {
    const safeCells = config.rows * config.cols - config.mines
    const revealedSafe = nextBoard.filter((cell) => cell.revealed && !cell.mine).length
    if (revealedSafe < safeCells) return false
    const flagged = nextBoard.map((cell) => (cell.mine ? { ...cell, flagged: true } : cell))
    setBoard(flagged)
    setStatus('won')
    statusRef.current = 'won'
    finish(true, seconds)
    playSound('win')
    return true
  }

  const reveal = (index) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return
    const current = boardRef.current
    if (current[index].flagged || current[index].revealed) return

    let next = current
    if (statusRef.current === 'idle') {
      next = placeMines(current, config.rows, config.cols, config.mines, index)
      startRef.current = Date.now()
      setStatus('playing')
      statusRef.current = 'playing'
    }

    if (next[index].mine) {
      next = next.map((cell) => (cell.mine ? { ...cell, revealed: true } : cell))
      setBoard(next)
      setStatus('lost')
      statusRef.current = 'lost'
      setExploded(index)
      const seconds = startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0
      setTime(seconds)
      finish(false, seconds)
      playSound('gameover')
      return
    }

    next = revealCells(next, index, config.rows, config.cols)
    setBoard(next)
    const seconds = startRef.current ? Math.floor((Date.now() - startRef.current) / 1000) : 0
    setTime(seconds)
    evaluate(next, seconds)
  }

  const toggleFlag = (index) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return
    const current = boardRef.current
    if (current[index].revealed) return
    const isFlagged = current[index].flagged
    if (!isFlagged && remaining <= 0) return
    const next = current.map((cell, cellIndex) =>
      cellIndex === index ? { ...cell, flagged: !cell.flagged } : cell,
    )
    setBoard(next)
    setFlagMode(false)
    playSound('flag')
  }

  const handleClick = (index) => {
    if (flagMode) toggleFlag(index)
    else reveal(index)
  }

  return (
    <div className="game minesweeper-game">
      <div className="mines-toolbar">
        <Segmented
          size="sm"
          value={difficulty}
          onChange={restart}
          options={Object.entries(DIFFICULTIES).map(([value, item]) => ({ value, label: item.label }))}
          ariaLabel="Difficulté du démineur"
        />
        <div className="mines-counts">
          <span className="mines-counter" title="Drapeaux restants">
            <Flag size={14} /> {remaining}
          </span>
          <span className="mines-counter" title="Temps écoulé">
            <Timer size={14} /> {time} s
          </span>
          <span className="mines-counter best" title="Meilleur temps pour cette difficulté">
            <Trophy size={14} /> {best != null ? `${best} s` : '—'}
          </span>
        </div>
      </div>

      <div className="mines-actions">
        <button
          type="button"
          className={`btn btn-sm ${flagMode ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFlagMode((value) => !value)}
          aria-pressed={flagMode}
        >
          <Flag size={14} /> {flagMode ? 'Mode drapeau actif' : 'Mode drapeau'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => restart()}>
          <RotateCcw size={14} /> Recommencer
        </button>
        <span className="hint">Clic droit ou mode drapeau · premier clic toujours sûr</span>
      </div>

      <div className="mines-scroll">
        <div
          className={`mine-grid ${status === 'won' ? 'is-won' : ''}`}
          style={{
            '--cols': config.cols,
            '--mine-cell': config.cols <= 9 ? '42px' : config.cols <= 16 ? '31px' : '27px',
          }}
          role="grid"
          aria-label={`Démineur ${config.label}`}
        >
          {board.map((cell, index) => {
            const row = Math.floor(index / config.cols) + 1
            const col = (index % config.cols) + 1
            const showMine = cell.revealed && cell.mine
            return (
              <button
                type="button"
                key={index}
                className={[
                  'mine-cell',
                  cell.revealed ? 'is-revealed' : '',
                  cell.flagged ? 'is-flagged' : '',
                  showMine ? 'is-mine' : '',
                  exploded === index ? 'is-exploded' : '',
                  cell.revealed && !cell.mine ? 'is-safe' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleClick(index)}
                onContextMenu={(event) => {
                  event.preventDefault()
                  toggleFlag(index)
                }}
                aria-label={`Ligne ${row}, colonne ${col}${cell.revealed ? (cell.mine ? ', mine' : `, ${cell.adjacent} mines autour`) : cell.flagged ? ', drapeau' : ', cachée'}`}
                disabled={cell.revealed || status === 'won' || status === 'lost'}
              >
                {cell.flagged && !cell.revealed ? <Flag size={13} /> : null}
                {showMine ? <span className="mine-symbol">✹</span> : null}
                {cell.revealed && !cell.mine && cell.adjacent > 0 ? (
                  <span className={`mine-number num-${cell.adjacent}`}>{cell.adjacent}</span>
                ) : null}
              </button>
            )
          })}
        </div>
        {status === 'won' || status === 'lost' ? (
          <div className="mine-result glass">
            <strong>{status === 'won' ? 'Terrain nettoyé !' : 'Boum.'}</strong>
            <span>
              {status === 'won'
                ? `Temps : ${time} s${best != null && time <= best ? ' · nouveau record' : ''}`
                : 'Une mine a été déclenchée. Réessayez.'}
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => restart()}>
              <RotateCcw size={14} /> Nouvelle partie
            </button>
          </div>
        ) : null}
      </div>
      <p className="game-hint">
        <ShieldQuestion size={13} /> Le premier clic et ses voisins sont toujours sans mine.
      </p>
    </div>
  )
}
