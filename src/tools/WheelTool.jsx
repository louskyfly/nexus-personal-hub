import { useEffect, useMemo, useRef, useState } from 'react'
import { Disc3, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useToast } from '../components/Toast'
import { EmptyState } from '../components/ui'
import { usePrefs } from '../state/PrefsContext'
import { playSound } from '../lib/sound'

const DURATION = 4200
const MAX_OPTIONS = 12

function polar(cx, cy, radius, angle) {
  const rad = (angle * Math.PI) / 180
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  }
}

export default function WheelTool() {
  const { prefs, setPref } = usePrefs()
  const options = useMemo(
    () => (Array.isArray(prefs.wheelOptions) ? prefs.wheelOptions : []),
    [prefs.wheelOptions],
  )
  const setOptions = (next) => {
    setPref('wheelOptions', typeof next === 'function' ? next(options) : next)
  }
  const [draft, setDraft] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const timerRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const addOption = (event) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return
    if (options.length >= MAX_OPTIONS) {
      toast({ title: `Maximum ${MAX_OPTIONS} options`, tone: 'warning' })
      return
    }
    if (options.includes(value)) {
      toast({ title: 'Cette option existe déjà', tone: 'warning' })
      return
    }
    setOptions((prev) => [...(Array.isArray(prev) ? prev : []), value])
    setDraft('')
    setResult(null)
    playSound('click')
  }

  const removeOption = (value) => {
    setOptions((prev) => (Array.isArray(prev) ? prev.filter((item) => item !== value) : []))
    setResult(null)
  }

  const clearAll = () => {
    if (!options.length) return
    const previous = options
    setOptions([])
    setResult(null)
    toast({
      title: 'Options effacées',
      action: { label: 'Annuler', onClick: () => setOptions(previous) },
      duration: 5000,
    })
  }

  const spin = () => {
    if (spinning || options.length < 2) return
    setSpinning(true)
    setResult(null)
    const slice = 360 / options.length
    const index = Math.floor(Math.random() * options.length)
    const offset = index * slice + slice / 2
    const desired = (360 - offset) % 360
    const current = ((rotation % 360) + 360) % 360
    const delta = (desired - current + 360) % 360
    const turns = 5 + Math.floor(Math.random() * 2)
    const target = rotation + turns * 360 + delta
    setRotation(target)
    playSound('click')
    timerRef.current = setTimeout(() => {
      setSpinning(false)
      setResult(options[index])
      playSound('win')
    }, DURATION + 120)
  }

  const size = 340
  const center = size / 2
  const radius = center - 14
  const slice = options.length ? 360 / options.length : 360

  return (
    <div className="tool wheel-tool">
      <div className="wheel-stage">
        <div className="wheel-wrap">
          <div className="wheel-pointer" aria-hidden="true" />
          {options.length >= 2 ? (
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="wheel-svg"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: `transform ${DURATION}ms cubic-bezier(0.12, 0.72, 0.08, 1)`,
              }}
              role="img"
              aria-label="Roue des options"
            >
              {options.map((option, index) => {
                const start = index * slice
                const end = (index + 1) * slice
                const p1 = polar(center, center, radius, start)
                const p2 = polar(center, center, radius, end)
                const mid = start + slice / 2
                const label = polar(center, center, radius * 0.64, mid)
                const hue = Math.round((index / options.length) * 360)
                return (
                  <g key={option}>
                    <path
                      d={`M ${center} ${center} L ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${slice > 180 ? 1 : 0} 1 ${p2.x} ${p2.y} Z`}
                      fill={`hsla(${hue}, 68%, 58%, ${index % 2 ? 0.78 : 0.9})`}
                      stroke="rgba(5,8,16,0.45)"
                      strokeWidth="1"
                    />
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="wheel-label"
                      transform={`rotate(${mid} ${label.x} ${label.y})`}
                    >
                      {option.length > 16 ? `${option.slice(0, 15)}…` : option}
                    </text>
                  </g>
                )
              })}
              <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
              <circle cx={center} cy={center} r="26" fill="rgba(8,12,22,0.9)" stroke="rgba(255,255,255,0.2)" />
            </svg>
          ) : (
            <div className="wheel-empty">
              <Disc3 size={50} strokeWidth={1.2} />
              <strong>La roue attend vos options</strong>
              <span>Ajoutez au moins deux choix pour la lancer.</span>
            </div>
          )}
        </div>
        <div className="wheel-center-button">
          <button type="button" className="btn btn-primary" onClick={spin} disabled={spinning || options.length < 2}>
            {spinning ? 'La roue tourne…' : 'Tourner la roue'}
          </button>
          {result ? (
            <div className="wheel-result glass" role="status">
              <span><Sparkles size={13} /> Résultat</span>
              <strong>{result}</strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="wheel-side">
        <form className="wheel-add" onSubmit={addOption}>
          <input
            type="text"
            value={draft}
            maxLength={30}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ajouter une option…"
            aria-label="Nouvelle option"
          />
          <button type="submit" className="btn btn-secondary btn-sm" disabled={!draft.trim()}>
            <Plus size={14} /> Ajouter
          </button>
        </form>
        {options.length ? (
          <ul className="wheel-options">
            {[...options].reverse().map((option) => (
              <li key={option}>
                <span className="wheel-dot" style={{ '--hue': (options.indexOf(option) / options.length) * 360 }} />
                <span>{option}</span>
                <button type="button" className="mini-icon" onClick={() => removeOption(option)} aria-label={`Supprimer ${option}`}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Disc3} compact title="Aucune option" description="Vos choix apparaîtront ici et seront conservés sur cet appareil." />
        )}
        <div className="wheel-actions">
          <span className="hint">{options.length} / {MAX_OPTIONS} options</span>
          <button type="button" className="link-btn" onClick={clearAll} disabled={!options.length}>
            <Trash2 size={12} /> Vider
          </button>
        </div>
      </div>
    </div>
  )
}
