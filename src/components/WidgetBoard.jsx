import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  GripVertical,
  LayoutGrid,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { usePrefs } from '../state/PrefsContext'
import { useToast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { WidgetShell } from '../components/WidgetShell'
import { ErrorBoundary, EmptyState } from '../components/ui'
import { WIDGETS } from '../widgets/registry'
import { SIZE_LABELS } from '../lib/layouts'
import { cn } from '../lib/utils'
import { playSound } from '../lib/sound'

export function WidgetBoard({ page, allowedIds, editing, onCustomize, onFinishEditing }) {
  const {
    getLayout,
    cycleWidgetSize,
    moveWidget,
    toggleWidget,
    reorderLayout,
    resetLayout,
  } = usePrefs()
  const { toast } = useToast()
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const [focusOpen, setFocusOpen] = useState(false)

  const layout = getLayout(page).filter((item) => allowedIds.includes(item.id) && WIDGETS[item.id])
  const focused = focusId ? WIDGETS[focusId] : null
  const FocusedComponent = focused?.component

  const openWidget = (id) => {
    setFocusId(id)
    setFocusOpen(true)
    playSound('open')
  }

  const hideWidget = (id) => {
    toggleWidget(page, id)
    const def = WIDGETS[id]
    toast({
      title: `${def.title} masqué`,
      description: 'Vous pouvez le réactiver depuis Personnaliser.',
      action: { label: 'Annuler', onClick: () => toggleWidget(page, id) },
      duration: 5000,
    })
    playSound('close')
  }

  if (!layout.length) {
    return (
      <div className="board-empty glass">
        <EmptyState
          icon={LayoutGrid}
          title="Aucun widget affiché"
          description="Choisissez les modules qui composent cette page."
          action={
            <div className="form-actions center">
              <button type="button" className="btn btn-primary" onClick={onCustomize}>
                <Sparkles size={15} /> Personnaliser
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => resetLayout(page)}>
                <RotateCcw size={15} /> Disposition par défaut
              </button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <>
      {editing ? (
        <div className="edit-banner glass">
          <Sparkles size={15} />
          <span>Mode disposition : glissez les widgets par leur poignée, changez leur taille ou masquez-les.</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onFinishEditing}>
            Terminer
          </button>
        </div>
      ) : null}
      <div className={cn('widget-grid', page === 'dashboard' && 'is-dashboard', editing && 'is-editing')} data-page={page}>
        {layout.map((item) => {
          const def = WIDGETS[item.id]
          const Component = def.component
          const Icon = def.icon
          const isOver = overId === item.id && dragId && dragId !== item.id
          return (
            <div
              key={item.id}
              className={cn('widget-slot', `span-${item.size}`, isOver && 'is-drop-target', dragId === item.id && 'is-dragging')}
              onDragOver={(event) => {
                if (!editing || !dragId) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setOverId(item.id)
              }}
              onDragLeave={() => {
                if (overId === item.id) setOverId(null)
              }}
              onDrop={(event) => {
                if (!editing) return
                event.preventDefault()
                const from = event.dataTransfer.getData('text/plain') || dragId
                if (from) reorderLayout(page, from, item.id)
                setDragId(null)
                setOverId(null)
                playSound('click')
              }}
            >
              {editing ? (
                <div className="widget-edit-strip">
                  <button
                    type="button"
                    className="widget-drag"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', item.id)
                      event.dataTransfer.effectAllowed = 'move'
                      setDragId(item.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverId(null)
                    }}
                    aria-label={`Déplacer ${def.title}`}
                    title="Glisser pour déplacer"
                  >
                    <GripVertical size={14} />
                  </button>
                  <span className="widget-edit-name">{def.title}</span>
                  <div className="widget-edit-tools">
                    <button type="button" onClick={() => moveWidget(page, item.id, -1)} aria-label="Déplacer avant" title="Déplacer avant">
                      <ChevronLeft size={13} />
                    </button>
                    <button type="button" onClick={() => moveWidget(page, item.id, 1)} aria-label="Déplacer après" title="Déplacer après">
                      <ChevronRight size={13} />
                    </button>
                    <button
                      type="button"
                      className="size-pill"
                      onClick={() => cycleWidgetSize(page, item.id)}
                      title={`Taille : ${SIZE_LABELS[item.size]} — cliquer pour changer`}
                    >
                      {item.size.toUpperCase()}
                    </button>
                    <button type="button" onClick={() => hideWidget(item.id)} aria-label="Masquer le widget" title="Masquer">
                      <EyeOff size={13} />
                    </button>
                  </div>
                </div>
              ) : null}
              <WidgetShell
                icon={Icon}
                title={def.title}
                subtitle={def.subtitle}
                onExpand={() => openWidget(item.id)}
                className={editing ? 'is-editing-shell' : ''}
              >
                <ErrorBoundary>
                  <Component expanded={false} />
                </ErrorBoundary>
              </WidgetShell>
            </div>
          )
        })}
      </div>
      {focused ? (
        <Modal
          open={focusOpen}
          onClose={() => {
            setFocusOpen(false)
            playSound('close')
          }}
          title={focused.title}
          subtitle={focused.description}
          size="xl"
          className="widget-modal"
        >
          <div className="widget-modal-body">
            <ErrorBoundary>
              <FocusedComponent expanded />
            </ErrorBoundary>
          </div>
        </Modal>
      ) : null}
    </>
  )
}
