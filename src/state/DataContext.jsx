import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { clearContent, readContent, writeContent } from '../lib/idb'
import { computeGameXp } from '../lib/gameStats'
import { uid } from '../lib/utils'
import { BootSplash } from '../components/BootSplash'

export const DEFAULT_DATA = {
  version: 1,
  notes: [],
  trash: [],
  tasks: [],
  bookmarks: [],
  docs: [],
  countdowns: [],
  scratch: { content: '', updatedAt: null },
  weather: null,
  stats: {
    xp: 0,
    gamesPlayed: 0,
    completedTasks: 0,
    playCounts: {},
    history: [],
    bests: {
      snake: 0,
      '2048': 0,
      '2048Tile': 0,
      minesweeper: {},
      pong: { wins: 0, losses: 0 },
      tictactoe: { wins: 0, draws: 0, losses: 0 },
      memory: null,
      reaction: null,
    },
    achievements: {},
  },
}

function sanitize(raw) {
  const base = structuredClone(DEFAULT_DATA)
  if (!raw || typeof raw !== 'object') return base
  const data = {
    ...base,
    ...raw,
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    trash: Array.isArray(raw.trash) ? raw.trash : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : [],
    docs: Array.isArray(raw.docs) ? raw.docs : [],
    countdowns: Array.isArray(raw.countdowns) ? raw.countdowns : [],
    scratch: {
      content: typeof raw.scratch?.content === 'string' ? raw.scratch.content : '',
      updatedAt: raw.scratch?.updatedAt ?? null,
    },
    weather: raw.weather ?? null,
    stats: {
      ...base.stats,
      ...(raw.stats ?? {}),
      playCounts: raw.stats?.playCounts ?? {},
      history: Array.isArray(raw.stats?.history) ? raw.stats.history : [],
      bests: {
        ...base.stats.bests,
        ...(raw.stats?.bests ?? {}),
        minesweeper: { ...(raw.stats?.bests?.minesweeper ?? {}) },
        pong: { ...base.stats.bests.pong, ...(raw.stats?.bests?.pong ?? {}) },
        tictactoe: { ...base.stats.bests.tictactoe, ...(raw.stats?.bests?.tictactoe ?? {}) },
      },
      achievements: raw.stats?.achievements ?? {},
    },
  }
  return data
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [data, setData] = useState(DEFAULT_DATA)
  const [ready, setReady] = useState(false)
  const [saveState, setSaveState] = useState('saved')
  const [backend, setBackend] = useState('indexeddb')
  const timer = useRef(null)
  const readyRef = useRef(false)
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    let cancelled = false
    readContent()
      .then((stored) => {
        if (cancelled) return
        if (stored) setData(sanitize(stored))
        readyRef.current = true
        setReady(true)
      })
      .catch(() => {
        readyRef.current = true
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !readyRef.current) return
    setSaveState('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      writeContent(data).then((result) => {
        setBackend(result.backend)
        setSaveState(result.backend === 'memory' ? 'error' : 'saved')
      })
    }, 320)
    return () => clearTimeout(timer.current)
  }, [data, ready])

  const commit = useCallback((updater) => {
    setData((prev) => updater(prev))
  }, [])

  /* ---------------- Notes ---------------- */

  const addNote = useCallback((partial = {}) => {
    const id = uid('note')
    const now = Date.now()
    commit((prev) => ({
      ...prev,
      notes: [
        {
          id,
          title: partial.title ?? '',
          body: partial.body ?? '',
          category: partial.category ?? 'Général',
          pinned: Boolean(partial.pinned),
          color: partial.color ?? 'default',
          createdAt: now,
          updatedAt: now,
        },
        ...prev.notes,
      ],
    }))
    return id
  }, [commit])

  const updateNote = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note,
      ),
    }))
  }, [commit])

  const trashNote = useCallback((id) => {
    commit((prev) => {
      const note = prev.notes.find((item) => item.id === id)
      if (!note) return prev
      return {
        ...prev,
        notes: prev.notes.filter((item) => item.id !== id),
        trash: [{ ...note, deletedAt: Date.now() }, ...prev.trash].slice(0, 100),
      }
    })
  }, [commit])

  const restoreNote = useCallback((id) => {
    commit((prev) => {
      const note = prev.trash.find((item) => item.id === id)
      if (!note) return prev
      const { deletedAt, ...restored } = note
      return {
        ...prev,
        trash: prev.trash.filter((item) => item.id !== id),
        notes: [{ ...restored, updatedAt: Date.now() }, ...prev.notes],
      }
    })
  }, [commit])

  const deleteNoteForever = useCallback((id) => {
    commit((prev) => ({ ...prev, trash: prev.trash.filter((item) => item.id !== id) }))
  }, [commit])

  const emptyTrash = useCallback(() => {
    commit((prev) => ({ ...prev, trash: [] }))
  }, [commit])

  /* ---------------- Tasks ---------------- */

  const addTask = useCallback((partial = {}) => {
    const title = typeof partial === 'string' ? partial : partial.title
    if (!title?.trim()) return null
    const id = uid('task')
    commit((prev) => ({
      ...prev,
      tasks: [
        {
          id,
          title: title.trim(),
          done: false,
          due: partial.due ?? null,
          createdAt: Date.now(),
        },
        ...prev.tasks,
      ],
    }))
    return id
  }, [commit])

  const toggleTask = useCallback((id) => {
    commit((prev) => {
      const task = prev.tasks.find((item) => item.id === id)
      const nextDone = task ? !task.done : false
      return {
        ...prev,
        tasks: prev.tasks.map((item) => (item.id === id ? { ...item, done: nextDone } : item)),
        stats: {
          ...prev.stats,
          completedTasks: prev.stats.completedTasks + (nextDone ? 1 : 0),
        },
      }
    })
  }, [commit])

  const updateTask = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      tasks: prev.tasks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }, [commit])

  const deleteTask = useCallback((id) => {
    commit((prev) => ({ ...prev, tasks: prev.tasks.filter((item) => item.id !== id) }))
  }, [commit])

  const clearCompletedTasks = useCallback(() => {
    commit((prev) => ({ ...prev, tasks: prev.tasks.filter((item) => !item.done) }))
  }, [commit])

  /* ---------------- Bookmarks ---------------- */

  const addBookmark = useCallback((partial) => {
    if (!partial?.name?.trim() || !partial?.url?.trim()) return null
    const id = uid('link')
    commit((prev) => ({
      ...prev,
      bookmarks: [
        { id, name: partial.name.trim(), url: partial.url.trim(), createdAt: Date.now() },
        ...prev.bookmarks,
      ],
    }))
    return id
  }, [commit])

  const deleteBookmark = useCallback((id) => {
    commit((prev) => ({ ...prev, bookmarks: prev.bookmarks.filter((item) => item.id !== id) }))
  }, [commit])

  /* ---------------- Notebook documents ---------------- */

  const addDoc = useCallback((partial = {}) => {
    const id = uid('doc')
    const now = Date.now()
    commit((prev) => ({
      ...prev,
      docs: [
        {
          id,
          title: partial.title ?? 'Document sans titre',
          content: partial.content ?? '',
          createdAt: now,
          updatedAt: now,
        },
        ...prev.docs,
      ],
    }))
    return id
  }, [commit])

  const updateDoc = useCallback((id, patch) => {
    commit((prev) => ({
      ...prev,
      docs: prev.docs.map((doc) =>
        doc.id === id ? { ...doc, ...patch, updatedAt: Date.now() } : doc,
      ),
    }))
  }, [commit])

  const deleteDoc = useCallback((id) => {
    commit((prev) => ({ ...prev, docs: prev.docs.filter((doc) => doc.id !== id) }))
  }, [commit])

  const setScratch = useCallback((content) => {
    commit((prev) => ({ ...prev, scratch: { content, updatedAt: Date.now() } }))
  }, [commit])

  /* ---------------- Countdown events ---------------- */

  const addCountdown = useCallback((partial) => {
    if (!partial?.title?.trim() || !partial?.target) return null
    const id = uid('countdown')
    commit((prev) => ({
      ...prev,
      countdowns: [
        {
          id,
          title: partial.title.trim(),
          target: partial.target,
          createdAt: Date.now(),
        },
        ...prev.countdowns,
      ],
    }))
    return id
  }, [commit])

  const deleteCountdown = useCallback((id) => {
    commit((prev) => ({ ...prev, countdowns: prev.countdowns.filter((item) => item.id !== id) }))
  }, [commit])

  const setWeather = useCallback((weather) => {
    commit((prev) => ({ ...prev, weather }))
  }, [commit])

  /* ---------------- Arcade stats ---------------- */

  const recordGame = useCallback((game, payload = {}) => {
    const xp = computeGameXp(game, payload)
    const detail = payload.detail ?? {}
    const outcome = payload.outcome ?? 'played'
    commit((prev) => {
      const stats = prev.stats
      const bests = structuredClone(stats.bests)

      if (game === 'snake') {
        bests.snake = Math.max(bests.snake ?? 0, payload.score ?? 0)
      } else if (game === '2048') {
        bests['2048'] = Math.max(bests['2048'] ?? 0, payload.score ?? 0)
        bests['2048Tile'] = Math.max(bests['2048Tile'] ?? 0, detail.maxTile ?? 0)
      } else if (game === 'minesweeper') {
        const difficulty = detail.difficulty ?? 'beginner'
        if (detail.won && typeof detail.seconds === 'number') {
          const current = bests.minesweeper[difficulty]
          if (!current || detail.seconds < current) bests.minesweeper[difficulty] = detail.seconds
        }
      } else if (game === 'pong') {
        if (outcome === 'win') bests.pong.wins = (bests.pong.wins ?? 0) + 1
        if (outcome === 'loss') bests.pong.losses = (bests.pong.losses ?? 0) + 1
      } else if (game === 'tictactoe') {
        if (outcome === 'win') bests.tictactoe.wins = (bests.tictactoe.wins ?? 0) + 1
        if (outcome === 'draw') bests.tictactoe.draws = (bests.tictactoe.draws ?? 0) + 1
        if (outcome === 'loss') bests.tictactoe.losses = (bests.tictactoe.losses ?? 0) + 1
      } else if (game === 'memory') {
        if (detail.completed) {
          const current = bests.memory
          const betterAttempts = !current || (detail.attempts ?? 999) < (current.attempts ?? 999)
          const equalFaster =
            current &&
            (detail.attempts ?? 999) === (current.attempts ?? 999) &&
            (detail.seconds ?? 9999) < (current.seconds ?? 9999)
          if (betterAttempts || equalFaster) {
            bests.memory = {
              attempts: detail.attempts ?? 0,
              seconds: detail.seconds ?? 0,
              level: detail.level ?? 1,
            }
          }
        }
      } else if (game === 'reaction') {
        if (typeof detail.ms === 'number') {
          bests.reaction = bests.reaction == null ? detail.ms : Math.min(bests.reaction, detail.ms)
        }
      }

      const entry = {
        id: uid('play'),
        game,
        score: payload.score ?? null,
        outcome,
        xp,
        label: payload.label ?? '',
        at: Date.now(),
      }

      return {
        ...prev,
        stats: {
          ...stats,
          xp: stats.xp + xp,
          gamesPlayed: stats.gamesPlayed + 1,
          playCounts: { ...stats.playCounts, [game]: (stats.playCounts[game] ?? 0) + 1 },
          history: [entry, ...stats.history].slice(0, 150),
          bests,
        },
      }
    })
    return xp
  }, [commit])

  const unlockAchievements = useCallback((ids) => {
    if (!ids?.length) return
    commit((prev) => {
      const achievements = { ...prev.stats.achievements }
      let bonus = 0
      for (const id of ids) {
        if (!achievements[id]) {
          achievements[id] = { at: Date.now() }
          bonus += 25
        }
      }
      if (!bonus) return prev
      return {
        ...prev,
        stats: { ...prev.stats, xp: prev.stats.xp + bonus, achievements },
      }
    })
  }, [commit])

  /* ---------------- Import / reset ---------------- */

  const importContent = useCallback((raw) => {
    const next = sanitize(raw)
    setData(next)
    return next
  }, [])

  const resetContent = useCallback(async () => {
    const fresh = structuredClone(DEFAULT_DATA)
    setData(fresh)
    await clearContent()
    await writeContent(fresh)
  }, [])

  const value = useMemo(
    () => ({
      data,
      ready,
      saveState,
      backend,
      addNote,
      updateNote,
      trashNote,
      restoreNote,
      deleteNoteForever,
      emptyTrash,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      clearCompletedTasks,
      addBookmark,
      deleteBookmark,
      addDoc,
      updateDoc,
      deleteDoc,
      setScratch,
      addCountdown,
      deleteCountdown,
      setWeather,
      recordGame,
      unlockAchievements,
      importContent,
      resetContent,
    }),
    [
      data,
      ready,
      saveState,
      backend,
      addNote,
      updateNote,
      trashNote,
      restoreNote,
      deleteNoteForever,
      emptyTrash,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      clearCompletedTasks,
      addBookmark,
      deleteBookmark,
      addDoc,
      updateDoc,
      deleteDoc,
      setScratch,
      addCountdown,
      deleteCountdown,
      setWeather,
      recordGame,
      unlockAchievements,
      importContent,
      resetContent,
    ],
  )

  if (!ready) return <BootSplash />

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used inside DataProvider')
  return context
}
