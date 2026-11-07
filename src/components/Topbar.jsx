import { Menu, Search, Settings, SlidersHorizontal, WifiOff } from 'lucide-react'
import { useNow, useOnline } from '../lib/hooks'
import { formatClock } from '../lib/utils'
import { useNavigation } from '../state/NavigationContext'

const TITLES = {
  home: 'Accueil',
  dashboard: 'Pocket Dashboard',
  arcade: 'Arcade',
  tools: 'Outils',
  notes: 'Notes',
  settings: 'Paramètres',
}

export function Topbar({ route, onMenu, onSearch, onCustomize }) {
  const now = useNow(1000)
  const online = useOnline()
  const { navigate } = useNavigation()
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn topbar-menu" onClick={onMenu} aria-label="Ouvrir la navigation">
          <Menu size={18} />
        </button>
        <div className="topbar-page">
          <span className="eyebrow">NEXUS</span>
          <strong>{TITLES[route.page] ?? 'Accueil'}</strong>
        </div>
      </div>

      <button type="button" className="global-search" onClick={onSearch} aria-label="Recherche globale">
        <Search size={15} />
        <span>Rechercher dans NEXUS…</span>
        <kbd>{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
      </button>

      <div className="topbar-right">
        {!online ? (
          <span className="offline-pill" title="Certaines fonctions réseau sont indisponibles">
            <WifiOff size={13} /> Hors ligne
          </span>
        ) : null}
        <div className="topbar-clock" aria-label={`Il est ${formatClock(now)}`}>
          <strong>{formatClock(now, { seconds: true })}</strong>
          <span>{dateLabel}</span>
        </div>
        <button
          type="button"
          className="icon-btn topbar-action"
          onClick={onCustomize}
          aria-label="Personnaliser l’interface"
          title="Personnaliser"
        >
          <SlidersHorizontal size={17} />
        </button>
        <button
          type="button"
          className="icon-btn topbar-action"
          onClick={() => navigate('settings')}
          aria-label="Ouvrir les paramètres"
          title="Paramètres"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  )
}
