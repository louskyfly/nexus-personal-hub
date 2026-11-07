import { useMemo, useState } from 'react'
import { Check, Copy, Palette, RefreshCw, Sparkles } from 'lucide-react'
import { useToast } from '../components/Toast'
import { buildPalette, colorInfo, hexToRgb } from '../lib/colors'
import { copyText } from '../lib/utils'
import { playSound } from '../lib/sound'

export default function ColorTool() {
  const [initialPalette] = useState(buildPalette)
  const [palette, setPalette] = useState(initialPalette)
  const [selected, setSelected] = useState(initialPalette[0].hex)
  const [manual, setManual] = useState(initialPalette[0].hex)
  const [copied, setCopied] = useState(null)
  const { toast } = useToast()

  const info = useMemo(() => colorInfo(selected) ?? colorInfo('#5b9dff'), [selected])

  const copy = async (value, key) => {
    const ok = await copyText(value)
    if (ok) {
      setCopied(key)
      playSound('click')
      toast({ title: 'Copié', description: value, duration: 2000 })
      setTimeout(() => setCopied(null), 1500)
    }
  }

  const generate = () => {
    const next = buildPalette()
    setPalette(next)
    setSelected(next[0].hex)
    playSound('open')
  }

  const applyManual = (value) => {
    setManual(value)
    if (hexToRgb(value)) setSelected(value)
  }

  return (
    <div className="tool color-tool">
      <div className="color-header">
        <div>
          <h3>Palette harmonieuse</h3>
          <p>Une base aléatoire, des variations cohérentes prêtes à copier.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={generate}>
          <RefreshCw size={14} /> Générer
        </button>
      </div>

      <div className="palette-row">
        {palette.map((color, index) => (
          <div
            key={`${color.hex}-${index}`}
            className={`palette-swatch ${selected === color.hex ? 'is-selected' : ''}`}
            style={{ background: color.hex }}
          >
            <button
              type="button"
              className="swatch-select"
              onClick={() => {
                setSelected(color.hex)
                setManual(color.hex)
                playSound('click')
              }}
              aria-label={`Sélectionner ${color.hex}`}
            >
              <span>{color.hex.toUpperCase()}</span>
              <small>{color.h}° · {color.s}% · {color.l}%</small>
            </button>
            <button
              type="button"
              className="swatch-copy"
              onClick={() => copy(color.hex, `pal-${index}`)}
              aria-label={`Copier ${color.hex}`}
            >
              {copied === `pal-${index}` ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        ))}
      </div>

      <div className="color-detail">
        <div className="color-preview" style={{ background: info.hex }}>
          <span style={{ color: readable(info.hex) }}>{info.hex.toUpperCase()}</span>
          <small style={{ color: readable(info.hex) }}>Couleur sélectionnée</small>
        </div>
        <div className="color-conversions">
          {[
            ['HEX', info.hex.toUpperCase()],
            ['RGB', info.rgbText],
            ['HSL', info.hslText],
          ].map(([label, value]) => (
            <button type="button" key={label} className="conversion-row" onClick={() => copy(value, label)}>
              <span>{label}</span>
              <code>{value}</code>
              {copied === label ? <Check size={13} /> : <Copy size={13} />}
            </button>
          ))}
        </div>
      </div>

      <div className="color-manual">
        <label>
          <span>Choisir une couleur</span>
          <div className="color-picker-row">
            <input type="color" value={info.hex} onChange={(event) => applyManual(event.target.value)} aria-label="Sélecteur de couleur" />
            <input
              type="text"
              value={manual}
              onChange={(event) => applyManual(event.target.value)}
              placeholder="#5b9dff"
              aria-label="Code couleur hexadécimal"
              spellCheck={false}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(manual)} disabled={!hexToRgb(manual)}>
              Appliquer
            </button>
          </div>
        </label>
        {!hexToRgb(manual) ? <p className="inline-error">Format attendu : #RRGGBB ou #RGB.</p> : null}
      </div>

      <div className="tool-footer-note">
        <Palette size={14} /> Chaque palette est générée localement à partir d’une teinte aléatoire.
      </div>
    </div>
  )
}

function readable(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#fff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.6 ? '#0a0d14' : '#ffffff'
}
