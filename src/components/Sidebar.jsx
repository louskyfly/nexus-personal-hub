import {
  Gamepad2,
  Home,
  LayoutDashboard,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Wrench,
  X,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { NexusMark } from './BootSplash'
import { levelInfo } from '../lib/gameStats'
import { cn } from '../lib/utils'
import { playSound } from '../lib/sound'

const NAV = [
  { id: 'home', label: 'Home', icon: Home, shortcut: '1' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: '2' },
  { id: 'arcade', label: 'Arcade', icon: Gamepad2, shortcut: '3' },
  { id: 'tools', label: 'Tools', icon: Wrench, shortcut: '4' },
  { id: 'notes', label: 'Notes', icon: NotebookPen, shortcut: '5' },
  { id: 'settings', label: 'Settings', icon: Settings, shortcut: '6' },
]

export function Sidebar({ route, navigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { data, saveState } = useData()
  const { prefs } = usePrefs()
  const info = levelInfo(data.stats.xp)
  const tasksLeft = data.tasks.filter((task) => !task.done).length

  const badgeFor = (id) => {
    if (id === 'dashboard' && tasksLeft) return tasksLeft
    if (id === 'notes' && data.notes.length) return data.notes.length
    if (id === 'tools' && prefs.toolsUsed.length) return prefs.toolsUsed.length
    return null
  }

  return (
    <aside
      className={cn('sidebar glass', collapsed && 'is-collapsed', mobileOpen && 'is-mobile-open')}
      aria-label="Navigation principale"
    >
      <div className="sidebar-brand">
        <NexusMark size={collapsed ? 38 : 36} />
        {!collapsed ? (
          <div className="brand-copy">
            <strong>NEXUS</strong>
            <span>Personal Hub</span>
          </div>
        ) : null}
        <button
          type="button"
          className="icon-btn sidebar-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Déployer la barre latérale' : 'Replier la barre latérale'}
          title={collapsed ? 'Déployer' : 'Replier'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <button
          type="button"
          className="icon-btn sidebar-close-mobile"
          onClick={onCloseMobile}
          aria-label="Fermer la navigation"
        >
          <X size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed ? <span className="nav-heading">Espace</span> : null}
        {NAV.map((item) => {
          const Icon = item.icon
          const active = route.page === item.id
          const badge = badgeFor(item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={cn('nav-item', active && 'is-active')}
              onClick={() => {
                navigate(item.id)
                onCloseMobile?.()
                playSound('click')
              }}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? `${item.label} (Alt+${item.shortcut})` : `Alt+${item.shortcut}`}
            >
              <span className="nav-icon"><Icon size={18} strokeWidth={1.9} /></span>
              {!collapsed ? (
                <>
                  <span className="nav-label">{item.label}</span>
                  {badge != null ? <span className="nav-badge">{badge}</span> : null}
                  <kbd className="nav-shortcut">Alt {item.shortcut}</kbd>
                </>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-spacer" />

      <button
        type="button"
        className="sidebar-level"
        onClick={() => {
          navigate('arcade')
          onCloseMobile?.()
        }}
        title="Ouvrir la progression arcade"
      >
        <div className="level-mini-ring" style={{ '--progress': `${Math.round(info.progress * 100)}%` }}>
          <span>{info.level}</span>
        </div>
        {!collapsed ? (
          <div className="level-mini-copy">
            <strong>{info.title}</strong>
            <span>{info.inLevel} / {info.needed} XP</span>
            <div className="thin-progress">
              <span style={{ width: `${info.progress * 100}%` }} />
            </div>
          </div>
        ) : null}
      </button>

      {!collapsed ? (
        <div className="sidebar-foot">
          <span className={cn('save-dot', saveState === 'saving' && 'is-saving')} />
          <span>{saveState === 'saving' ? 'Enregistrement…' : saveState === 'error' ? 'Stockage limité' : 'Données à jour'}</span>
          <span className="sidebar-version">v1.1</span>
        </div>
      ) : null}
    </aside>
  )
}
