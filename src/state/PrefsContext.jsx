import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_DASH_LAYOUT, DEFAULT_HOME_LAYOUT, WIDGET_SIZES } from '../lib/layouts'

const PREF_KEY = 'nexus.prefs.v1'

export const DEFAULT_PREFS = {
  name: '',
  theme: 'midnight',
  accent: 'blue',
  animations: true,
  discreteMode: false,
  sound: true,
  soundVolume: 0.45,
  shortcuts: true,
  sidebarCollapsed: false,
  weekStart: 1,
  weatherPlace: null,
  worldClocks: [],
  wheelOptions: [],
  timerDuration: 300,
  layoutHome: DEFAULT_HOME_LAYOUT,
  layoutDash: DEFAULT_DASH_LAYOUT,
  favorites: [],
  recents: [],
  toolsUsed: [],
  recentSearches: [],
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      layoutHome: Array.isArray(parsed.layoutHome) ? parsed.layoutHome : DEFAULT_HOME_LAYOUT,
      layoutDash: Array.isArray(parsed.layoutDash) ? parsed.layoutDash : DEFAULT_DASH_LAYOUT,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recents: Array.isArray(parsed.recents) ? parsed.recents : [],
      toolsUsed: Array.isArray(parsed.toolsUsed) ? parsed.toolsUsed : [],
      worldClocks: Array.isArray(parsed.worldClocks) ? parsed.worldClocks : [],
      wheelOptions: Array.isArray(parsed.wheelOptions) ? parsed.wheelOptions : [],
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

const PrefsContext = createContext(null)

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs)
  const writeTimer = useRef(null)

  useEffect(() => {
    clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
      } catch {
        /* storage may be full or blocked */
      }
    }, 120)
    return () => clearTimeout(writeTimer.current)
  }, [prefs])

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = typeof key === 'object' ? { ...prev, ...key } : { ...prev, [key]: value }
      return next
    })
  }, [])

  const toggleFavorite = useCallback((gameId) => {
    setPrefs((prev) => {
      const has = prev.favorites.includes(gameId)
      return {
        ...prev,
        favorites: has ? prev.favorites.filter((id) => id !== gameId) : [...prev.favorites, gameId],
      }
    })
  }, [])

  const pushRecent = useCallback((entry) => {
    setPrefs((prev) => {
      const filtered = prev.recents.filter(
        (item) => !(item.type === entry.type && item.id === entry.id),
      )
      return {
        ...prev,
        recents: [{ ...entry, at: Date.now() }, ...filtered].slice(0, 8),
      }
    })
  }, [])

  const markToolUsed = useCallback((toolId) => {
    setPrefs((prev) =>
      prev.toolsUsed.includes(toolId)
        ? prev
        : { ...prev, toolsUsed: [...prev.toolsUsed, toolId] },
    )
  }, [])

  const getLayout = useCallback(
    (page) => (page === 'home' ? prefs.layoutHome : prefs.layoutDash),
    [prefs.layoutHome, prefs.layoutDash],
  )

  const setLayout = useCallback((page, layout) => {
    setPrefs((prev) =>
      page === 'home' ? { ...prev, layoutHome: layout } : { ...prev, layoutDash: layout },
    )
  }, [])

  const toggleWidget = useCallback((page, widgetId) => {
    setPrefs((prev) => {
      const key = page === 'home' ? 'layoutHome' : 'layoutDash'
      const layout = prev[key]
      const exists = layout.some((item) => item.id === widgetId)
      const next = exists
        ? layout.filter((item) => item.id !== widgetId)
        : [...layout, { id: widgetId, size: 'm' }]
      return { ...prev, [key]: next }
    })
  }, [])

  const cycleWidgetSize = useCallback((page, widgetId) => {
    setPrefs((prev) => {
      const key = page === 'home' ? 'layoutHome' : 'layoutDash'
      return {
        ...prev,
        [key]: prev[key].map((item) =>
          item.id === widgetId
            ? {
                ...item,
                size: WIDGET_SIZES[(WIDGET_SIZES.indexOf(item.size) + 1) % WIDGET_SIZES.length],
              }
            : item,
        ),
      }
    })
  }, [])

  const moveWidget = useCallback((page, widgetId, direction) => {
    setPrefs((prev) => {
      const key = page === 'home' ? 'layoutHome' : 'layoutDash'
      const layout = [...prev[key]]
      const index = layout.findIndex((item) => item.id === widgetId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= layout.length) return prev
      const [moved] = layout.splice(index, 1)
      layout.splice(target, 0, moved)
      return { ...prev, [key]: layout }
    })
  }, [])

  const resetLayout = useCallback((page) => {
    setPrefs((prev) =>
      page === 'home' ? { ...prev, layoutHome: DEFAULT_HOME_LAYOUT } : { ...prev, layoutDash: DEFAULT_DASH_LAYOUT },
    )
  }, [])

  const reorderLayout = useCallback((page, fromId, toId) => {
    if (fromId === toId) return
    setPrefs((prev) => {
      const key = page === 'home' ? 'layoutHome' : 'layoutDash'
      const layout = [...prev[key]]
      const from = layout.findIndex((item) => item.id === fromId)
      const to = layout.findIndex((item) => item.id === toId)
      if (from < 0 || to < 0) return prev
      const [moved] = layout.splice(from, 1)
      layout.splice(to, 0, moved)
      return { ...prev, [key]: layout }
    })
  }, [])

  const resetPrefs = useCallback(() => {
    setPrefs({ ...DEFAULT_PREFS })
    try {
      localStorage.removeItem(PREF_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(
    () => ({
      prefs,
      setPref,
      toggleFavorite,
      pushRecent,
      markToolUsed,
      getLayout,
      setLayout,
      toggleWidget,
      cycleWidgetSize,
      moveWidget,
      reorderLayout,
      resetLayout,
      resetPrefs,
    }),
    [
      prefs,
      setPref,
      toggleFavorite,
      pushRecent,
      markToolUsed,
      getLayout,
      setLayout,
      toggleWidget,
      cycleWidgetSize,
      moveWidget,
      reorderLayout,
      resetLayout,
      resetPrefs,
    ],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const context = useContext(PrefsContext)
  if (!context) throw new Error('usePrefs must be used inside PrefsProvider')
  return context
}
