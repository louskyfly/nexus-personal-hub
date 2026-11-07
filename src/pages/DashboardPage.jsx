import { useState } from 'react'
import { LayoutGrid, SlidersHorizontal, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { WidgetBoard } from '../components/WidgetBoard'
import { DASH_WIDGET_IDS } from '../widgets/registry'
import { playSound } from '../lib/sound'

export default function DashboardPage({ onCustomize }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="Pocket Dashboard"
        title="Tous vos outils, en un regard."
        description="Calculs, temps, calendrier, tâches, notes et conversions — chaque module est autonome et enregistré localement."
        actions={
          <>
            <button
              type="button"
              className={`btn btn-ghost ${editing ? 'is-active' : ''}`}
              onClick={() => {
                setEditing((value) => !value)
                playSound('click')
              }}
            >
              <LayoutGrid size={15} /> {editing ? 'Terminer' : 'Disposition'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCustomize}>
              <SlidersHorizontal size={15} /> Personnaliser
            </button>
          </>
        }
      />
      <WidgetBoard
        page="dashboard"
        allowedIds={DASH_WIDGET_IDS}
        editing={editing}
        onFinishEditing={() => setEditing(false)}
        onCustomize={onCustomize}
      />
      <div className="dashboard-footnote">
        <Sparkles size={14} />
        <span>Besoin d’un module seul ? Ouvrez-le avec le bouton d’agrandissement de sa carte.</span>
      </div>
    </div>
  )
}
