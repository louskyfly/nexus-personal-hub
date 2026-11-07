import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Crown,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { playSound } from '../lib/sound'
import { clamp } from '../lib/utils'

const GRID = 20
const START_INTERVAL = 168
const MIN_INTERVAL = 62

function initialSnake() {
  return [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ]
}

function randomFood(snake) {
  const occupied = new Set(snake.map((cell) => `${cell.x}:${cell.y}`))
  let guard = 0
  while (guard < 500) {
    const candidate = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    }
    if (!occupied.has(`${candidate.x}:${candidate.y}`)) return candidate
    guard += 1
  }
  return { x: 0, y: 0 }
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

export default function SnakeGame({ onFinish }) {
  const { data } = useData()
  const [status, setStatus] = useState('idle')
  const [score, setScore] = useState(0)
  const [length, setLength] = useState(3)
  const [speed, setSpeed] = useState(1)
  const [best, setBest] = useState(data.stats.bests.snake ?? 0)

  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const statusRef = useRef('idle')
  const snakeRef = useRef(initialSnake())
  const prevRef = useRef(initialSnake())
  const directionRef = useRef({ x: 1, y: 0 })
  const pendingRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 15, y: 10 })
  const intervalRef = useRef(START_INTERVAL)
  const lastTickRef = useRef(0)
  const rafRef = useRef(0)
  const sizeRef = useRef(400)
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const pointerRef = useRef(null)

  onFinishRef.current = onFinish
  statusRef.current = status

  const draw = useCallback((time) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    const size = sizeRef.current
    const cell = size / GRID
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, size, size)

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5b9dff'

    // board grid
    context.strokeStyle = 'rgba(255,255,255,0.045)'
    context.lineWidth = 1
    for (let index = 1; index < GRID; index += 1) {
      context.beginPath()
      context.moveTo(index * cell, 0)
      context.lineTo(index * cell, size)
      context.stroke()
      context.beginPath()
      context.moveTo(0, index * cell)
      context.lineTo(size, index * cell)
      context.stroke()
    }

    // food with soft pulse
    const food = foodRef.current
    const pulse = 1 + Math.sin(time / 280) * 0.08
    context.save()
    context.shadowColor = '#ffb35c'
    context.shadowBlur = 18
    context.fillStyle = '#ffbd6b'
    context.beginPath()
    context.arc(
      food.x * cell + cell / 2,
      food.y * cell + cell / 2,
      cell * 0.3 * pulse,
      0,
      Math.PI * 2,
    )
    context.fill()
    context.restore()

    const running = statusRef.current === 'running'
    const progress = running
      ? clamp((time - lastTickRef.current) / intervalRef.current, 0, 1)
      : 1
    const current = snakeRef.current
    const previous = prevRef.current

    for (let index = current.length - 1; index >= 0; index -= 1) {
      const cellNow = current[index]
      const cellBefore = previous[index] ?? cellNow
      const x = (cellBefore.x + (cellNow.x - cellBefore.x) * progress) * cell
      const y = (cellBefore.y + (cellNow.y - cellBefore.y) * progress) * cell
      const isHead = index === 0
      const fade = 1 - (index / Math.max(current.length, 1)) * 0.45
      context.globalAlpha = isHead ? 1 : fade
      context.fillStyle = isHead ? '#eaf4ff' : accent
      if (isHead) {
        context.shadowColor = accent
        context.shadowBlur = 16
      } else {
        context.shadowBlur = 0
      }
      const inset = isHead ? cell * 0.08 : cell * 0.12
      roundedRect(context, x + inset, y + inset, cell - inset * 2, cell - inset * 2, cell * 0.3)
      context.fill()
      if (isHead) {
        context.shadowBlur = 0
        context.fillStyle = '#0a1020'
        const eye = cell * 0.12
        const dir = directionRef.current
        const cx = x + cell / 2 + dir.x * cell * 0.16
        const cy = y + cell / 2 + dir.y * cell * 0.16
        const perp = { x: -dir.y, y: dir.x }
        context.beginPath()
        context.arc(cx + perp.x * eye, cy + perp.y * eye, cell * 0.055, 0, Math.PI * 2)
        context.arc(cx - perp.x * eye, cy - perp.y * eye, cell * 0.055, 0, Math.PI * 2)
        context.fill()
      }
    }
    context.globalAlpha = 1
  }, [])

  const die = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setStatus('over')
    statusRef.current = 'over'
    playSound('gameover')
    setBest((value) => Math.max(value, scoreRef.current))
    onFinishRef.current?.({
      score: scoreRef.current,
      outcome: 'played',
      label: `${scoreRef.current} points · ${snakeRef.current.length} segments`,
    })
  }, [])

  const step = useCallback(() => {
    const current = snakeRef.current
    prevRef.current = current.map((cell) => ({ ...cell }))
    directionRef.current = pendingRef.current
    const head = current[0]
    const next = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y,
    }
    const eating = next.x === foodRef.current.x && next.y === foodRef.current.y
    if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
      die()
      return
    }
    const body = eating ? current : current.slice(0, -1)
    if (body.some((cell) => cell.x === next.x && cell.y === next.y)) {
      die()
      return
    }
    const grown = [next, ...current]
    if (!eating) grown.pop()
    snakeRef.current = grown
    if (eating) {
      scoreRef.current += 10
      setScore(scoreRef.current)
      setLength(grown.length)
      intervalRef.current = Math.max(MIN_INTERVAL, intervalRef.current - 7)
      setSpeed(Math.min(9, 1 + Math.floor((START_INTERVAL - intervalRef.current) / 12)))
      foodRef.current = randomFood(grown)
      playSound('point')
    }
  }, [die])

  const reset = useCallback((autostart = false) => {
    const snake = initialSnake()
    snakeRef.current = snake
    prevRef.current = snake.map((cell) => ({ ...cell }))
    directionRef.current = { x: 1, y: 0 }
    pendingRef.current = { x: 1, y: 0 }
    foodRef.current = randomFood(snake)
    intervalRef.current = START_INTERVAL
    scoreRef.current = 0
    finishedRef.current = false
    lastTickRef.current = performance.now()
    setScore(0)
    setLength(3)
    setSpeed(1)
    setStatus(autostart ? 'running' : 'idle')
    statusRef.current = autostart ? 'running' : 'idle'
    if (autostart) playSound('open')
  }, [])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return undefined
    const measure = () => {
      const rect = board.getBoundingClientRect()
      sizeRef.current = Math.max(200, Math.floor(rect.width))
      draw(performance.now())
    }
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    measure()

    const loop = (time) => {
      if (statusRef.current === 'running') {
        if (time - lastTickRef.current >= intervalRef.current) {
          lastTickRef.current = time
          step()
        }
      }
      draw(time)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw, step])

  useEffect(() => {
    const changeDirection = (x, y) => {
      const current = directionRef.current
      if (current.x === -x && current.y === -y) return
      pendingRef.current = { x, y }
      if (statusRef.current === 'idle' || statusRef.current === 'over') {
        reset(true)
        pendingRef.current = { x, y }
      } else if (statusRef.current === 'paused') {
        setStatus('running')
        lastTickRef.current = performance.now()
      }
    }
    const onKey = (event) => {
      const key = event.key
      const lower = key.toLowerCase()
      const map = {
        arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0],
        w: [0, -1], z: [0, -1], s: [0, 1], a: [-1, 0], q: [-1, 0], d: [1, 0],
      }
      if (!map[lower]) return
      event.preventDefault()
      changeDirection(...map[lower])
    }
    window.addEventListener('keydown', onKey)
    const onVisibility = () => {
      if (document.hidden && statusRef.current === 'running') {
        setStatus('paused')
        statusRef.current = 'paused'
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reset])

  const changeDirection = (x, y) => {
    const current = directionRef.current
    if (current.x === -x && current.y === -y) return
    pendingRef.current = { x, y }
    if (statusRef.current === 'idle' || statusRef.current === 'over') {
      reset(true)
      pendingRef.current = { x, y }
    } else if (statusRef.current === 'paused') {
      setStatus('running')
      statusRef.current = 'running'
      lastTickRef.current = performance.now()
    }
  }

  const pause = () => {
    if (status === 'running') {
      setStatus('paused')
      statusRef.current = 'paused'
      playSound('click')
    } else if (status === 'paused') {
      setStatus('running')
      statusRef.current = 'running'
      lastTickRef.current = performance.now()
      playSound('click')
    }
  }

  const onPointerDown = (event) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event) => {
    if (!pointerRef.current) return
    const dx = event.clientX - pointerRef.current.x
    const dy = event.clientY - pointerRef.current.y
    pointerRef.current = null
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
    if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? 1 : -1, 0)
    else changeDirection(0, dy > 0 ? 1 : -1)
  }

  return (
    <div className="game snake-game">
      <div className="game-hud">
        <div className="hud-stat">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-stat">
          <span>Record</span>
          <strong><Trophy size={13} /> {Math.max(best, score)}</strong>
        </div>
        <div className="hud-stat">
          <span>Longueur</span>
          <strong>{length}</strong>
        </div>
        <div className="hud-stat">
          <span>Vitesse</span>
          <strong><Gauge size={13} /> {speed}</strong>
        </div>
        <div className="hud-actions">
          <button type="button" className="icon-btn" onClick={pause} disabled={status === 'idle' || status === 'over'} aria-label={status === 'paused' ? 'Reprendre' : 'Pause'}>
            {status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button type="button" className="icon-btn" onClick={() => reset(false)} aria-label="Recommencer">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div
        className="snake-board"
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="application"
        aria-label="Plateau de Snake"
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        {status !== 'running' ? (
          <div className="game-overlay">
            {status === 'idle' ? (
              <>
                <span className="overlay-icon"><Crown size={26} /></span>
                <h3>Snake</h3>
                <p>Un serpent, des orbes, aucune seconde à perdre. Chaque orbe accélère la cadence.</p>
                <button type="button" className="btn btn-primary" onClick={() => reset(true)}>
                  <Play size={15} /> Commencer
                </button>
                <small>Flèches, ZQSD ou glissement</small>
              </>
            ) : status === 'paused' ? (
              <>
                <span className="overlay-icon"><Pause size={24} /></span>
                <h3>En pause</h3>
                <p>Le serpent vous attend.</p>
                <button type="button" className="btn btn-primary" onClick={pause}>
                  <Play size={15} /> Reprendre
                </button>
              </>
            ) : (
              <>
                <span className="overlay-icon"><Trophy size={24} /></span>
                <h3>Partie terminée</h3>
                <p>Score final : <strong>{score}</strong> · {score >= Math.max(best, 1) ? 'Nouveau record !' : `Record : ${best}`}</p>
                <button type="button" className="btn btn-primary" onClick={() => reset(true)}>
                  <RotateCcw size={15} /> Rejouer
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="touch-dpad" aria-label="Commandes directionnelles">
        <button type="button" onClick={() => changeDirection(0, -1)} aria-label="Haut"><ArrowUp size={17} /></button>
        <div>
          <button type="button" onClick={() => changeDirection(-1, 0)} aria-label="Gauche"><ArrowLeft size={17} /></button>
          <button type="button" onClick={() => changeDirection(0, 1)} aria-label="Bas"><ArrowDown size={17} /></button>
          <button type="button" onClick={() => changeDirection(1, 0)} aria-label="Droite"><ArrowRight size={17} /></button>
        </div>
      </div>
      <p className="game-hint">Flèches ou ZQSD · glissez sur le plateau · le jeu accélère tous les 2 orbes.</p>
    </div>
  )
}
