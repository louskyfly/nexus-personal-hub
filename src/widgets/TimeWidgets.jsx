import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hourglass,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useToast } from '../components/Toast'
import { EmptyState } from '../components/ui'
import { useNow } from '../lib/hooks'
import { playSound } from '../lib/sound'
import { ISO_DAY, formatStopwatch, formatTimer, pad2, parseDay } from '../lib/utils'

/* ------------------------------ Calendar ------------------------------ */

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendarWidget({ expanded = false }) {
  const now = useNow(30000)
  const today = ISO_DAY(now)
  const { prefs } = usePrefs()
  const weekStart = prefs.weekStart ?? 1
  const [cursor, setCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [draft, setDraft] = useState('')
  const { data, addTask, toggleTask, deleteTask } = useData()
  const { toast } = useToast()

  const dueByDay = useMemo(() => {
    const map = {}
    for (const task of data.tasks) {
      if (!task.due) continue
      map[task.due] = map[task.due] ?? { total: 0, done: 0 }
      map[task.due].total += 1
      if (task.done) map[task.due].done += 1
    }
    return map
  }, [data.tasks])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const offset = weekStart === 1 ? (firstWeekday + 6) % 7 : firstWeekday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weekLabels = weekStart === 1 ? WEEK_LABELS : [WEEK_LABELS[6], ...WEEK_LABELS.slice(0, 6)]

  const selectedTasks = data.tasks.filter((task) => task.due === selected)
  const visibleTasks = expanded ? selectedTasks : selectedTasks.slice(0, 2)

  const shiftMonth = (amount) => {
    const next = new Date(year, month + amount, 1)
    setCursor(next)
  }

  const submit = (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    addTask({ title: draft, due: selected })
    setDraft('')
    playSound('click')
    toast({
      title: 'Tâche planifiée',
      description: `${formatDayLabel(selected)}`,
      duration: 2600,
    })
  }

  return (
    <div className={`calendar-widget ${expanded ? 'is-expanded' : ''}`}>
      <div className="calendar-head">
        <button type="button" className="icon-btn" aria-label="Mois précédent" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="calendar-title"
          onClick={() => {
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
            setSelected(today)
          }}
          title="Revenir à aujourd’hui"
        >
          {MONTHS[month]} {year}
        </button>
        <button type="button" className="icon-btn" aria-label="Mois suivant" onClick={() => shiftMonth(1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">
        {weekLabels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <div className="calendar-grid" role="grid" aria-label={`Calendrier ${MONTHS[month]} ${year}`}>
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-empty" key={`empty-${index}`} />
          const dayKey = `${year}-${pad2(month + 1)}-${pad2(day)}`
          const info = dueByDay[dayKey]
          const isToday = dayKey === today
          const isSelected = dayKey === selected
          return (
            <button
              type="button"
              key={dayKey}
              className={`calendar-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => setSelected(dayKey)}
              aria-label={`${day} ${MONTHS[month]} ${year}${info ? `, ${info.total} tâche(s)` : ''}`}
              aria-pressed={isSelected}
            >
              <span>{day}</span>
              {info ? (
                <span className={`calendar-dot ${info.done === info.total ? 'is-done' : ''}`} />
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="calendar-selected">
        <div className="calendar-selected-head">
          <strong>{formatDayLabel(selected)}</strong>
          <small>{selectedTasks.length ? `${selectedTasks.filter((task) => task.done).length}/${selectedTasks.length} terminée${selectedTasks.length === 1 ? '' : 's'}` : 'Aucune tâche'}</small>
        </div>
        {visibleTasks.length ? (
          <ul className="calendar-tasks">
            {visibleTasks.map((task) => (
              <li key={task.id} className={task.done ? 'is-done' : ''}>
                <button
                  type="button"
                  className="task-check"
                  aria-label={task.done ? 'Marquer comme à faire' : 'Marquer comme terminée'}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? <Check size={11} /> : null}
                </button>
                <span>{task.title}</span>
                <button
                  type="button"
                  className="mini-icon"
                  aria-label="Supprimer la tâche"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {!expanded && selectedTasks.length > 2 ? (
          <p className="hint">+ {selectedTasks.length - 2} autre(s) tâche(s)</p>
        ) : null}
        <form className="calendar-add" onSubmit={submit}>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ajouter une tâche ce jour…"
            aria-label="Titre de la nouvelle tâche"
          />
          <button type="submit" className="icon-btn is-accent" aria-label="Ajouter la tâche" disabled={!draft.trim()}>
            <Plus size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}

function formatDayLabel(dayKey) {
  const date = parseDay(dayKey)
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/* ------------------------------ Stopwatch ------------------------------ */

export function StopwatchWidget({ expanded = false }) {
  const [running, setRunning] = useState(false)
  const [display, setDisplay] = useState(0)
  const [laps, setLaps] = useState([])
  const elapsedRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!running) return undefined
    const origin = performance.now()
    const base = elapsedRef.current
    const loop = () => {
      setDisplay(base + (performance.now() - origin))
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const toggle = () => {
    if (running) {
      elapsedRef.current = display
      setRunning(false)
      playSound('click')
    } else {
      setRunning(true)
      playSound('click')
    }
  }

  const reset = () => {
    setRunning(false)
    elapsedRef.current = 0
    setDisplay(0)
    setLaps([])
  }

  const lap = () => {
    if (!running) return
    const previous = laps[0]?.total ?? 0
    setLaps((prev) => [{ id: Date.now(), total: display, split: display - previous }, ...prev])
    playSound('point')
  }

  return (
    <div className={`stopwatch ${expanded ? 'is-expanded' : ''}`}>
      <div className="time-display">
        <span className="time-value">{formatStopwatch(display)}</span>
        <span className="time-caption">Chronomètre</span>
      </div>
      <div className="time-controls">
        <button type="button" className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`} onClick={toggle}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : display > 0 ? 'Reprendre' : 'Démarrer'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={lap} disabled={!running}>
          Tour
        </button>
        <button type="button" className="icon-btn" onClick={reset} aria-label="Réinitialiser" disabled={display === 0}>
          <RotateCcw size={15} />
        </button>
      </div>
      {laps.length ? (
        <ul className="lap-list">
          {laps.slice(0, expanded ? 12 : 3).map((entry, index) => (
            <li key={entry.id}>
              <span>Tour {laps.length - index}</span>
              <strong>+{formatStopwatch(entry.split)}</strong>
              <small>{formatStopwatch(entry.total)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Aucun tour enregistré. Lancez le chronomètre pour commencer.</p>
      )}
    </div>
  )
}

/* ------------------------------ Timer ------------------------------ */

const TIMER_PRESETS = [1, 3, 5, 10, 15, 25, 45]

export function TimerWidget({ expanded = false }) {
  const { prefs, setPref } = usePrefs()
  const { toast } = useToast()
  const initial = prefs.timerDuration ?? 300
  const [duration, setDuration] = useState(initial)
  const [remaining, setRemaining] = useState(initial)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const remainingRef = useRef(initial)

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (!running) return undefined
    const end = Date.now() + remainingRef.current * 1000
    const id = setInterval(() => {
      const left = Math.max(0, (end - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        setRunning(false)
        setDone(true)
        playSound('win')
        toast({
          title: 'Minuteur terminé',
          description: 'Le temps imparti est écoulé.',
          tone: 'success',
          duration: 7000,
        })
      }
    }, 100)
    return () => clearInterval(id)
  }, [running, toast])

  const setPreset = (minutes) => {
    if (running) return
    const seconds = minutes * 60
    setDuration(seconds)
    setRemaining(seconds)
    setDone(false)
    setPref('timerDuration', seconds)
    playSound('click')
  }

  const applyCustom = (minutes, seconds) => {
    if (running) return
    const total = Math.max(1, Math.round(minutes) * 60 + Math.round(seconds))
    setDuration(total)
    setRemaining(total)
    setDone(false)
    setPref('timerDuration', total)
  }

  const toggle = () => {
    if (running) {
      setRunning(false)
      playSound('click')
      return
    }
    if (remaining <= 0) {
      setRemaining(duration)
      remainingRef.current = duration
    }
    setDone(false)
    setRunning(true)
    setPref('timerDuration', duration)
    playSound('click')
  }

  const reset = () => {
    setRunning(false)
    setRemaining(duration)
    remainingRef.current = duration
    setDone(false)
  }

  const progress = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return (
    <div className={`timer-widget ${expanded ? 'is-expanded' : ''}`}>
      <div className="timer-ring" style={{ '--progress': `${progress * 100}%` }}>
        <div className="timer-inner">
          <span className={`timer-value ${done ? 'is-done' : ''}`}>{formatTimer(remaining * 1000)}</span>
          <small>{done ? 'Terminé' : running ? 'En cours' : 'Prêt'}</small>
        </div>
      </div>
      <div className="timer-presets">
        {TIMER_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className={duration === preset * 60 ? 'is-active' : ''}
            onClick={() => setPreset(preset)}
            disabled={running}
          >
            {preset}′
          </button>
        ))}
      </div>
      <div className="timer-custom">
        <label>
          <span>min</span>
          <input
            type="number"
            min="0"
            max="599"
            value={minutes}
            disabled={running}
            onChange={(event) => applyCustom(Number(event.target.value) || 0, seconds)}
          />
        </label>
        <label>
          <span>sec</span>
          <input
            type="number"
            min="0"
            max="59"
            value={seconds}
            disabled={running}
            onChange={(event) => applyCustom(minutes, Number(event.target.value) || 0)}
          />
        </label>
      </div>
      <div className="time-controls">
        <button type="button" className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`} onClick={toggle}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : 'Démarrer'}
        </button>
        <button type="button" className="icon-btn" onClick={reset} aria-label="Réinitialiser le minuteur">
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------ Countdown ------------------------------ */

export function CountdownWidget({ expanded = false }) {
  const { data, addCountdown, deleteCountdown } = useData()
  const { toast } = useToast()
  const now = useNow(1000)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')

  const events = useMemo(
    () => [...data.countdowns].sort((a, b) => new Date(a.target) - new Date(b.target)),
    [data.countdowns],
  )

  const submit = (event) => {
    event.preventDefault()
    if (!title.trim() || !target) return
    addCountdown({ title, target })
    setTitle('')
    setTarget('')
    setAdding(false)
    playSound('success')
    toast({ title: 'Compte à rebours créé', tone: 'success', duration: 2500 })
  }

  const visible = expanded ? events : events.slice(0, 2)

  return (
    <div className="countdown-widget">
      {visible.length ? (
        <ul className="countdown-list">
          {visible.map((item) => {
            const diff = new Date(item.target).getTime() - now.getTime()
            const past = diff <= 0
            const totalSeconds = Math.floor(Math.abs(diff) / 1000)
            const days = Math.floor(totalSeconds / 86400)
            const hours = Math.floor((totalSeconds % 86400) / 3600)
            const minutes = Math.floor((totalSeconds % 3600) / 60)
            const seconds = totalSeconds % 60
            return (
              <li key={item.id} className={past ? 'is-past' : ''}>
                <div className="countdown-copy">
                  <strong>{item.title}</strong>
                  <small>
                    {new Intl.DateTimeFormat('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(item.target))}
                  </small>
                </div>
                {past ? (
                  <span className="countdown-done">Échéance atteinte</span>
                ) : (
                  <div className="countdown-digits">
                    <span><strong>{days}</strong><small>j</small></span>
                    <span><strong>{pad2(hours)}</strong><small>h</small></span>
                    <span><strong>{pad2(minutes)}</strong><small>m</small></span>
                    <span><strong>{pad2(seconds)}</strong><small>s</small></span>
                  </div>
                )}
                <button type="button" className="mini-icon" aria-label="Supprimer" onClick={() => deleteCountdown(item.id)}>
                  <X size={13} />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState icon={Hourglass} compact title="Aucun compte à rebours" description="Ajoutez une date cible et suivez le temps restant." />
      )}
      {adding ? (
        <form className="countdown-form" onSubmit={submit}>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Événement (ex. vacances)"
            aria-label="Nom de l’événement"
            autoFocus
          />
          <input
            type="datetime-local"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            aria-label="Date et heure cible"
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!title.trim() || !target}>
              Créer
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm full" onClick={() => setAdding(true)}>
          <Plus size={14} /> Nouveau compte à rebours
        </button>
      )}
    </div>
  )
}

/* ------------------------------ World clock ------------------------------ */

const CLOCK_CITIES = [
  { zone: 'Europe/Paris', city: 'Paris' },
  { zone: 'Europe/London', city: 'Londres' },
  { zone: 'Europe/Berlin', city: 'Berlin' },
  { zone: 'Europe/Madrid', city: 'Madrid' },
  { zone: 'Europe/Moscow', city: 'Moscou' },
  { zone: 'America/New_York', city: 'New York' },
  { zone: 'America/Chicago', city: 'Chicago' },
  { zone: 'America/Los_Angeles', city: 'Los Angeles' },
  { zone: 'America/Sao_Paulo', city: 'São Paulo' },
  { zone: 'America/Mexico_City', city: 'Mexico' },
  { zone: 'Africa/Casablanca', city: 'Casablanca' },
  { zone: 'Africa/Johannesburg', city: 'Johannesburg' },
  { zone: 'Asia/Dubai', city: 'Dubaï' },
  { zone: 'Asia/Kolkata', city: 'Mumbai' },
  { zone: 'Asia/Singapore', city: 'Singapour' },
  { zone: 'Asia/Shanghai', city: 'Shanghai' },
  { zone: 'Asia/Tokyo', city: 'Tokyo' },
  { zone: 'Asia/Seoul', city: 'Séoul' },
  { zone: 'Australia/Sydney', city: 'Sydney' },
  { zone: 'Pacific/Auckland', city: 'Auckland' },
  { zone: 'Pacific/Honolulu', city: 'Honolulu' },
]

export function WorldClockWidget({ expanded = false }) {
  const { prefs, setPref } = usePrefs()
  const { toast } = useToast()
  const now = useNow(1000)
  const [pick, setPick] = useState('')
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const zones = [
    { zone: localZone, local: true },
    ...prefs.worldClocks.map((zone) => ({ zone, local: false })),
  ]

  const addZone = () => {
    if (!pick || prefs.worldClocks.includes(pick) || pick === localZone) {
      setPick('')
      return
    }
    setPref('worldClocks', [...prefs.worldClocks, pick])
    setPick('')
    playSound('open')
  }

  const removeZone = (zone) => {
    setPref('worldClocks', prefs.worldClocks.filter((item) => item !== zone))
    toast({ title: 'Fuseau retiré', duration: 2000 })
  }

  const localDayKey = dayKeyInZone(now, localZone)

  const visible = expanded ? zones : zones.slice(0, 3)

  return (
    <div className="world-clock">
      <ul className="world-list">
        {visible.map(({ zone, local }) => {
          const time = safeFormat(now, zone, {
            hour: '2-digit',
            minute: '2-digit',
            second: expanded ? '2-digit' : undefined,
            hour12: false,
          })
          const dayLabel = relativeDay(localDayKey, dayKeyInZone(now, zone))
          const tzLabel = safeFormat(now, zone, { timeZoneName: 'short' })
          const city = local ? 'Local' : CLOCK_CITIES.find((item) => item.zone === zone)?.city ?? zone.split('/').pop().replaceAll('_', ' ')
          return (
            <li key={zone}>
              <span className="clock-city">
                <strong>{city}</strong>
                <small>{dayLabel || tzLabel}</small>
              </span>
              <span className="clock-time">{time}</span>
              {!local ? (
                <button type="button" className="mini-icon" aria-label={`Retirer ${city}`} onClick={() => removeZone(zone)}>
                  <X size={12} />
                </button>
              ) : (
                <span className="clock-local-dot" title="Fuseau de cet appareil" />
              )}
            </li>
          )
        })}
      </ul>
      <div className="world-add">
        <select value={pick} onChange={(event) => setPick(event.target.value)} aria-label="Choisir un fuseau horaire">
          <option value="">Ajouter une ville…</option>
          {CLOCK_CITIES.filter((city) => city.zone !== localZone && !prefs.worldClocks.includes(city.zone)).map((city) => (
            <option key={city.zone} value={city.zone}>
              {city.city}
            </option>
          ))}
        </select>
        <button type="button" className="icon-btn" onClick={addZone} disabled={!pick} aria-label="Ajouter le fuseau">
          <Plus size={15} />
        </button>
      </div>
      {!expanded && zones.length > 3 ? <p className="hint">{zones.length - 3} autre(s) fuseau(x)</p> : null}
    </div>
  )
}

function safeFormat(date, zone, options) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: zone }).format(date)
  } catch {
    return '—'
  }
}

function dayKeyInZone(date, zone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: zone,
    }).format(date)
  } catch {
    return ''
  }
}

function relativeDay(localKey, remoteKey) {
  if (!localKey || !remoteKey || localKey === remoteKey) return ''
  const local = new Date(`${localKey}T12:00:00`)
  const remote = new Date(`${remoteKey}T12:00:00`)
  const diff = Math.round((remote - local) / 86400000)
  if (diff === 1) return 'Demain'
  if (diff === -1) return 'Hier'
  return diff > 0 ? `J+${diff}` : `J${diff}`
}
