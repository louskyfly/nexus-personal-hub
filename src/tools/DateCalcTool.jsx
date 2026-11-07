import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarClock, Copy, Minus, Plus } from 'lucide-react'
import { Segmented } from '../components/ui'
import { useToast } from '../components/Toast'
import { ISO_DAY, copyText, parseDay } from '../lib/utils'

function utcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffDetails(startValue, endValue) {
  const start = parseDay(startValue)
  const end = parseDay(endValue)
  if (!start || !end) return null
  const reversed = start > end
  const from = reversed ? end : start
  const to = reversed ? start : end
  const totalDays = Math.round((utcDay(to) - utcDay(from)) / 86400000)
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  let business = 0
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const capped = Math.min(totalDays, 36600)
  for (let index = 0; index < capped; index += 1) {
    const weekday = cursor.getDay()
    if (weekday !== 0 && weekday !== 6) business += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return {
    reversed,
    totalDays,
    weeks: Math.floor(totalDays / 7),
    remainderDays: totalDays % 7,
    years,
    months,
    days,
    business,
    from,
    to,
  }
}

function addToDate(baseValue, { years, months, weeks, days }, sign) {
  const base = parseDay(baseValue)
  if (!base) return null
  const targetYear = base.getFullYear() + sign * years
  const targetMonth = base.getMonth() + sign * months
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  const result = new Date(
    targetYear,
    targetMonth,
    Math.min(base.getDate(), lastDay),
  )
  result.setDate(result.getDate() + sign * (weeks * 7 + days))
  return result
}

const longFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function DateCalcTool() {
  const [tab, setTab] = useState('interval')
  const [start, setStart] = useState(() => ISO_DAY(new Date()))
  const [end, setEnd] = useState(() => ISO_DAY(new Date(Date.now() + 30 * 86400000)))
  const [base, setBase] = useState(() => ISO_DAY(new Date()))
  const [years, setYears] = useState(0)
  const [months, setMonths] = useState(0)
  const [weeks, setWeeks] = useState(0)
  const [days, setDays] = useState(30)
  const [direction, setDirection] = useState(1)
  const { toast } = useToast()

  const interval = useMemo(() => diffDetails(start, end), [start, end])
  const target = useMemo(
    () => addToDate(base, { years, months, weeks, days }, direction),
    [base, years, months, weeks, days, direction],
  )

  const copy = async (text) => {
    const ok = await copyText(text)
    toast({
      title: ok ? 'Date copiée' : 'Copie impossible',
      description: text,
      tone: ok ? 'success' : 'error',
      duration: 2200,
    })
  }

  return (
    <div className="tool datecalc-tool">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'interval', label: 'Intervalle', icon: ArrowLeftRight },
          { value: 'offset', label: 'Ajouter / soustraire', icon: CalendarClock },
        ]}
        ariaLabel="Mode de calcul"
      />

      {tab === 'interval' ? (
        <div className="datecalc-panel">
          <div className="date-inputs">
            <label className="field">
              <span className="field-label">Date de début</span>
              <input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
            </label>
            <span className="date-arrow">→</span>
            <label className="field">
              <span className="field-label">Date de fin</span>
              <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
            </label>
          </div>
          {interval ? (
            <>
              {interval.reversed ? <p className="inline-note">Les dates ont été remises dans l’ordre chronologique pour le calcul.</p> : null}
              <div className="date-hero-result">
                <span>Jours calendaires</span>
                <strong>{interval.totalDays}</strong>
                <small>{interval.business} jours ouvrés (lundi–vendredi)</small>
              </div>
              <div className="date-breakdown">
                <div><span>Années</span><strong>{interval.years}</strong></div>
                <div><span>Mois</span><strong>{interval.months}</strong></div>
                <div><span>Jours</span><strong>{interval.days}</strong></div>
                <div><span>Semaines</span><strong>{interval.weeks}</strong></div>
                <div><span>Jours restants</span><strong>{interval.remainderDays}</strong></div>
                <div><span>Total heures</span><strong>{interval.totalDays * 24}</strong></div>
              </div>
              <p className="hint">
                Du {longFormat.format(interval.from)} au {longFormat.format(interval.to)}. Le jour de début n’est pas compté.
              </p>
            </>
          ) : (
            <p className="inline-error">Choisissez deux dates valides.</p>
          )}
        </div>
      ) : (
        <div className="datecalc-panel">
          <div className="date-direction">
            <Segmented
              value={direction}
              onChange={setDirection}
              options={[
                { value: 1, label: 'Ajouter', icon: Plus },
                { value: -1, label: 'Soustraire', icon: Minus },
              ]}
              ariaLabel="Sens du calcul"
            />
          </div>
          <label className="field">
            <span className="field-label">Date de départ</span>
            <input type="date" value={base} onChange={(event) => setBase(event.target.value)} />
          </label>
          <div className="offset-grid">
            {[
              ['Années', years, setYears, 50],
              ['Mois', months, setMonths, 120],
              ['Semaines', weeks, setWeeks, 520],
              ['Jours', days, setDays, 3650],
            ].map(([label, value, setter, max]) => (
              <label key={label}>
                <span>{label}</span>
                <input
                  type="number"
                  min="0"
                  max={max}
                  value={value}
                  onChange={(event) => setter(Math.max(0, Number(event.target.value) || 0))}
                />
              </label>
            ))}
          </div>
          {target ? (
            <div className="date-target">
              <span className="date-target-label">{direction === 1 ? 'Date future' : 'Date passée'}</span>
              <strong>{longFormat.format(target)}</strong>
              <div className="date-target-meta">
                <code>{ISO_DAY(target)}</code>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(ISO_DAY(target))}>
                  <Copy size={13} /> Copier
                </button>
              </div>
            </div>
          ) : (
            <p className="inline-error">Choisissez une date de départ valide.</p>
          )}
        </div>
      )}
    </div>
  )
}
