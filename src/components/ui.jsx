import { Component } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'
import { Modal } from './Modal'

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="page-head">
      <div className="page-head-copy">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-head-actions">{actions}</div> : null}
    </header>
  )
}

export function SectionTitle({ icon: Icon, title, hint, action }) {
  return (
    <div className="section-title">
      <div>
        {Icon ? (
          <span className="section-icon">
            <Icon size={16} />
          </span>
        ) : null}
        <h2>{title}</h2>
        {hint ? <span className="hint">{hint}</span> : null}
      </div>
      {action}
    </div>
  )
}

export function Switch({ checked, onChange, label, description, disabled = false, id, ariaLabel }) {
  const inputId = id ?? `switch-${label?.replace(/\W+/g, '-').toLowerCase() ?? Math.random()}`
  return (
    <label className={cn('switch-row', disabled && 'is-disabled')} htmlFor={inputId}>
      {label || description ? (
        <span className="switch-copy">
          {label ? <span className="switch-label">{label}</span> : null}
          {description ? <span className="switch-desc">{description}</span> : null}
        </span>
      ) : null}
      <span className="switch">
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(checked)}
          disabled={disabled}
          aria-label={ariaLabel ?? label ?? 'Activer'}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
      </span>
    </label>
  )
}

export function Segmented({ options, value, onChange, ariaLabel, className = '', size = 'md' }) {
  return (
    <div className={cn('segmented', `segmented-${size}`, className)} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon ? <option.icon size={15} /> : null}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action, compact = false }) {
  return (
    <div className={cn('empty-state', compact && 'is-compact')}>
      <span className="empty-icon">
        <Icon size={compact ? 20 : 26} strokeWidth={1.7} />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn('btn', tone === 'danger' ? 'btn-danger' : 'btn-primary')}
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="confirm-copy">{description}</p>
    </Modal>
  )
}

export function LoadingFrame({ label = 'Chargement…', tall = false }) {
  return (
    <div className={cn('loading-frame', tall && 'is-tall')} role="status">
      <Loader2 size={20} className="spin" />
      <span>{label}</span>
    </div>
  )
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('NEXUS module error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="module-error">
          <strong>Ce module a rencontré un problème.</strong>
          <p>{this.state.error.message}</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => this.setState({ error: null })}
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function StatChip({ icon: Icon, label, value, tone }) {
  return (
    <div className={cn('stat-chip', tone && `tone-${tone}`)}>
      {Icon ? (
        <span className="stat-chip-icon">
          <Icon size={15} />
        </span>
      ) : null}
      <span className="stat-chip-copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </div>
  )
}

export function Field({ label, hint, children, htmlFor, error }) {
  return (
    <label className={cn('field', error && 'has-error')} htmlFor={htmlFor}>
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}
