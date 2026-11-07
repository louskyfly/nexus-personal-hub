import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { useData } from '../state/DataContext'
import { playSound } from '../lib/sound'

const SIZE = 4
let tileSequence = 0

const nextId = () => `tile_${++tileSequence}`

function makeTile(row, col, value) {
  return { id: nextId(), row, col, value, isNew: true, justMerged: false }
}

function emptyCells(tiles) {
  const occupied = new Set(tiles.map((tile) => `${tile.row}:${tile.col}`))
  const cells = []
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!occupied.has(`${row}:${col}`)) cells.push({ row, col })
    }
  }
  return cells
}

function spawn(tiles) {
  const cells = emptyCells(tiles)
  if (!cells.length) return tiles
  const spot = cells[Math.floor(Math.random() * cells.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  return [...tiles.map((tile) => ({ ...tile, isNew: false, justMerged: false })), makeTile(spot.row, spot.col, value)]
}

function gridOf(tiles) {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  for (const tile of tiles) grid[tile.row][tile.col] = tile
  return grid
}

function lineCoords(direction) {
  const lines = []
  if (direction === 'left' || direction === 'right') {
    for (let row = 0; row < SIZE; row += 1) {
      const cols = direction === 'left' ? [0, 1, 2, 3] : [3, 2, 1, 0]
      lines.push(cols.map((col) => [row, col]))
    }
  } else {
    for (let col = 0; col < SIZE; col += 1) {
      const rows = direction === 'up' ? [0, 1, 2, 3] : [3, 2, 1, 0]
      lines.push(rows.map((row) => [row, col]))
    }
  }
  return lines
}

function slide(tiles, direction) {
  const grid = gridOf(tiles)
  const result = []
  let gained = 0
  let moved = false

  for (const coords of lineCoords(direction)) {
    const lineTiles = coords.map(([row, col]) => grid[row][col]).filter(Boolean)
    const merged = []
    let index = 0
    while (index < lineTiles.length) {
      const tile = lineTiles[index]
      const following = lineTiles[index + 1]
      if (following && following.value === tile.value) {
        merged.push({ value: tile.value * 2, source: [tile, following] })
        index += 2
      } else {
        merged.push({ value: tile.value, source: [tile] })
        index += 1
      }
    }
    merged.forEach((entry, position) => {
      const [row, col] = coords[position]
      if (entry.source.length === 1) {
        const tile = entry.source[0]
        if (tile.row !== row || tile.col !== col) moved = true
        result.push({ ...tile, row, col, isNew: false, justMerged: false })
      } else {
        moved = true
        gained += entry.value
        result.push({
          id: nextId(),
          row,
          col,
          value: entry.value,
          isNew: false,
          justMerged: true,
        })
      }
    })
  }

  return { tiles: result, gained, moved }
}

function canMove(tiles) {
  if (tiles.length < SIZE * SIZE) return true
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const tile = tiles.find((item) => item.row === row && item.col === col)
      if (!tile) return true
      const right = tiles.find((item) => item.row === row && item.col === col + 1)
      const below = tiles.find((item) => item.row === row + 1 && item.col === col)
      if (right?.value === tile.value || below?.value === tile.value) return true
    }
  }
  return false
}

function initialTiles() {
  return spawn(spawn([]))
}

