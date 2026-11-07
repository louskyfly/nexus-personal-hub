import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { useNavigation } from '../state/NavigationContext'
import { useToast } from '../components/Toast'
import { ConfirmDialog, EmptyState, PageHeader, Segmented } from '../components/ui'
import { useNow } from '../lib/hooks'
import { timeAgo } from '../lib/utils'
import { playSound } from '../lib/sound'

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pinned', label: 'Épinglées' },
  { value: 'trash', label: 'Corbeille' },
]

export default function NotesPage({ param }) {
  const {
    data,
    addNote,
    updateNote,
    trashNote,
    restoreNote,
    deleteNoteForever,
    emptyTrash,
    saveState,
  } = useData()
  const { navigate } = useNavigation()
  const { toast } = useToast()
  const now = useNow(30000)
  const [mode, setMode] = useState('all')
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [mobileView, setMobileView] = useState('list')
  const [confirm, setConfirm] = useState(null)
  const titleRef = useRef(null)
  const handledParam = useRef(null)

  const source = mode === 'trash' ? data.trash : data.notes
  const categories = useMemo(
    () => [...new Set(data.notes.map((note) => note.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr')),
    [data.notes],
  )

  const visible = useMemo(() => {
    let list = source
    if (mode === 'pinned') list = list.filter((note) => note.pinned)
    if (category !== 'all') list = list.filter((note) => note.category === category)
    if (query.trim()) {
      const target = query.trim().toLowerCase()
      list = list.filter(
        (note) =>
          note.title.toLowerCase().includes(target) ||
          note.body.toLowerCase().includes(target) ||
          note.category.toLowerCase().includes(target),
      )
    }
    return [...list].sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
    })
  }, [source, mode, category, query])

  const active = source.find((note) => note.id === activeId) ?? null

  useEffect(() => {
    if (!visible.length) {
      setActiveId(null)
      return
    }
    if (!visible.some((note) => note.id === activeId)) setActiveId(visible[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  useEffect(() => {
    if (!param || handledParam.current === param) return
    if (param === 'new') {
      handledParam.current = param
      const id = addNote({ category: category !== 'all' ? category : 'Général' })
      setMode('all')
      setCategory('all')
      setQuery('')
      setActiveId(id)
      setMobileView('editor')
      navigate('notes', { replace: true })
      setTimeout(() => titleRef.current?.focus(), 120)
      playSound('open')
      return
    }
    if (data.notes.some((note) => note.id === param)) {
      handledParam.current = param
      setMode('all')
      setCategory('all')
      setQuery('')
      setActiveId(param)
      setMobileView('editor')
      navigate('notes', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param])

  const createNote = () => {
    const id = addNote({ category: category !== 'all' ? category : 'Général' })
    setMode('all')
    setActiveId(id)
    setMobileView('editor')
    setTimeout(() => titleRef.current?.focus(), 80)
    playSound('open')
  }

  const removeNote = (note) => {
    trashNote(note.id)
    playSound('close')
    toast({
      title: 'Note déplacée dans la corbeille',
      description: note.title || 'Note sans titre',
      action: { label: 'Restaurer', onClick: () => restoreNote(note.id) },
      duration: 6000,
    })
    if (activeId === note.id) setActiveId(null)
  }

  const selectNote = (note) => {
    setActiveId(note.id)
    setMobileView('editor')
    playSound('click')
  }

  const wordCount = active?.body.trim() ? active.body.trim().split(/\s+/).length : 0

  return (
    <div className="page notes-page">
      <PageHeader
        eyebrow="Espace personnel"
        title="Vos notes, à votre rythme."
        description={`${data.notes.length} note${data.notes.length === 1 ? '' : 's'} enregistrée${data.notes.length === 1 ? '' : 's'} · ${data.trash.length} dans la corbeille · sauvegarde locale automatique.`}
        actions={
          <button type="button" className="btn btn-primary" onClick={createNote}>
            <Plus size={16} /> Nouvelle note
          </button>
        }
      />

      <div className={`notes-shell glass ${mobileView === 'editor' ? 'has-active' : ''}`}>
        <aside className="notes-list-pane">
          <div className="notes-search">
            <Search size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher dans les notes…"
              aria-label="Rechercher dans les notes"
            />
            {query ? (
              <button type="button" className="mini-icon" onClick={() => setQuery('')} aria-label="Effacer la recherche">
                <X size={13} />
              </button>
            ) : null}
          </div>

          <Segmented
            size="sm"
            value={mode}
            onChange={(value) => {
              setMode(value)
              setCategory('all')
              setMobileView('list')
              playSound('click')
            }}
            options={FILTERS}
            ariaLabel="Filtrer les notes"
            className="notes-mode"
          />

          {categories.length ? (
            <div className="category-chips" aria-label="Catégories">
              <button
                type="button"
                className={category === 'all' ? 'is-active' : ''}
                onClick={() => setCategory('all')}
              >
                Toutes
              </button>
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={category === item ? 'is-active' : ''}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          <div className="notes-list-head">
            <span>{visible.length} note{visible.length > 1 ? 's' : ''}</span>
            {mode === 'trash' && data.trash.length ? (
              <button type="button" className="link-btn" onClick={() => setConfirm({ type: 'empty' })}>
                Vider la corbeille
              </button>
            ) : null}
          </div>

          {visible.length ? (
            <ul className="notes-list">
              {visible.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`note-list-item ${note.id === activeId ? 'is-active' : ''}`}
                    onClick={() => selectNote(note)}
                  >
                    <div className="note-list-top">
                      <strong>{note.title || 'Note sans titre'}</strong>
                      {note.pinned ? <Pin size={12} className="pin-mark" /> : null}
                    </div>
                    <span className="note-snippet">{note.body.replace(/\s+/g, ' ').slice(0, 90) || 'Note vide'}</span>
                    <div className="note-list-meta">
                      <span className="note-category">{note.category}</span>
                      <span>{timeAgo(note.updatedAt ?? note.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={mode === 'trash' ? Trash2 : NotebookPen}
              compact
              title={
                query
                  ? 'Aucun résultat'
                  : mode === 'trash'
                    ? 'Corbeille vide'
                    : mode === 'pinned'
                      ? 'Aucune note épinglée'
                      : 'Aucune note ici'
              }
              description={
                query
                  ? 'Essayez un autre mot-clé ou effacez la recherche.'
                  : mode === 'trash'
                    ? 'Les notes supprimées apparaîtront ici pendant que vous pouvez encore les restaurer.'
                    : 'Créez une note pour commencer à écrire.'
              }
              action={
                !query && mode !== 'trash' ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={createNote}>
                    <Plus size={14} /> Nouvelle note
                  </button>
                ) : null
              }
            />
          )}
        </aside>

        <section className="note-pane">
          {active ? (
            <>
              <header className="note-toolbar">
                <button type="button" className="icon-btn note-back" onClick={() => setMobileView('list')} aria-label="Retour à la liste">
                  <ArrowLeft size={17} />
                </button>
                <div className="note-toolbar-status">
                  <span className={`save-dot ${saveState === 'saving' ? 'is-saving' : ''}`} />
                  {mode === 'trash' ? 'Note dans la corbeille' : saveState === 'saving' ? 'Enregistrement…' : `Enregistré ${timeAgo(active.updatedAt ?? now.getTime())}`}
                </div>
                {mode === 'trash' ? (
                  <div className="note-toolbar-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { restoreNote(active.id); toast({ title: 'Note restaurée', tone: 'success' }); }}>
                      <Undo2 size={14} /> Restaurer
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm({ type: 'delete', note: active })}>
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                ) : (
                  <div className="note-toolbar-actions">
                    <button
                      type="button"
                      className={`icon-btn ${active.pinned ? 'is-accent' : ''}`}
                      onClick={() => updateNote(active.id, { pinned: !active.pinned })}
                      aria-label={active.pinned ? 'Désépingler' : 'Épingler'}
                      title={active.pinned ? 'Désépingler' : 'Épingler'}
                    >
                      {active.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <label className="note-category-field" title="Catégorie">
                      <FileText size={14} />
                      <input
                        type="text"
                        value={active.category}
                        list="note-categories"
                        onChange={(event) => updateNote(active.id, { category: event.target.value })}
                        onBlur={(event) => {
                          if (!event.target.value.trim()) updateNote(active.id, { category: 'Général' })
                        }}
                        aria-label="Catégorie de la note"
                      />
                      <datalist id="note-categories">
                        {categories.map((item) => <option key={item} value={item} />)}
                      </datalist>
                    </label>
                    <button type="button" className="icon-btn" onClick={() => removeNote(active)} aria-label="Mettre la note à la corbeille">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </header>
              <div className="note-editor">
                <input
                  ref={titleRef}
                  type="text"
                  className="note-title"
                  value={active.title}
                  onChange={(event) => updateNote(active.id, { title: event.target.value })}
                  placeholder="Titre de la note"
                  disabled={mode === 'trash'}
                  aria-label="Titre de la note"
                />
                <textarea
                  className="note-body"
                  value={active.body}
                  onChange={(event) => updateNote(active.id, { body: event.target.value })}
                  placeholder="Commencez à écrire… tout est sauvegardé automatiquement."
                  disabled={mode === 'trash'}
                  aria-label="Contenu de la note"
                />
                <footer className="note-footer">
                  <span>{wordCount} mot{wordCount === 1 ? '' : 's'} · {active.body.length} caractère{active.body.length === 1 ? '' : 's'}</span>
                  <span className="hint">{mode === 'trash' ? 'Restaurez la note pour la modifier.' : 'Sauvegarde automatique locale'}</span>
                </footer>
              </div>
            </>
          ) : (
            <div className="note-empty">
              <EmptyState
                icon={NotebookPen}
                title={mode === 'trash' ? 'Sélectionnez une note de la corbeille' : 'Sélectionnez ou créez une note'}
                description="Votre titre et votre contenu sont enregistrés au fil de la frappe, même sans connexion."
                action={
                  mode !== 'trash' ? (
                    <button type="button" className="btn btn-primary btn-sm" onClick={createNote}>
                      <Plus size={14} /> Nouvelle note
                    </button>
                  ) : null
                }
              />
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirm?.type === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.note) {
            deleteNoteForever(confirm.note.id)
            setActiveId(null)
            toast({ title: 'Note supprimée définitivement', duration: 2400 })
          }
        }}
        title="Supprimer définitivement ?"
        description="Cette note sera effacée du stockage local et ne pourra plus être restaurée."
        confirmLabel="Supprimer définitivement"
      />
      <ConfirmDialog
        open={confirm?.type === 'empty'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          emptyTrash()
          setActiveId(null)
          toast({ title: 'Corbeille vidée', duration: 2400 })
        }}
        title="Vider la corbeille ?"
        description="Toutes les notes de la corbeille seront supprimées définitivement."
        confirmLabel="Vider la corbeille"
      />
    </div>
  )
}
