import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  Link2,
  ListTodo,
  NotebookPen,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { useToast } from '../components/Toast'
import { ConfirmDialog, EmptyState } from '../components/ui'
import { useNow } from '../lib/hooks'
import { hostOf, initials, isValidUrl, normalizeUrl, timeAgo } from '../lib/utils'
import { playSound } from '../lib/sound'

/* ------------------------------ Tasks ------------------------------ */

export function TasksWidget({ expanded = false }) {
  const { data, addTask, toggleTask, deleteTask, clearCompletedTasks } = useData()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState('active')
  const [showDue, setShowDue] = useState(false)

  const counts = {
    all: data.tasks.length,
    active: data.tasks.filter((task) => !task.done).length,
    done: data.tasks.filter((task) => task.done).length,
  }

  const visible = useMemo(() => {
    const filtered =
      filter === 'active'
        ? data.tasks.filter((task) => !task.done)
        : filter === 'done'
          ? data.tasks.filter((task) => task.done)
          : data.tasks
    return expanded ? filtered : filtered.slice(0, 6)
  }, [data.tasks, filter, expanded])

  const submit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    addTask({ title, due: due || null })
    setTitle('')
    setDue('')
    setShowDue(false)
    playSound('click')
  }

  return (
    <div className={`tasks-widget ${expanded ? 'is-expanded' : ''}`}>
      <div className="tasks-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filtrer les tâches">
          {[
            ['active', 'À faire', counts.active],
            ['all', 'Toutes', counts.all],
            ['done', 'Terminées', counts.done],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {label} <span>{count}</span>
            </button>
          ))}
        </div>
      </div>
      {visible.length ? (
        <ul className={`task-list ${expanded ? 'is-scroll' : ''}`}>
          {visible.map((task) => (
            <li key={task.id} className={task.done ? 'is-done' : ''}>
              <button
                type="button"
                className="task-check"
                aria-label={task.done ? 'Rouvrir la tâche' : 'Terminer la tâche'}
                onClick={() => {
                  toggleTask(task.id)
                  if (!task.done) playSound('tick')
                }}
              >
                {task.done ? <Check size={12} /> : null}
              </button>
              <span className="task-title">{task.title}</span>
              {task.due ? <span className="task-due">{formatDue(task.due)}</span> : null}
              <button
                type="button"
                className="mini-icon"
                aria-label="Supprimer la tâche"
                onClick={() => {
                  deleteTask(task.id)
                  toast({
                    title: 'Tâche supprimée',
                    tone: 'info',
                    duration: 2200,
                  })
                }}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ListTodo}
          compact
          title={filter === 'done' ? 'Aucune tâche terminée' : 'Tout est à jour'}
          description={filter === 'active' ? 'Ajoutez une tâche pour commencer votre journée.' : 'Les tâches correspondantes apparaîtront ici.'}
        />
      )}
      <form className="task-add" onSubmit={submit}>
        <Plus size={15} />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nouvelle tâche…"
          aria-label="Nouvelle tâche"
        />
        <button
          type="button"
          className={`tiny-toggle ${showDue ? 'is-active' : ''}`}
          onClick={() => setShowDue((value) => !value)}
          aria-label="Ajouter une échéance"
          aria-pressed={showDue}
        >
          <ChevronDown size={14} />
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={!title.trim()}>
          Ajouter
        </button>
      </form>
      {showDue ? (
        <label className="task-due-field">
          <span>Échéance</span>
          <input type="date" value={due} onChange={(event) => setDue(event.target.value)} />
        </label>
      ) : null}
      {counts.done > 0 ? (
        <button
          type="button"
          className="link-btn task-clear"
          onClick={() => {
            clearCompletedTasks()
            toast({ title: 'Tâches terminées retirées', duration: 2500 })
          }}
        >
          Effacer les {counts.done} tâche{counts.done === 1 ? '' : 's'} terminée{counts.done === 1 ? '' : 's'}
        </button>
      ) : null}
    </div>
  )
}

