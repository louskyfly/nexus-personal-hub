import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { usePrefs } from '../state/PrefsContext'
import { Modal } from '../components/Modal'
import { Segmented, Switch } from '../components/ui'
import { DASH_WIDGET_IDS, HOME_WIDGET_IDS, WIDGETS } from '../widgets/registry'
import { SIZE_LABELS, WIDGET_SIZES } from '../lib/layouts'
import { playSound } from '../lib/sound'

export function CustomizePanel({ open, onClose, initialPage = 'home' }) {
  const {
    prefs,
    getLayout,
    toggleWidget,
    cycleWidgetSize,
    moveWidget,
    resetLayout,
    setPref,
  } = usePrefs()
  const [page, setPage] = useState(initialPage)

  useEffect(() => {
    if (open) setPage(initialPage)
  }, [open, initialPage])

  const ids = page === 'home' ? HOME_WIDGET_IDS : DASH_WIDGET_IDS
  const layout = getLayout(page)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Personnalisation"
      subtitle="Composez votre espace : widgets, tailles et disposition."
      size="lg"
      eyebrow="Votre NEXUS"
      headerActions={
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            resetLayout(page)
            playSound('click')
          }}
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>
      }
    >
      <div className="customize-tabs">
        <Segmented
          value={page}
          onChange={(value) => {
            setPage(value)
            playSound('click')
          }}
          options={[
            { value: 'home', label: 'Accueil' },
            { value: 'dashboard', label: 'Dashboard' },
          ]}
          ariaLabel="Page à personnaliser"
        />
        <p className="hint">
          {layout.length} widget(s) affiché(s) sur {ids.length}. La taille et l’ordre sont enregistrés automatiquement.
        </p>
      </div>

      <div className="customize-list">
        {ids.map((id) => {
          const def = WIDGETS[id]
          if (!def) return null
          const Icon = def.icon
          const entry = layout.find((item) => item.id === id)
          const index = layout.findIndex((item) => item.id === id)
          return (
            <div key={id} className={`customize-row ${entry ? 'is-on' : ''}`}>
              <span className="customize-icon">
                <Icon size={17} />
              </span>
              <div className="customize-copy">
                <strong>{def.title}</strong>
                <span>{def.description}</span>
              </div>
              <div className="customize-actions">
                {entry ? (
                  <>
                    <Segmented
                      size="sm"
                      value={entry.size}
                      onChange={(size) => {
                        const current = layout.find((item) => item.id === id)
                        if (!current) return
                        const delta = (WIDGET_SIZES.indexOf(size) - WIDGET_SIZES.indexOf(current.size) + 3) % 3
                        for (let step = 0; step < delta; step += 1) cycleWidgetSize(page, id)
                        playSound('click')
                      }}
                      options={WIDGET_SIZES.map((size) => ({ value: size, label: SIZE_LABELS[size] }))}
                      ariaLabel={`Taille de ${def.title}`}
                    />
                    <div className="customize-moves">
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={index <= 0}
                        onClick={() => moveWidget(page, id, -1)}
                        aria-label="Monter"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={index >= layout.length - 1}
                        onClick={() => moveWidget(page, id, 1)}
                        aria-label="Descendre"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </>
                ) : null}
                <Switch
                  checked={Boolean(entry)}
                  onChange={() => {
                    toggleWidget(page, id)
                    playSound('click')
                  }}
                  label=""
                  ariaLabel={`Afficher ${def.title}`}
                  id={`toggle-widget-${id}`}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="customize-footer">
        <div className="customize-settings">
          <Switch
            checked={prefs.animations}
            onChange={(value) => setPref('animations', value)}
            label="Animations d’interface"
            description="Transitions et effets de mouvement."
          />
          <Switch
            checked={prefs.discreteMode}
            onChange={(value) => setPref('discreteMode', value)}
            label="Mode discret"
            description="Flous réduits et surfaces plus sobres."
          />
        </div>
        <span className="hint">
          <SlidersHorizontal size={13} /> D’autres réglages dans Paramètres.
        </span>
      </div>
    </Modal>
  )
}
