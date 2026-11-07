import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode, Sparkles } from 'lucide-react'
import { useToast } from '../components/Toast'
import { downloadBlob } from '../lib/utils'

export default function QrTool() {
  const [text, setText] = useState('')
  const [size, setSize] = useState(320)
  const [level, setLevel] = useState('M')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const canvasRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (!text.trim()) {
      const context = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
      setReady(false)
      setError('')
      return undefined
    }
    QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: level,
      color: { dark: '#0a1020', light: '#ffffff' },
    })
      .then(() => {
        if (!cancelled) {
          setReady(true)
          setError('')
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setReady(false)
          setError(cause.message?.includes('too big') ? 'Contenu trop long pour un QR code à ce niveau de correction.' : 'Génération impossible.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [text, size, level])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas || !ready) return
    canvas.toBlob((blob) => {
      if (!blob) return
      downloadBlob(blob, 'nexus-qr-code.png')
      toast({ title: 'QR code téléchargé', description: 'nexus-qr-code.png', tone: 'success' })
    })
  }

  return (
    <div className="tool qr-tool">
      <div className="tool-grid-2">
        <div className="qr-inputs">
          <label className="field">
            <span className="field-label">Contenu du QR code</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder="https://…, un texte, un numéro de téléphone…"
            />
          </label>
          <div className="qr-options">
            <label className="field">
              <span className="field-label">Correction d’erreur</span>
              <select value={level} onChange={(event) => setLevel(event.target.value)}>
                <option value="L">Faible (L)</option>
                <option value="M">Moyenne (M)</option>
                <option value="Q">Élevée (Q)</option>
                <option value="H">Maximale (H)</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">Taille</span>
              <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
                <option value="240">240 px</option>
                <option value="320">320 px</option>
                <option value="512">512 px</option>
                <option value="768">768 px</option>
              </select>
            </label>
          </div>
          <p className="hint">
            Généré hors ligne avec la bibliothèque <code>qrcode</code>. Plus la correction est élevée, plus le code est dense.
          </p>
        </div>
        <div className="qr-preview">
          <div className={`qr-canvas-frame ${ready ? 'is-ready' : ''}`}>
            <canvas ref={canvasRef} aria-label="Aperçu du QR code" />
            {!text.trim() ? (
              <div className="qr-placeholder">
                <QrCode size={36} strokeWidth={1.4} />
                <span>Votre QR code apparaîtra ici</span>
              </div>
            ) : null}
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
          <button type="button" className="btn btn-primary full" onClick={download} disabled={!ready}>
            <Download size={15} /> Télécharger le PNG
          </button>
        </div>
      </div>
      <div className="tool-footer-note">
        <Sparkles size={14} /> Astuce : testez le résultat avec l’appareil photo de votre téléphone.
      </div>
    </div>
  )
}