function formatDue(day) {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  if (day === todayKey) return 'Aujourd’hui'
  const date = new Date(`${day}T12:00:00`)
  if (Number.isNaN(date.getTime())) return day
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

/* ------------------------------ Quick notes ------------------------------ */

export function QuickNotesWidget({ expanded = false }) {
  const { data, setScratch } = useData()
  const { toast } = useToast()
  const now = useNow(30000)
  const content = data.scratch?.content ?? ''

  const clear = () => {
    if (!content.trim()) return
    const previous = content
    setScratch('')
    toast({
      title: 'Note rapide effacée',
      action: { label: 'Annuler', onClick: () => setScratch(previous) },
      duration: 6000,
    })
  }

  return (
    <div className={`quicknotes ${expanded ? 'is-expanded' : ''}`}>
      <textarea
        className="scratch-pad"
        value={content}
        onChange={(event) => setScratch(event.target.value)}
        placeholder="Une idée, un numéro, une pensée à retenir…"
        aria-label="Note rapide"
        rows={expanded ? 12 : 5}
        spellCheck
      />
      <div className="scratch-foot">
        <span className="save-hint">
          <span className="save-dot" />
          {data.scratch?.updatedAt ? `Sauvegardé ${timeAgo(data.scratch.updatedAt)}` : 'Sauvegarde automatique locale'}
        </span>
        <div className="scratch-actions">
          <span className="char-count">{content.length} car.</span>
          <button type="button" className="mini-icon" onClick={clear} disabled={!content.trim()} aria-label="Effacer la note">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Bookmarks ------------------------------ */

export function BookmarksWidget({ expanded = false }) {
  const { data, addBookmark, deleteBookmark } = useData()
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!name.trim() || !url.trim()) return
    if (!isValidUrl(url)) {
      setError('Adresse invalide — utilisez une URL http(s).')
      return
    }
    addBookmark({ name, url: normalizeUrl(url) })
    setName('')
    setUrl('')
    setError('')
    setAdding(false)
    playSound('success')
    toast({ title: 'Lien ajouté', description: hostOf(url), tone: 'success', duration: 2400 })
  }

  const visible = expanded ? data.bookmarks : data.bookmarks.slice(0, 4)

  return (
    <div className="bookmarks-widget">
      {visible.length ? (
        <ul className={`bookmark-list ${expanded ? 'is-scroll' : ''}`}>
          {visible.map((bookmark) => (
            <li key={bookmark.id}>
              <a className="bookmark-row" href={bookmark.url} target="_blank" rel="noreferrer noopener">
                <span className="bookmark-avatar" style={{ '--hue': hueFrom(hostOf(bookmark.url)) }}>
                  {initials(bookmark.name) || '?'}
                </span>
                <span className="bookmark-copy">
                  <strong>{bookmark.name}</strong>
                  <small>{hostOf(bookmark.url)}</small>
                </span>
                <ExternalLink size={13} className="bookmark-open" />
              </a>
              <button
                type="button"
                className="mini-icon"
                aria-label={`Supprimer ${bookmark.name}`}
                onClick={() => deleteBookmark(bookmark.id)}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Link2}
          compact
          title="Aucun lien enregistré"
          description="Ajoutez vos sites favoris pour les ouvrir en un clic."
        />
      )}
      {adding ? (
        <form className="bookmark-form" onSubmit={submit}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom du lien"
            aria-label="Nom du lien"
            autoFocus
          />
          <input
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setError('')
            }}
            placeholder="https://…"
            aria-label="Adresse du lien"
            inputMode="url"
          />
          {error ? <p className="inline-error">{error}</p> : null}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!name.trim() || !url.trim()}>
              Ajouter
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm full" onClick={() => setAdding(true)}>
          <Plus size={14} /> Ajouter un lien
        </button>
      )}
    </div>
  )
}

function hueFrom(text = '') {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) % 360
  return hash
}

/* ------------------------------ Notepad ------------------------------ */

export function NotepadWidget({ expanded = false }) {
  const { data, addDoc, updateDoc, deleteDoc } = useData()
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState(data.docs[0]?.id ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const active = data.docs.find((doc) => doc.id === selectedId) ?? data.docs[0] ?? null

  useEffect(() => {
    if (!data.docs.length) {
      setSelectedId(null)
      return
    }
    if (!data.docs.some((doc) => doc.id === selectedId)) setSelectedId(data.docs[0].id)
  }, [data.docs, selectedId])

  const createDoc = () => {
    const id = addDoc({ title: 'Document sans titre', content: '' })
    setSelectedId(id)
    playSound('open')
  }

  if (!data.docs.length) {
    return (
      <EmptyState
        icon={NotebookPen}
        compact
        title="Bloc-notes vide"
        description="Créez un document pour consigner des informations durablement."
        action={
          <button type="button" className="btn btn-primary btn-sm" onClick={createDoc}>
            <Plus size={14} /> Nouveau document
          </button>
        }
      />
    )
  }

  return (
    <div className={`notepad ${expanded ? 'is-expanded' : ''}`}>
      <div className="notepad-head">
        {expanded ? (
          <div className="doc-list">
            {data.docs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className={active?.id === doc.id ? 'is-active' : ''}
                onClick={() => setSelectedId(doc.id)}
              >
                <FileText size={14} />
                <span>{doc.title || 'Sans titre'}</span>
              </button>
            ))}
            <button type="button" className="doc-add" onClick={createDoc}>
              <Plus size={14} /> Nouveau document
            </button>
          </div>
        ) : (
          <select value={active?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)} aria-label="Choisir un document">
            {data.docs.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title || 'Sans titre'}
              </option>
            ))}
          </select>
        )}
        <div className="notepad-head-actions">
          {!expanded ? (
            <button type="button" className="icon-btn" onClick={createDoc} aria-label="Nouveau document">
              <Plus size={15} />
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer le document"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {active ? (
        <div className="doc-editor">
          <input
            type="text"
            className="doc-title"
            value={active.title}
            onChange={(event) => updateDoc(active.id, { title: event.target.value })}
            placeholder="Titre du document"
            aria-label="Titre du document"
          />
          <textarea
            value={active.content}
            onChange={(event) => updateDoc(active.id, { content: event.target.value })}
            placeholder="Écrivez librement… tout est enregistré automatiquement."
            aria-label="Contenu du document"
            rows={expanded ? 14 : 6}
          />
          <span className="save-hint">
            <span className="save-dot" /> Enregistré {timeAgo(active.updatedAt)}
          </span>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!active) return
          deleteDoc(active.id)
          toast({ title: 'Document supprimé', duration: 2400 })
        }}
        title="Supprimer ce document ?"
        description="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
