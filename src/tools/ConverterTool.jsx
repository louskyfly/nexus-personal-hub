import { useMemo, useState } from 'react'
import { ArrowLeftRight, Check, Copy, Hash, Type } from 'lucide-react'
import { Segmented } from '../components/ui'
import { useToast } from '../components/Toast'
import { ConverterWidget } from '../widgets/MiscWidgets'
import { copyText } from '../lib/utils'

const BASES = [
  { value: 2, label: 'Binaire (2)' },
  { value: 8, label: 'Octal (8)' },
  { value: 10, label: 'Décimal (10)' },
  { value: 16, label: 'Hexadécimal (16)' },
]

const VALID = {
  2: /^-?[01]+$/,
  8: /^-?[0-7]+$/,
  10: /^-?\d+$/,
  16: /^-?[0-9a-f]+$/i,
}

function parseInBase(value, base) {
  const clean = value.trim().replace(/[\s_]/g, '')
  if (!clean || !VALID[base].test(clean)) return null
  try {
    const negative = clean.startsWith('-')
    const digits = negative ? clean.slice(1) : clean
    let result = 0n
    for (const char of digits.toLowerCase()) {
      const digit = parseInt(char, 16)
      if (digit >= base) return null
      result = result * BigInt(base) + BigInt(digit)
    }
    return negative ? -result : result
  } catch {
    return null
  }
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(text) {
  const binary = atob(text.trim())
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export default function ConverterTool() {
  const [tab, setTab] = useState('units')
  const [baseValue, setBaseValue] = useState('42')
  const [base, setBase] = useState(10)
  const [text, setText] = useState('')
  const [textMode, setTextMode] = useState('base64')
  const [textDirection, setTextDirection] = useState('encode')
  const [copied, setCopied] = useState(null)
  const { toast } = useToast()

  const parsed = useMemo(() => parseInBase(baseValue, base), [baseValue, base])
  const outputs = useMemo(
    () => (parsed == null ? null : Object.fromEntries(BASES.map((item) => [item.value, parsed.toString(item.value).toUpperCase()]))),
    [parsed],
  )

  const textResult = useMemo(() => {
    if (!text.length) return ''
    try {
      if (textMode === 'base64') return textDirection === 'encode' ? encodeBase64(text) : decodeBase64(text)
      return textDirection === 'encode' ? encodeURIComponent(text) : decodeURIComponent(text)
    } catch {
      return ''
    }
  }, [text, textMode, textDirection])

  const copy = async (value, key) => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(key)
      toast({ title: 'Copié', description: value.length > 60 ? `${value.slice(0, 60)}…` : value, duration: 2200 })
      setTimeout(() => setCopied(null), 1500)
    }
  }

  return (
    <div className="tool converter-tool">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'units', label: 'Unités', icon: ArrowLeftRight },
          { value: 'bases', label: 'Bases numériques', icon: Hash },
          { value: 'text', label: 'Texte & URL', icon: Type },
        ]}
        ariaLabel="Type de conversion"
      />

      {tab === 'units' ? <ConverterWidget expanded /> : null}

      {tab === 'bases' ? (
        <div className="base-converter">
          <div className="base-input-row">
            <label className="field">
              <span className="field-label">Valeur</span>
              <input
                type="text"
                value={baseValue}
                onChange={(event) => setBaseValue(event.target.value)}
                spellCheck={false}
                placeholder="42"
              />
            </label>
            <label className="field">
              <span className="field-label">Base d’origine</span>
              <select value={base} onChange={(event) => setBase(Number(event.target.value))}>
                {BASES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
          {parsed == null && baseValue.trim() ? (
            <p className="inline-error">Ce n’est pas un nombre valide en base {base}.</p>
          ) : null}
          <div className="base-outputs">
            {BASES.map((item) => (
              <button
                key={item.value}
                type="button"
                className="base-output"
                onClick={() => outputs && copy(outputs[item.value], String(item.value))}
                disabled={!outputs}
              >
                <span>{item.label}</span>
                <code>{outputs ? outputs[item.value] : '—'}</code>
                {copied === String(item.value) ? <Check size={14} /> : <Copy size={14} />}
              </button>
            ))}
          </div>
          <p className="hint">Conversion en précision arbitraire (BigInt). Les nombres négatifs sont acceptés avec un signe « - ».</p>
        </div>
      ) : null}

      {tab === 'text' ? (
        <div className="text-converter">
          <div className="text-converter-options">
            <Segmented
              size="sm"
              value={textMode}
              onChange={setTextMode}
              options={[{ value: 'base64', label: 'Base64' }, { value: 'url', label: 'URL' }]}
              ariaLabel="Format"
            />
            <Segmented
              size="sm"
              value={textDirection}
              onChange={setTextDirection}
              options={[{ value: 'encode', label: 'Encoder' }, { value: 'decode', label: 'Décoder' }]}
              ariaLabel="Direction"
            />
          </div>
          <div className="text-converter-grid">
            <label className="field">
              <span className="field-label">{textDirection === 'encode' ? 'Texte source' : 'Chaîne à décoder'}</span>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={7}
                placeholder={textDirection === 'encode' ? 'Texte à convertir…' : 'Collez ici le contenu encodé…'}
                spellCheck={false}
              />
            </label>
            <div className="text-result">
              <span className="field-label">Résultat</span>
              <pre>{textResult || '—'}</pre>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={!textResult}
                onClick={() => copy(textResult, 'text')}
              >
                {copied === 'text' ? <Check size={14} /> : <Copy size={14} />} Copier
              </button>
              {!textResult && text ? <p className="inline-error">Données invalides pour ce format.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
