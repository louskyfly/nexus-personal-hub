import { cn } from '../lib/utils'
import { Maximize2 } from 'lucide-react'

export function WidgetShell({
  icon: Icon,
  title,
  subtitle,
  children,
  onExpand,
  handle,
  actions,
  expanded = false,
  className = '',
}) {
  return (
    <article className={cn('widget glass', expanded && 'is-expanded', className)}>
      <header className="widget-head">
        {handle}
        <span className="widget-icon">
          <Icon size={16} strokeWidth={1.9} />
        </span>
        <div className="widget-heading">
          <h3>{title}</h3>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <div className="widget-head-actions">
          {actions}
          {onExpand ? (
            <button type="button" className="icon-btn widget-expand" aria-label={`Ouvrir ${title}`} onClick={onExpand}>
              <Maximize2 size={14} />
            </button>
          ) : null}
        </div>
      </header>
      <div className="widget-body">{children}</div>
    </article>
  )
}
