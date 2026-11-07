import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Trophy, Zap } from 'lucide-react'
import { useData } from '../state/DataContext'
import { Segmented } from '../components/ui'
import { playSound } from '../lib/sound'
import { clamp } from '../lib/utils'

const W = 800
const H = 500
const WIN_SCORE = 7

const AI_LEVELS = {
  easy: { label: 'Facile', speed: 250, error: 0.2 },
  normal: { label: 'Normal', speed: 360, error: 0.11 },
  hard: { label: 'Difficile', speed: 510, error: 0.035 },
}

function makeState(difficulty = 'normal') {
  return {
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 9 },
    player: { x: 22, y: H / 2 - 46, w: 12, h: 92 },
    ai: { x: W - 34, y: H / 2 - 46, w: 12, h: 92 },
    scores: { player: 0, ai: 0 },
    serveTimer: 0,
    difficulty,
    lastHit: '',
  }
}

export default function PongGame({ onFinish }) {
  const { data } = useData()
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('idle')
  const [difficulty, setDifficulty] = useState('normal')
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const stateRef = useRef(makeState('normal'))
  const statusRef = useRef('idle')
  const difficultyRef = useRef('normal')
  const keysRef = useRef({})
  const pointerRef = useRef(null)
  const rafRef = useRef(0)
  const lastTimeRef = useRef(0)
  const finishedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const best = data.stats.bests.pong ?? { wins: 0, losses: 0 }

  onFinishRef.current = onFinish
  statusRef.current = status
  difficultyRef.current = difficulty

  const serve = (direction = 1) => {
    const state = stateRef.current
    state.ball.x = W / 2
    state.ball.y = H / 2 + (Math.random() - 0.5) * 120
    const angle = (Math.random() - 0.5) * 0.45
    const speed = 400
    state.ball.vx = Math.cos(angle) * speed * direction
    state.ball.vy = Math.sin(angle) * speed
    state.serveTimer = 0.85
  }

  const reset = (ready = false) => {
    stateRef.current = makeState(difficultyRef.current)
    setScores({ player: 0, ai: 0 })
    finishedRef.current = false
    serve(Math.random() < 0.5 ? -1 : 1)
    setStatus(ready ? 'playing' : 'idle')
    statusRef.current = ready ? 'playing' : 'idle'
    if (ready) playSound('open')
  }

  const endMatch = (final) => {
    if (finishedRef.current) return
    finishedRef.current = true
    const won = final.player > final.ai
    setStatus('over')
    statusRef.current = 'over'
    playSound(won ? 'win' : 'gameover')
    onFinishRef.current?.({
      score: final.player,
      outcome: won ? 'win' : 'loss',
      detail: {
        won,
        difficulty: difficultyRef.current,
        playerScore: final.player,
        aiScore: final.ai,
      },
      label: `${final.player} – ${final.ai} · ${AI_LEVELS[difficultyRef.current].label}`,
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const context = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = W * dpr
    canvas.height = H * dpr

    const draw = () => {
      const state = stateRef.current
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const bg = context.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#0a1224')
      bg.addColorStop(1, '#060a13')
      context.fillStyle = bg
      context.fillRect(0, 0, W, H)

      context.strokeStyle = 'rgba(255,255,255,0.07)'
      context.lineWidth = 1
      context.strokeRect(28, 20, W - 56, H - 40)

      context.setLineDash([10, 14])
      context.strokeStyle = 'rgba(255,255,255,0.12)'
      context.beginPath()
      context.moveTo(W / 2, 30)
      context.lineTo(W / 2, H - 30)
      context.stroke()
      context.setLineDash([])

      context.fillStyle = 'rgba(255,255,255,0.045)'
      context.font = '700 116px SF Pro Display, Segoe UI, sans-serif'
      context.textAlign = 'center'
      context.fillText(String(state.scores.player), W / 2 - 120, H / 2 + 40)
      context.fillText(String(state.scores.ai), W / 2 + 120, H / 2 + 40)

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5b9dff'
      context.save()
      context.shadowColor = accent
      context.shadowBlur = 22
      context.fillStyle = '#ecf4ff'
      const { player, ai, ball } = state
      context.beginPath()
      context.roundRect(player.x, player.y, player.w, player.h, 6)
      context.fill()
      context.beginPath()
      context.roundRect(ai.x, ai.y, ai.w, ai.h, 6)
      context.fill()
      context.restore()

      context.save()
      context.shadowColor = accent
      context.shadowBlur = 26
      context.fillStyle = '#ffffff'
      context.beginPath()
      context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
      context.fill()
      context.restore()

      if (state.serveTimer > 0) {
        context.fillStyle = 'rgba(255,255,255,0.4)'
        context.font = '500 13px SF Pro Display, Segoe UI, sans-serif'
        context.textAlign = 'center'
        context.fillText('Engagement…', W / 2, H - 46)
      }
    }

    const step = (dt) => {
      const state = stateRef.current
      const config = AI_LEVELS[state.difficulty]
      if (statusRef.current !== 'playing') {
        draw()
        return
      }
      if (state.serveTimer > 0) {
        state.serveTimer -= dt
        if (state.serveTimer > 0) {
          draw()
          return
        }
      }

      if (pointerRef.current != null) {
        state.player.y = clamp(pointerRef.current - state.player.h / 2, 24, H - 24 - state.player.h)
      } else {
        const keys = keysRef.current
        const direction = (keys.ArrowDown || keys.s || keys.S ? 1 : 0) - (keys.ArrowUp || keys.z || keys.Z || keys.w || keys.W ? 1 : 0)
        state.player.y = clamp(state.player.y + direction * 560 * dt, 24, H - 24 - state.player.h)
      }

      let aiTarget = H / 2
      if (state.ball.vx > 0) {
        aiTarget = state.ball.y + Math.sin(performance.now() / 420) * H * config.error * 0.5
      }
      const aiCenter = state.ai.y + state.ai.h / 2
      const delta = aiTarget - aiCenter
      const move = clamp(delta, -config.speed * dt, config.speed * dt)
      state.ai.y = clamp(state.ai.y + move, 24, H - 24 - state.ai.h)

      const ball = state.ball
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      if (ball.y - ball.r <= 24) {
        ball.y = 24 + ball.r
        ball.vy = Math.abs(ball.vy)
        playSound('bounce')
      } else if (ball.y + ball.r >= H - 24) {
        ball.y = H - 24 - ball.r
        ball.vy = -Math.abs(ball.vy)
        playSound('bounce')
      }

      const hitsPlayer =
        ball.vx < 0 &&
        ball.x - ball.r <= state.player.x + state.player.w &&
        ball.x + ball.r >= state.player.x &&
        ball.y >= state.player.y - 4 &&
        ball.y <= state.player.y + state.player.h + 4
      if (hitsPlayer) {
        ball.x = state.player.x + state.player.w + ball.r
        const offset = (ball.y - (state.player.y + state.player.h / 2)) / (state.player.h / 2)
        const angle = clamp(offset, -1, 1) * 0.85
        const speed = Math.min(930, Math.hypot(ball.vx, ball.vy) * 1.06)
        ball.vx = Math.cos(angle) * speed
        ball.vy = Math.sin(angle) * speed
        playSound('point')
      }

      const hitsAi =
        ball.vx > 0 &&
        ball.x + ball.r >= state.ai.x &&
        ball.x - ball.r <= state.ai.x + state.ai.w &&
        ball.y >= state.ai.y - 4 &&
        ball.y <= state.ai.y + state.ai.h + 4
      if (hitsAi) {
        ball.x = state.ai.x - ball.r
        const offset = (ball.y - (state.ai.y + state.ai.h / 2)) / (state.ai.h / 2)
        const angle = clamp(offset, -1, 1) * 0.8
        const speed = Math.min(930, Math.hypot(ball.vx, ball.vy) * 1.055)
        ball.vx = -Math.cos(angle) * speed
        ball.vy = Math.sin(angle) * speed
        playSound('point')
      }

      if (ball.x < -30) {
        state.scores.ai += 1
        const next = { ...state.scores }
        setScores(next)
        if (next.ai >= WIN_SCORE || next.player >= WIN_SCORE) {
          endMatch(next)
        } else {
          serve(-1)
        }
        playSound('click')
      } else if (ball.x > W + 30) {
        state.scores.player += 1
        const next = { ...state.scores }
        setScores(next)
        if (next.player >= WIN_SCORE || next.ai >= WIN_SCORE) {
          endMatch(next)
        } else {
          serve(1)
        }
        playSound('point')
      }

      draw()
    }

    const loop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000)
      lastTimeRef.current = time
      step(dt)
      rafRef.current = requestAnimationFrame(loop)
    }

    draw()
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'z'].includes(event.key)) {
        event.preventDefault()
        keysRef.current[event.key] = true
      }
    }
    const onKeyUp = (event) => {
      keysRef.current[event.key] = false
    }
    const onVisibility = () => {
      if (document.hidden && statusRef.current === 'playing') {
        setStatus('paused')
        statusRef.current = 'paused'
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const changeDifficulty = (value) => {
    setDifficulty(value)
    difficultyRef.current = value
    stateRef.current.difficulty = value
    reset(false)
  }

  const pause = () => {
    if (status === 'playing') {
      setStatus('paused')
      statusRef.current = 'paused'
    } else if (status === 'paused') {
      setStatus('playing')
      statusRef.current = 'playing'
      lastTimeRef.current = 0
    }
    playSound('click')
  }

  const handlePointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    pointerRef.current = ((event.clientY - rect.top) / rect.height) * H
  }

  return (
    <div className="game pong-game">
      <div className="pong-scoreboard">
        <div className="pong-team">
          <span>Vous</span>
          <strong>{scores.player}</strong>
        </div>
        <div className="pong-mid">
          <span>Premier à {WIN_SCORE}</span>
          <div className="pong-record">
            <Trophy size={13} /> {best.wins ?? 0} V · {best.losses ?? 0} D
          </div>
        </div>
        <div className="pong-team right">
          <span>IA</span>
          <strong>{scores.ai}</strong>
        </div>
      </div>

      <div className="pong-board">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointer}
          onPointerLeave={() => { pointerRef.current = null }}
          onPointerDown={handlePointer}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          aria-label="Terrain de Pong"
        />
        {status !== 'playing' ? (
          <div className="game-overlay">
            {status === 'idle' ? (
              <>
                <span className="overlay-icon"><Zap size={24} /></span>
                <h3>Pong</h3>
                <p>Bougez votre raquette avec la souris, le doigt ou les flèches. Le premier à {WIN_SCORE} gagne.</p>
                <button type="button" className="btn btn-primary" onClick={() => reset(true)}>
                  <Play size={15} /> Engager la partie
                </button>
              </>
            ) : status === 'paused' ? (
              <>
                <span className="overlay-icon"><Pause size={24} /></span>
                <h3>Match en pause</h3>
                <button type="button" className="btn btn-primary" onClick={pause}>
                  <Play size={15} /> Reprendre
                </button>
              </>
            ) : (
              <>
                <span className="overlay-icon"><Trophy size={24} /></span>
                <h3>{scores.player > scores.ai ? 'Victoire !' : 'L’IA remporte le match'}</h3>
                <p>Score final : {scores.player} – {scores.ai}</p>
                <button type="button" className="btn btn-primary" onClick={() => reset(true)}>
                  <RotateCcw size={15} /> Revanche
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      <div className="pong-controls">
        <Segmented
          size="sm"
          value={difficulty}
          onChange={changeDifficulty}
          options={Object.entries(AI_LEVELS).map(([value, item]) => ({ value, label: item.label }))}
          ariaLabel="Difficulté de l’IA"
        />
        <div className="pong-actions">
          <button type="button" className="icon-btn" onClick={pause} disabled={status === 'idle' || status === 'over'} aria-label="Pause">
            {status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => reset(false)}>
            <RotateCcw size={14} /> Réinitialiser
          </button>
        </div>
      </div>
      <p className="game-hint">Souris ou doigt sur le terrain · flèches haut/bas · Z/S</p>
    </div>
  )
}
