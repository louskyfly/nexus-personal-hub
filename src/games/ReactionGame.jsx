import { useEffect, useRef, useState } from 'react'
import { Gauge, Hand, RotateCcw, Trophy, Zap } from 'lucide-react'
import { useData } from '../state/DataContext'
import { playSound } from '../lib/sound'
import { timeAgo } from '../lib/utils'

const TRIALS = 5

export default function ReactionGame({ onFinish }) {
  const { data } = useData()
  const [phase, setPhase] = useState('idle')
  const [results, setResults] = useState([])
  const [last, setLast] = useState(null)
  const [message, setMessage] = useState('')
  const timeoutRef = useRef(null)
  const readyRef = useRef(0)
  const recordedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const resultsRef = useRef(results)
  resultsRef.current = results
  onFinishRef.current = onFinish

  const best = data.stats.bests.reaction
  const sessions = data.stats.history.filter((entry) => entry.game === 'reaction').slice(0, 5)

  const clearTimer = () => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  const scheduleWait = () => {
    clearTimer()
    setPhase('waiting')
    setMessage('Attendez le vert…')
    const delay = 1100 + Math.random() * 2400
    timeoutRef.current = setTimeout(() => {
      readyRef.current = performance.now()
      setPhase('ready')
      setMessage('Cliquez maintenant !')
      playSound('point')
    }, delay)
  }

  const startSession = () => {
    clearTimer()
    setResults([])
    resultsRef.current = []
    setLast(null)
    setMessage('')
    recordedRef.current = false
    scheduleWait()
  }

  const completeSession = (allResults) => {
    const times = allResults.map((entry) => entry.ms)
    const bestMs = Math.min(...times)
    const average = Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)
    setPhase('summary')
    setMessage('')
    if (!recordedRef.current) {
      recordedRef.current = true
      onFinishRef.current?.({
        score: bestMs,
        outcome: 'played',
        detail: { ms: bestMs },
        label: `Meilleur : ${bestMs} ms · moyenne ${average} ms`,
      })
    }
    playSound('success')
  }

  const press = () => {
    if (phase === 'idle') {
      startSession()
      return
    }
    if (phase === 'waiting') {
      clearTimer()
      setPhase('early')
      setMessage('Trop tôt ! Attendez le signal vert.')
      playSound('error')
      return
    }
    if (phase === 'early') {
      scheduleWait()
      return
    }
    if (phase === 'ready') {
      const ms = Math.max(1, Math.round(performance.now() - readyRef.current))
      const nextResults = [...resultsRef.current, { ms, id: `${Date.now()}-${ms}` }]
      resultsRef.current = nextResults
      setResults(nextResults)
      setLast(ms)
      if (nextResults.length >= TRIALS) {
        completeSession(nextResults)
      } else {
        setPhase('between')
        setMessage(`Temps : ${ms} ms`)
        clearTimer()
        timeoutRef.current = setTimeout(() => scheduleWait(), 950)
      }
      return
    }
    if (phase === 'summary') {
      startSession()
    }
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault()
        press()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => () => clearTimer(), [])

  const times = results.map((entry) => entry.ms)
  const sessionBest = times.length ? Math.min(...times) : null
  const sessionAverage = times.length
    ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)
    : null
  const displayBest = best == null ? null : best
  const panelState = phase === 'ready' ? 'is-ready' : phase === 'waiting' ? 'is-waiting' : phase === 'early' ? 'is-early' : ''

  return (
    <div className="game reaction-game">
      <div className="game-hud">
        <div className="hud-stat">
          <span>Record</span>
          <strong><Trophy size={13} /> {displayBest != null ? `${displayBest} ms` : '—'}</strong>
        </div>
        <div className="hud-stat">
          <span>Manche</span>
          <strong>{Math.min(TRIALS, results.length + (phase === 'summary' ? 0 : 1))} / {TRIALS}</strong>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={startSession}>
            <RotateCcw size={14} /> Nouvelle série
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`reaction-panel ${panelState}`}
        onClick={press}
        aria-live="polite"
      >
        {phase === 'idle' ? (
          <>
            <span className="reaction-icon"><Zap size={30} /></span>
            <strong>Testez vos réflexes</strong>
            <span>5 essais. Cliquez dès que le panneau passe au vert.</span>
            <em>Cliquez pour commencer</em>
          </>
        ) : phase === 'waiting' ? (
          <>
            <span className="reaction-icon waiting"><Hand size={28} /></span>
            <strong>Attendez…</strong>
            <span>Ne cliquez pas avant le signal.</span>
          </>
        ) : phase === 'ready' ? (
          <>
            <strong className="reaction-go">CLIQUEZ !</strong>
            <span>Le plus vite possible.</span>
          </>
        ) : phase === 'early' ? (
          <>
            <span className="reaction-icon"><Zap size={28} /></span>
            <strong>Trop tôt</strong>
            <span>{message}</span>
            <em>Cliquez pour réessayer cet essai</em>
          </>
        ) : phase === 'between' ? (
          <>
            <strong className="reaction-ms">{last} <small>ms</small></strong>
            <span>Essayez de faire mieux au prochain essai…</span>
          </>
        ) : phase === 'summary' ? (
          <>
            <span className="reaction-icon"><Gauge size={28} /></span>
            <strong>Série terminée</strong>
            <span>Meilleur : {sessionBest} ms · moyenne : {sessionAverage} ms</span>
            <em>Cliquez ou appuyez sur Espace pour rejouer</em>
          </>
        ) : null}
      </button>

      {phase === 'early' ? (
        <button type="button" className="btn btn-primary full" onClick={scheduleWait}>
          Réessayer cet essai
        </button>
      ) : phase === 'idle' ? (
        <button type="button" className="btn btn-primary full" onClick={startSession}>
          Démarrer la série
        </button>
      ) : phase === 'summary' ? (
        <button type="button" className="btn btn-primary full" onClick={startSession}>
          <RotateCcw size={15} /> Nouvelle série
        </button>
      ) : null}

      <div className="reaction-trials">
        {Array.from({ length: TRIALS }, (_, index) => {
          const entry = results[index]
          return (
            <span key={index} className={`trial-pill ${entry ? 'is-filled' : ''} ${index === results.length && phase !== 'summary' ? 'is-current' : ''}`}>
              {entry ? `${entry.ms} ms` : index + 1}
            </span>
          )
        })}
      </div>

      {sessions.length ? (
        <div className="reaction-history">
          <span className="table-caption">Vos séries récentes</span>
          <ul>
            {sessions.map((entry) => (
              <li key={entry.id}>
                <span>{entry.label}</span>
                <small>{timeAgo(entry.at)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="game-hint">Terminez une série de 5 essais pour enregistrer votre meilleur temps.</p>
      )}
    </div>
  )
}
