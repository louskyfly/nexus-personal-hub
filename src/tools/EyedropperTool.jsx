import { useRef, useState } from 'react'
import { Check, Copy, ImagePlus, Pipette, Upload } from 'lucide-react'
import { useToast } from '../components/Toast'
import { colorInfo } from '../lib/colors'
import { copyText, readFileAsDataURL } from '../lib/utils'
import { playSound } from '../lib/sound'

export default function EyedropperTool() {
  const [imageUrl, setImageUrl] = useState(null)
  const [picked, setPicked] = useState(null)
  const [recent, setRecent] = useState([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const { toast } = useToast()

  const loadFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choisissez un fichier image (PNG, JPEG, WebP…).')
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image trop lourde (12 Mo maximum).')
      return
    }
    try {
      const dataUrl = await readFileAsDataURL(file)
      setError('')
      setPicked(null)
      setRecent([])
      setImageUrl(dataUrl)
      playSound('open')
    } catch {
      setError('Impossible de lire cette image.')
    }
  }

  const drawImage = (image) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const maxSide = 1600
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  const sample = (event) => {
    const canvas = canvasRef.current
    if (!canvas || !imageUrl) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const data = context.getImageData(x, y, 1, 1).data
    const hex = `#${[data[0], data[1], data[2]].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
    setPicked(hex)
    setRecent((prev) => [hex, ...prev.filter((item) => item !== hex)].slice(0, 10))
    setCopied(false)
    playSound('point')
  }

  const copy = async (hex) => {
    const ok = await copyText(hex.toUpperCase())
    if (ok) {
      setCopied(true)
      playSound('click')
      toast({ title: 'Couleur copiée', description: hex.toUpperCase(), duration: 2200 })
      setTimeout(() => setCopied(false), 1600)
    }
  }

  const info = picked ? colorInfo(picked) : null

  return (
    <div className="tool eyedropper-tool">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => loadFile(event.target.files?.[0])}
      />
      {!imageUrl ? (
        <button
          type="button"
          className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            loadFile(event.dataTransfer.files?.[0])
          }}
        >
          <span className="upload-icon"><ImagePlus size={30} strokeWidth={1.4} /></span>
          <strong>Déposez une image ici</strong>
          <span>ou cliquez pour choisir un fichier</span>
          <small>PNG · JPEG · WebP · GIF — traitement local, aucune image envoyée</small>
        </button>
      ) : (
        <div className="eyedropper-layout">
          <div className="image-stage">
            <div className="image-frame">
              <img
                src={imageUrl}
                alt="Image importée pour la pipette"
                onLoad={(event) => drawImage(event.currentTarget)}
                draggable={false}
              />
              <canvas
                ref={canvasRef}
                className="eyedropper-canvas"
                onClick={sample}
                aria-label="Cliquez sur l’image pour prélever une couleur"
              />
              <div className="eyedropper-crosshair" aria-hidden="true"><Pipette size={14} /></div>
            </div>
            <div className="image-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Changer d’image
              </button>
              <span className="hint">Cliquez n’importe où pour prélever</span>
            </div>
          </div>
          <div className="eyedropper-panel">
            {info ? (
              <>
                <div className="picked-swatch" style={{ background: info.hex }}>
                  <Pipette size={20} />
                </div>
                <button type="button" className="picked-code" onClick={() => copy(info.hex)}>
                  <span>{info.hex.toUpperCase()}</span>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
                <div className="picked-values">
                  <span><em>RGB</em>{info.rgbText}</span>
                  <span><em>HSL</em>{info.hslText}</span>
                </div>
              </>
            ) : (
              <div className="eyedropper-hint">
                <Pipette size={24} />
                <strong>Prêt à prélever</strong>
                <span>Cliquez sur l’image pour obtenir la couleur exacte du pixel.</span>
              </div>
            )}
            {recent.length ? (
              <div className="recent-colors">
                <span className="table-caption">Couleurs prélevées</span>
                <div className="recent-color-row">
                  {recent.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className="recent-color"
                      style={{ background: hex }}
                      onClick={() => copy(hex)}
                      aria-label={`Copier ${hex}`}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {error ? <p className="inline-error">{error}</p> : null}
    </div>
  )
}
