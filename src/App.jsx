import { useCallback, useEffect, useMemo, useState } from 'react'
import { PrefsProvider, usePrefs } from './state/PrefsContext'
import { DataProvider, useData } from './state/DataContext'
import { ToastProvider, useToast } from './components/Toast'
import { NavigationProvider } from './state/NavigationContext'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { CommandPalette } from './components/CommandPalette'
import { CustomizePanel } from './components/CustomizePanel'
import { GameHost } from './components/GameHost'
import { ToolHost } from './components/ToolHost'
import { NexusAssistant } from './components/NexusAssistant'
import { ErrorBoundary } from './components/ui'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ArcadePage from './pages/ArcadePage'
import ToolsPage from './pages/ToolsPage'
import NotesPage from './pages/NotesPage'
import SettingsPage from './pages/SettingsPage'
import { applyTheme } from './lib/themes'
import { configureSound, playSound } from './lib/sound'
import { ACHIEVEMENTS, eligibleAchievements } from './lib/gameStats'
import { cn } from './lib/utils'

const PAGE_IDS = ['home', 'dashboard', 'arcade', 'tools', 'notes', 'settings']

function readRoute() {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [rawPage, ...rest] = raw.split('/')
  const page = PAGE_IDS.includes(rawPage) ? rawPage : 'home'
  let param = null
  if (rest.length) {
    try {
      param = decodeURIComponent(rest.join('/'))
    } catch {
      param = null
    }
  }
  return { page, param }
}

