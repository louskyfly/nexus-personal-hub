import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import { useToast } from '../components/Toast'
import { usePrefs } from '../state/PrefsContext'
import { copyText } from '../lib/utils'
import { playSound } from '../lib/sound'

const POOLS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
}
const AMBIGUOUS = /[Il1O0o]/g

function randomIndex(max) {
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

function shuffle(text) {
  const chars = [...text]
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1)
    ;[chars[index], chars[swap]] = [chars[swap], chars[index]]
  }
  return chars.join('')
}

function buildPassword(length, selected, excludeAmbiguous) {
  let pools = selected
    .map((key) => (excludeAmbiguous ? POOLS[key].replace(AMBIGUOUS, '') : POOLS[key]))
    .filter(Boolean)
  if (!pools.length) return ''
  const all = pools.join('')
  const chars = pools.map((pool) => pool[randomIndex(pool.length)])
  while (chars.length < length) chars.push(all[randomIndex(all.length)])
  return shuffle(chars.join('')).slice(0, length)
}

export default function PasswordTool() {
  const [length, setLength] = useState(20)
  const [count, setCount] = useState(1)
  const [selected, setSelected] = useState({ lower: true, upper: true, digits: true, symbols: true })
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true)
  const [passwords, setPasswords] = useState([])
  const [copied, setCopied] = useState(null)
  const { toast } = useToast()
  const { prefs } = usePrefs()

  const pools = Object.entries(selected).filter(([, value]) => value).map(([key]) => key)
  const alphabetSize = useMemo(
    () =>
      pools.reduce((total, key) => total + (excludeAmbiguous ? POOLS[key].replace(AMBIGUOUS, '') : POOLS[key]).length, 0),
    [pools, excludeAmbiguous],
  )
  const entropy = alphabetSize > 0 ? Math.round(length * Math.log2(alphabetSize)) : 0

  const generate = useCallback(() => {
    if (!pools.length) {
      setPasswords([])
      toast({ title: 'Choisissez au moins un type de caractères', tone: 'warning', duration: 2600 })
      return
    }
    const next = Array.from({ length: count }, () => buildPassword(length, pools, excludeAmbiguous))
    setPasswords(next)
    setCopied(null)
    playSound('point')
  }, [count, excludeAmbiguous, length, pools, toast])

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, count, excludeAmbiguous, selected.lower, selected.upper, selected.digits, selected.symbols])

  const copy = async (password, index) => {
    const ok = await copyText(password)
    if (ok) {
      setCopied(index)
      playSound('success')
      toast({ title: 'Mot de passe copié', description: 'Retenez-le avant de fermer cet outil.', duration: 3000 })
      setTimeout(() => setCopied(null), 1800)
    } else {
      toast({ title: 'Copie impossible', tone: 'error' })
    }
  }

  const strength = entropy >= 120 ? 'Excellent' : entropy >= 80 ? 'Fort' : entropy >= 50 ? 'Correct' : 'Faible'
  const strengthClass = entropy >= 120 ? 'excellent' : entropy >= 80 ? 'strong' : entropy >= 50 ? 'fair' : 'weak'

  return (
    <div className="tool password-tool">
      <div className="tool-note">
        <ShieldCheck size={16} />
        <p>
          Outil de démonstration : les mots de passe sont générés localement et ne sont <strong>jamais enregistrés</strong>.
          Fermer cette fenêtre les efface.
        </p>
      </div>

      <div className="password-outputs">
        {passwords.map((password, index) => (
          <div className="password-card" key={index}>
            <code>{password}</code>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(password, index)}>
              {copied === index ? <Check size={14} /> : <Copy size={14} />}
              {copied === index ? 'Copié' : 'Copier'}
            </button>
          </div>
        ))}
        {!passwords.length ? <p className="inline-error">Sélectionnez au moins une catégorie de caractères.</p> : null}
      </div>

      <div className="password-meter">
        <div className={`password-meter-bar ${strengthClass}`}>
          <span style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }} />
        </div>
        <span>Force : <strong>{strength}</strong> · ~{entropy} bits d’entropie</span>
      </div>

      <div className="tool-grid-2">
        <label className="slider-field">
          <span>Longueur <strong>{length}</strong> caractères</span>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span className="field-label">Nombre de mots de passe</span>
          <select value={count} onChange={(event) => setCount(Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className="password-options">
        {Object.entries({ lower: 'Minuscules', upper: 'Majuscules', digits: 'Chiffres', symbols: 'Symboles' }).map(([key, label]) => (
          <label className="check-row" key={key}>
            <input
              type="checkbox"
              checked={selected[key]}
              onChange={(event) => setSelected((prev) => ({ ...prev, [key]: event.target.checked }))}
            />
            <span>{label}</span>
          </label>
        ))}
        <label className="check-row">
          <input type="checkbox" checked={excludeAmbiguous} onChange={(event) => setExcludeAmbiguous(event.target.checked)} />
          <span>Éviter les caractères ambigus (Il1O0o)</span>
        </label>
      </div>

      <div className="tool-actions">
        <button type="button" className="btn btn-primary" onClick={generate}>
          <RefreshCw size={15} /> Régénérer
        </button>
        <span className="hint"><KeyRound size={13} /> Installez un gestionnaire de mots de passe pour un usage réel.</span>
      </div>
    </div>
  )
}
