import { useState } from 'react'
import {
  ArrowRight,
  Gamepad2,
  LayoutGrid,
  ListTodo,
  NotebookPen,
  Search,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  TrendingUp,
} from 'lucide-react'
import { usePrefs } from '../state/PrefsContext'
import { useData } from '../state/DataContext'
import { useNavigation } from '../state/NavigationContext'
import { useNow } from '../lib/hooks'
import { formatClock, formatDayLong } from '../lib/utils'
import { levelInfo } from '../lib/gameStats'
import { WidgetBoard } from '../components/WidgetBoard'
import { HOME_WIDGET_IDS } from '../widgets/registry'
import { playSound } from '../lib/sound'

export default function HomePage({ onCustomize, onOpenAssistant }) {
  const { prefs } = usePrefs()
  const { data } = useData()
  const { navigate, openSearch } = useNavigation()
  const now = useNow(1000)
  const [editing, setEditing] = useState(false)
  const hour = now.getHours()
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const info = levelInfo(data.stats.xp)
  const activeTasks = data.tasks.filter((task) => !task.done).length
  const pinnedNotes = data.notes.filter((note) => note.pinned).length

  const message = activeTasks
    ? `${activeTasks} tâche${activeTasks > 1 ? 's' : ''} en attente${pinnedNotes ? ` · ${pinnedNotes} note${pinnedNotes > 1 ? 's' : ''} épinglée${pinnedNotes > 1 ? 's' : ''}` : ''}.`
    : data.tasks.length
      ? 'Toutes vos tâches sont terminées. Profitez de votre espace.'
      : 'Votre espace est prêt. Ajoutez une tâche, une note ou lancez une partie.'

  return (
    <div className="page home-page">
      <section className="home-hero glass">
        <span className="hero-glow" aria-hidden="true" />
        <span className="hero-noise" aria-hidden="true" />
        <div className="hero-main">
          <span className="eyebrow">{formatDayLong(now)}</span>
          <h1>
            {greeting}
            {prefs.name ? `, ${prefs.name}` : ''}.
          </h1>
          <p>{message}</p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                playSound('open')
                navigate('notes', { param: 'new' })
              }}
            >
              <NotebookPen size={15} /> Nouvelle note
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                playSound('open')
                navigate('arcade')
              }}
            >
              <Gamepad2 size={15} /> Lancer un jeu
            </button>
            <button type="button" className="btn btn-ghost" onClick={openSearch}>
              <Search size={15} /> Rechercher
              <kbd>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'}</kbd>
            </button>
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => {
                playSound('open')
                onOpenAssistant?.()
              }}
              title="NEXUS Mind — Ctrl+J"
            >
              <Sparkles size={15} /> NEXUS Mind
            </button>
          </div>
        </div>
        <div className="hero-side">
          <div className="hero-clock" aria-label={`Il est ${formatClock(now)}`}>
            {formatClock(now, { seconds: true })}
          </div>
          <div className="hero-tz">
            {Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ')}
          </div>
          <div className="hero-level-card">
            <div className="hero-level-top">
              <span className="hero-level-badge">Niv. {info.level}</span>
              <span>{info.title}</span>
            </div>
            <div className="thin-progress">
              <span style={{ width: `${info.progress * 100}%` }} />
            </div>
            <small>{info.inLevel} / {info.needed} XP avant le niveau {info.level + 1}</small>
          </div>
        </div>
      </section>

      <div className="home-glance">
        <div className="glance-item">
          <span className="glance-icon tone-blue"><ListTodo size={16} /></span>
          <div>
            <strong>{activeTasks}</strong>
            <span>tâche{activeTasks === 1 ? '' : 's'} en attente</span>
          </div>
          <button type="button" className="mini-link" onClick={() => navigate('dashboard')}>
            Ouvrir <ArrowRight size={12} />
          </button>
        </div>
        <div className="glance-item">
          <span className="glance-icon tone-violet"><StickyNote size={16} /></span>
          <div>
            <strong>{data.notes.length}</strong>
            <span>note{data.notes.length === 1 ? '' : 's'} enregistrée{data.notes.length === 1 ? '' : 's'}</span>
          </div>
          <button type="button" className="mini-link" onClick={() => navigate('notes')}>
            Ouvrir <ArrowRight size={12} />
          </button>
        </div>
        <div className="glance-item">
          <span className="glance-icon tone-amber"><TrendingUp size={16} /></span>
          <div>
            <strong>{data.stats.gamesPlayed}</strong>
            <span>partie{data.stats.gamesPlayed === 1 ? '' : 's'} jouée{data.stats.gamesPlayed === 1 ? '' : 's'}</span>
          </div>
          <button type="button" className="mini-link" onClick={() => navigate('arcade')}>
            Arcade <ArrowRight size={12} />
          </button>
        </div>
      </div>

      <div className="page-subhead">
        <div>
          <h2>Votre espace</h2>
          <p>Les modules de votre accueil, réorganisables et redimensionnables.</p>
        </div>
        <div className="page-subhead-actions">
          <button
            type="button"
            className={`btn btn-ghost btn-sm ${editing ? 'is-active' : ''}`}
            onClick={() => {
              setEditing((value) => !value)
              playSound('click')
            }}
          >
            <LayoutGrid size={14} /> {editing ? 'Terminer' : 'Disposition'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCustomize}>
            <SlidersHorizontal size={14} /> Personnaliser
          </button>
        </div>
      </div>

      <WidgetBoard
        page="home"
        allowedIds={HOME_WIDGET_IDS}
        editing={editing}
        onFinishEditing={() => setEditing(false)}
        onCustomize={onCustomize}
      />
    </div>
  )
}
