import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  size = 'md',
  plain = false,
  className = '',
  headerActions,
  footer,
}) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
    } else if (mounted) {
      setClosing(true)
      const timer = setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, 170)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [open, mounted])

  useEffect(() => {
    if (!mounted) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
      }
    }
    const previousActive = document.activeElement
    document.addEventListener('keydown', onKey, true)
    const timer = setTimeout(() => panelRef.current?.focus(), 40)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey, true)
      clearTimeout(timer)
      if (previousActive instanceof HTMLElement) previousActive.focus?.()
    }
  }, [mounted])

  if (!mounted) return null

  return createPortal(
    <div
      className={cn('modal-backdrop', closing && 'is-closing')}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current?.()
      }}
    >
      <div
        className={cn('modal-panel', `modal-${size}`, plain && 'modal-plain', closing && 'is-closing', className)}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Fenêtre'}
        tabIndex={-1}
        ref={panelRef}
      >
        {!plain ? (
          <header className="modal-head">
            <div className="modal-heading">
              {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
              {title ? <h2>{title}</h2> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            <div className="modal-head-actions">
              {headerActions}
              <button type="button" className="icon-btn" aria-label="Fermer" onClick={() => onCloseRef.current?.()}>
                <X size={18} />
              </button>
            </div>
          </header>
        ) : (
          <button type="button" className="modal-floating-close icon-btn" aria-label="Fermer" onClick={() => onCloseRef.current?.()}>
            <X size={18} />
          </button>
        )}
        <div className={cn('modal-body', plain && 'modal-body-plain')}>{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