function Shell() {
  const { prefs, setPref, pushRecent, markToolUsed } = usePrefs()
  const { data, unlockAchievements } = useData()
  const { toast } = useToast()
  const [route, setRoute] = useState(readRoute)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [customize, setCustomize] = useState({ open: false, page: 'home' })
  const [game, setGame] = useState(null)
  const [tool, setTool] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [standalone, setStandalone] = useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true),
  )

  const navigate = useCallback((page, options = {}) => {
    const target = PAGE_IDS.includes(page) ? page : 'home'
    const param = options?.param ?? null
    const hash = `#/${target}${param ? `/${encodeURIComponent(param)}` : ''}`
    if (options?.replace) {
      window.history.replaceState(null, '', hash)
      setRoute({ page: target, param })
      return
    }
    if (window.location.hash === hash) {
      setRoute({ page: target, param })
    } else {
      window.location.hash = hash
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
    setMobileOpen(false)
    const labels = {
      home: 'Accueil',
      dashboard: 'Pocket Dashboard',
      arcade: 'Arcade',
      tools: 'Outils',
      notes: 'Notes',
      settings: 'Paramètres',
    }
    document.title = `NEXUS — ${labels[route.page] ?? 'Personal Hub'}`
  }, [route.page])

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const update = () => setStandalone(media.matches || window.navigator.standalone === true)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    const onInstalled = () => {
      setStandalone(true)
      setInstallPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => {
    applyTheme(prefs)
  }, [prefs.theme, prefs.accent, prefs.discreteMode, prefs.animations]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    configureSound({ sound: prefs.sound, volume: prefs.soundVolume })
  }, [prefs.sound, prefs.soundVolume])

  useEffect(() => {
    const eligible = eligibleAchievements(data, prefs)
    if (!eligible.length) return
    const unlocked = ACHIEVEMENTS.filter((achievement) => eligible.includes(achievement.id))
    unlockAchievements(eligible)
    playSound('win')
    toast({
      title: unlocked.length > 1 ? `${unlocked.length} succès débloqués !` : 'Succès débloqué !',
      description: unlocked.map((achievement) => achievement.title).join(' · '),
      tone: 'achievement',
      duration: 6500,
    })
  }, [data, prefs, unlockAchievements, toast])

  useEffect(() => {
    if (!prefs.shortcuts) return undefined
    const onKey = (event) => {
      const modifier = event.metaKey || event.ctrlKey
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
        return
      }
      if (modifier && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setPref('sidebarCollapsed', !prefs.sidebarCollapsed)
        return
      }
      if (modifier && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        setAssistantOpen((value) => !value)
        return
      }
      if (event.altKey && /^[1-6]$/.test(event.key)) {
        if (typing) return
        event.preventDefault()
        navigate(PAGE_IDS[Number(event.key) - 1])
        return
      }
      if (event.key === 'Escape' && mobileOpen) setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prefs.shortcuts, prefs.sidebarCollapsed, mobileOpen, navigate, setPref])
  const openGame = useCallback(
    (id) => {
      if (!id) return
      pushRecent({ type: 'game', id })
      setGame({ id, open: true })
      setSearchOpen(false)
    },
    [pushRecent],
  )

  const openTool = useCallback(
    (id) => {
      if (!id) return
      pushRecent({ type: 'tool', id })
      markToolUsed(id)
      setTool({ id, open: true })
      setSearchOpen(false)
    },
    [markToolUsed, pushRecent],
  )

  const openCustomize = useCallback((page = 'home') => {
    setCustomize({ open: true, page: page === 'dashboard' ? 'dashboard' : 'home' })
  }, [])

  const closeOverlays = useCallback(() => {
    setSearchOpen(false)
    setCustomize((value) => ({ ...value, open: false }))
    setGame((value) => (value ? { ...value, open: false } : value))
    setTool((value) => (value ? { ...value, open: false } : value))
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') {
        toast({ title: 'NEXUS installée', description: 'Retrouvez-la sur votre écran d’accueil.', tone: 'success' })
      }
      setInstallPrompt(null)
    } catch {
      toast({ title: 'Installation indisponible', description: 'Utilisez le menu de votre navigateur.', tone: 'warning' })
    }
  }, [installPrompt, toast])

  const navigationValue = useMemo(
    () => ({ route, navigate, openGame, openTool, openCustomize, openSearch: () => setSearchOpen(true), closeOverlays }),
    [route, navigate, openGame, openTool, openCustomize, closeOverlays],
  )

  const pageNode = (() => {
    switch (route.page) {
      case 'dashboard':
        return <DashboardPage onCustomize={() => openCustomize('dashboard')} />
      case 'arcade':
        return <ArcadePage />
      case 'tools':
        return <ToolsPage />
      case 'notes':
        return <NotesPage param={route.param} />
      case 'settings':
        return (
          <SettingsPage
            onCustomize={openCustomize}
            installPrompt={installPrompt}
            onInstall={install}
            standalone={standalone}
          />
        )
      case 'home':
      default:
        return <HomePage onCustomize={() => openCustomize('home')} onOpenAssistant={() => setAssistantOpen(true)} />
    }
  })()

  return (
    <NavigationProvider value={navigationValue}>
      <div className={cn('app-shell', prefs.sidebarCollapsed && 'is-collapsed')}>
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <Sidebar
          route={route}
          navigate={navigate}
          collapsed={prefs.sidebarCollapsed}
          onToggleCollapse={() => setPref('sidebarCollapsed', !prefs.sidebarCollapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        {mobileOpen ? (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="Fermer la navigation"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <div className="app-main">
          <Topbar
            route={route}
            onMenu={() => setMobileOpen(true)}
            onSearch={() => setSearchOpen(true)}
            onCustomize={() => openCustomize(route.page === 'dashboard' ? 'dashboard' : 'home')}
          />
          <main className="page-viewport" id="main-content">
            <div className="page-transition" key={route.page}>
              <ErrorBoundary key={route.page}>{pageNode}</ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
        openGame={openGame}
        openTool={openTool}
      />

      <CustomizePanel
        open={customize.open}
        initialPage={customize.page}
        onClose={() => setCustomize((value) => ({ ...value, open: false }))}
      />

      {game ? (
        <GameHost
          key={game.id}
          gameId={game.id}
          open={game.open}
          onClose={() => setGame((value) => (value ? { ...value, open: false } : value))}
        />
      ) : null}

      {tool ? (
        <ToolHost
          key={tool.id}
          toolId={tool.id}
          open={tool.open}
          onClose={() => setTool((value) => (value ? { ...value, open: false } : value))}
        />
      ) : null}

      <NexusAssistant open={assistantOpen} onOpenChange={setAssistantOpen} />
    </NavigationProvider>
  )
}

export default function App() {
  return (
    <PrefsProvider>
      <ToastProvider>
        <DataProvider>
          <Shell />
        </DataProvider>
      </ToastProvider>
    </PrefsProvider>
  )
}
