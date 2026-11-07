import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  Gamepad2,
  Home,
  LayoutDashboard,
  Link2,
  ListTodo,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Wrench,
} from 'lucide-react'
import { Modal } from './Modal'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { GAMES, TOOLS, gameById, toolById } from '../lib/catalog'
import { cn, timeAgo } from '../lib/utils'

const PAGES = [
  { id: 'home', title: 'Accueil', icon: Home, description: 'Votre espace personnel' },
  { id: 'dashboard', title: 'Pocket Dashboard', icon: LayoutDashboard, description: 'Tous les widgets et outils' },
  { id: 'arcade', title: 'Arcade', icon: Gamepad2, description: 'Sept mini-jeux' },
  { id: 'tools', title: 'Outils', icon: Wrench, description: 'Générateurs et convertisseurs' },
  { id: 'notes', title: 'Notes', icon: NotebookPen, description: 'Votre espace d’écriture' },
  { id: 'settings', title: 'Paramètres', icon: Settings, description: 'Apparence et données' },
]

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function CommandPalette({ open, onClose, navigate, openGame, openTool }) {
  const { data } = useData()
  const { prefs } = usePrefs()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      const timer = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [open])

  const groups = useMemo(() => {
    const q = normalize(query)
    const match = (text) => !q || normalize(text).includes(q)
    const noteMatch = (note) =>
      !q ||
      normalize(`${note.title} ${note.body} ${note.category}`).includes(q)
    const sections = []

    const pages = PAGES.filter((page) => match(`${page.title} ${page.description}`))
    if (pages.length) {
      sections.push({
        label: 'Navigation',
        items: pages.map((page) => ({
          key: `page-${page.id}`,
          title: page.title,
          subtitle: page.description,
          icon: page.icon,
          action: () => navigate(page.id),
        })),
      })
    }

    if (!q) {
      const recentItems = prefs.recents
        .map((entry) => {
          const item = entry.type === 'game' ? gameById(entry.id) : toolById(entry.id)
          if (!item) return null
          return {
            key: `recent-${entry.type}-${entry.id}`,
            title: item.title,
            subtitle: `${entry.type === 'game' ? 'Jeu récent' : 'Outil récent'} · ${timeAgo(entry.at)}`,
            icon: item.icon,
            action: () => (entry.type === 'game' ? openGame(entry.id) : openTool(entry.id)),
          }
        })
        .filter(Boolean)
      if (recentItems.length) sections.push({ label: 'Récents', items: recentItems })
    }

    const games = GAMES.filter((game) => match(`${game.title} ${game.tagline} ${game.description}`))
    if (games.length) {
      sections.push({
        label: 'Jeux',
        items: games.map((game) => ({
          key: `game-${game.id}`,
          title: game.title,
          subtitle: game.tagline,
          icon: game.icon,
          action: () => openGame(game.id),
        })),
      })
    }

    const tools = TOOLS.filter((tool) => match(`${tool.title} ${tool.tagline} ${tool.description}`))
    if (tools.length) {
      sections.push({
        label: 'Outils',
        items: tools.map((tool) => ({
          key: `tool-${tool.id}`,
          title: tool.title,
          subtitle: tool.tagline,
          icon: tool.icon,
          action: () => openTool(tool.id),
        })),
      })
    }

    if (q) {
      const notes = data.notes.filter(noteMatch).slice(0, 6)
      if (notes.length) {
        sections.push({
          label: 'Notes',
          items: notes.map((note) => ({
            key: `note-${note.id}`,
            title: note.title || 'Note sans titre',
            subtitle: `${note.category} · ${note.body.replace(/\s+/g, ' ').slice(0, 70) || 'Note vide'}`,
            icon: NotebookPen,
            action: () => navigate('notes', { param: note.id }),
          })),
        })
      }

      const tasks = data.tasks
        .filter((task) => !task.done && match(task.title))
        .slice(0, 4)
      if (tasks.length) {
        sections.push({
          label: 'Tâches',
          items: tasks.map((task) => ({
            key: `task-${task.id}`,
            title: task.title,
            subtitle: task.due ? `Échéance ${task.due}` : 'Tâche en attente',
            icon: ListTodo,
            action: () => navigate('dashboard'),
          })),
        })
      }

      const bookmarks = data.bookmarks.filter((bookmark) => match(`${bookmark.name} ${bookmark.url}`)).slice(0, 4)
      if (bookmarks.length) {
        sections.push({
          label: 'Liens',
          items: bookmarks.map((bookmark) => ({
            key: `link-${bookmark.id}`,
            title: bookmark.name,
            subtitle: bookmark.url,
            icon: Link2,
            action: () => window.open(bookmark.url, '_blank', 'noopener,noreferrer'),
          })),
        })
      }
    }

    const actionItems = []
    if (match('nouvelle note')) {
      actionItems.push({
        key: 'action-new-note',
        title: 'Nouvelle note',
        subtitle: 'Créer et ouvrir une note vierge',
        icon: Plus,
        action: () => navigate('notes', { param: 'new' }),
      })
    }
    if (q && normalize('ouvrir l’arcade').includes(q)) {
      actionItems.push({
        key: 'action-arcade',
        title: 'Ouvrir l’arcade',
        subtitle: 'Voir tous les jeux',
        icon: Gamepad2,
        action: () => navigate('arcade'),
      })
    }
    if (actionItems.length) sections.push({ label: 'Actions', items: actionItems })

    return sections
  }, [query, data, prefs.recents, navigate, openGame, openTool])

  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector(`[data-index="${selected}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [selected, open])

  const run = (item) => {
    if (!item) return
    onClose()
    setTimeout(() => item.action(), 40)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected((value) => (flat.length ? (value + 1) % flat.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((value) => (flat.length ? (value - 1 + flat.length) % flat.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(flat[selected])
    }
  }

  let runningIndex = -1

  return (
    <Modal open={open} onClose={onClose} size="md" plain className="palette-modal">
      <div className="palette">
        <div className="palette-search">
          <Search size={17} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une page, un jeu, un outil, une note…"
            aria-label="Recherche globale"
          />
          <kbd>Échap</kbd>
        </div>
        <div className="palette-results" ref={listRef} role="listbox" aria-label="Résultats de recherche">
          {groups.length ? (
            groups.map((group) => (
              <div key={group.label} className="palette-group">
                <span className="palette-group-label">{group.label}</span>
                {group.items.map((item) => {
                  runningIndex += 1
                  const index = runningIndex
                  const Icon = item.icon
                  const active = selected === index
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="option"
                      aria-selected={active}
                      data-index={index}
                      className={cn('palette-item', active && 'is-active')}
                      onMouseEnter={() => setSelected(index)}
                      onClick={() => run(item)}
                    >
                      <span className="palette-item-icon"><Icon size={16} /></span>
                      <span className="palette-item-copy">
                        <strong>{item.title}</strong>
                        <small>{item.subtitle}</small>
                      </span>
                      <ArrowRight size={14} className="palette-enter" />
                    </button>
                  )
                })}
              </div>
            ))
          ) : (
            <div className="palette-empty">
              <Search size={24} />
              <strong>Aucun résultat</strong>
              <span>Essayez un autre mot, un jeu ou une note.</span>
            </div>
          )}
        </div>
        <footer className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>Échap</kbd> fermer</span>
        </footer>
      </div>
    </Modal>
  )
}