export default function Game2048({ onFinish }) {
  const { data } = useData()
  const [tiles, setTiles] = useState(initialTiles)
  const tilesRef = useRef(tiles)
  const [score, setScore] = useState(0)
  const scoreRef = useRef(0)
  const [best, setBest] = useState(data.stats.bests['2048'] ?? 0)
  const [status, setStatus] = useState('playing')
  const statusRef = useRef('playing')
  const [won, setWon] = useState(false)
  const [dims, setDims] = useState({ cell: 84, gap: 9 })
  const boardRef = useRef(null)
  const recordedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const pointerRef = useRef(null)

  onFinishRef.current = onFinish

  const sync = useCallback((nextTiles) => {
    tilesRef.current = nextTiles
    setTiles(nextTiles)
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return undefined
    const measure = () => {
      const width = board.clientWidth - 20
      if (width <= 0) return
      const gap = Math.max(7, Math.round(width * 0.024))
      const cell = (width - gap * (SIZE - 1)) / SIZE
      setDims({ cell, gap })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    measure()
    return () => observer.disconnect()
  }, [])

  const finish = useCallback((outcome, finalScore, maxTile) => {
    if (recordedRef.current) return
    recordedRef.current = true
    onFinishRef.current?.({
      score: finalScore,
      outcome,
      detail: { maxTile },
      label: `${finalScore} points · tuile ${maxTile}`,
    })
  }, [])

  const move = useCallback(
    (direction) => {
      if (statusRef.current !== 'playing') return
      const current = tilesRef.current
      const { tiles: movedTiles, gained, moved } = slide(current, direction)
      if (!moved) return
      const next = spawn(movedTiles)
      const nextScore = scoreRef.current + gained
      scoreRef.current = nextScore
      setScore(nextScore)
      setBest((value) => Math.max(value, nextScore))
      sync(next)
      if (gained) playSound('merge')
      else playSound('click')
      const maxTile = Math.max(...next.map((tile) => tile.value))
      if (maxTile >= 2048 && !won) {
        setWon(true)
        setStatus('won')
        statusRef.current = 'won'
        finish('win', nextScore, maxTile)
        playSound('win')
        return
      }
      if (!canMove(next)) {
        setStatus('over')
        statusRef.current = 'over'
        finish(maxTile >= 2048 ? 'win' : 'played', nextScore, maxTile)
        playSound('gameover')
      }
    },
    [finish, sync, won],
  )

  useEffect(() => {
    const onKey = (event) => {
      const direction = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', q: 'left', d: 'right', w: 'up', z: 'up', s: 'down',
      }[event.key]
      if (!direction) return
      event.preventDefault()
      move(direction)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [move])

  const restart = () => {
    const fresh = initialTiles()
    sync(fresh)
    scoreRef.current = 0
    setScore(0)
    setStatus('playing')
    statusRef.current = 'playing'
    setWon(false)
    recordedRef.current = false
    playSound('open')
  }

  const continueGame = () => {
    setStatus('playing')
    statusRef.current = 'playing'
  }

  const onPointerDown = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event) => {
    if (!pointerRef.current) return
    const dx = event.clientX - pointerRef.current.x
    const dy = event.clientY - pointerRef.current.y
    pointerRef.current = null
    if (Math.abs(dx) < 22 && Math.abs(dy) < 22) return
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left')
    else move(dy > 0 ? 'down' : 'up')
  }

  return (
    <div className="game game-2048">
      <div className="game-hud">
        <div className="hud-stat">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-stat">
          <span>Meilleur</span>
          <strong><Trophy size={13} /> {Math.max(best, score)}</strong>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={restart}>
            <RotateCcw size={14} /> Nouvelle partie
          </button>
        </div>
      </div>

      <div
        className="board-2048"
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="application"
        aria-label="Plateau 2048"
      >
        <div className="grid-bg" aria-hidden="true">
          {Array.from({ length: SIZE * SIZE }, (_, index) => <span key={index} />)}
        </div>
        <div className="tiles-layer" style={{ '--cell': `${dims.cell}px`, '--gap': `${dims.gap}px` }}>
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className={`tile-2048 value-${tile.value > 4096 ? 'super' : tile.value} ${tile.isNew ? 'is-new' : ''} ${tile.justMerged ? 'is-merged' : ''}`}
              style={{ '--row': tile.row, '--col': tile.col }}
            >
              <span className={`digits-${String(tile.value).length}`}>{tile.value}</span>
            </div>
          ))}
        </div>
        {status !== 'playing' ? (
          <div className="game-overlay overlay-2048">
            {status === 'won' ? (
              <>
                <span className="overlay-icon"><Sparkles size={26} /></span>
                <h3>2048 atteint !</h3>
                <p>Bravo — vous pouvez continuer à fusionner pour battre votre score.</p>
                <div className="overlay-actions">
                  <button type="button" className="btn btn-primary" onClick={continueGame}>Continuer</button>
                  <button type="button" className="btn btn-ghost" onClick={restart}>Rejouer</button>
                </div>
              </>
            ) : (
              <>
                <span className="overlay-icon"><Trophy size={24} /></span>
                <h3>Plus aucun mouvement</h3>
                <p>Score final : <strong>{score}</strong>. {score >= best ? 'Nouveau record personnel !' : `Meilleur score : ${best}`}</p>
                <button type="button" className="btn btn-primary" onClick={restart}>
                  <RotateCcw size={15} /> Recommencer
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="touch-dpad" aria-label="Commandes 2048">
        <button type="button" onClick={() => move('up')} aria-label="Haut"><ArrowUp size={17} /></button>
        <div>
          <button type="button" onClick={() => move('left')} aria-label="Gauche"><ArrowLeft size={17} /></button>
          <button type="button" onClick={() => move('down')} aria-label="Bas"><ArrowDown size={17} /></button>
          <button type="button" onClick={() => move('right')} aria-label="Droite"><ArrowRight size={17} /></button>
        </div>
      </div>
      <p className="game-hint">Flèches ou glissement · fusionnez les tuiles identiques pour atteindre 2048.</p>
    </div>
  )
}
