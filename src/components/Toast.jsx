import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Check, Info, Sparkles, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)
let toastCounter = 0

const TONE_ICONS = {
  success: Check,
  error: TriangleAlert,
  warning: TriangleAlert,
  info: Info,
  achievement: Sparkles,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const toast = useCallback(
    (input) => {
      const options = typeof input === 'string' ? { title: input } : input
      if (!options?.title) return null
      const id = ++toastCounter
      const item = {
        id,
        title: options.title,
        description: options.description,
        tone: options.tone ?? 'info',
        duration: options.duration ?? 4200,
        action: options.action,
      }
      setToasts((prev) => [...prev.slice(-3), item])
      if (item.duration > 0) {
        const timer = setTimeout(() => dismiss(id), item.duration)
        timers.current.set(id, timer)
      }
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => {
          const Icon = TONE_ICONS[item.tone] ?? Info
          return (
            <div className={`toast glass toast-${item.tone}`} key={item.id}>
              <span className="toast-icon">
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <div className="toast-copy">
                <strong>{item.title}</strong>
                {item.description ? <span>{item.description}</span> : null}
                {item.action ? (
                  <button
                    type="button"
                    className="toast-action"
                    onClick={() => {
                      item.action.onClick?.()
                      dismiss(item.id)
                    }}
                  >
                    {item.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="toast-close"
                aria-label="Fermer la notification"
                onClick={() => dismiss(item.id)}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
