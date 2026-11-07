import { cn } from '../lib/utils'

export function NexusMark({ size = 36, className = '' }) {
  return (
    <span className={cn('nexus-mark', className)} style={{ '--mark-size': `${size}px` }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <defs>
          <linearGradient id={`nm-bg-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1b2b4d" />
            <stop offset="1" stopColor="#070b16" />
          </linearGradient>
          <linearGradient id={`nm-fg-${size}`} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#a9c1ff" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="17" fill={`url(#nm-bg-${size})`} />
        <circle cx="32" cy="31" r="22" fill="none" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M21 44V20h6l11 16V20h5v24h-5L27 28v16z" fill={`url(#nm-fg-${size})`} />
        <rect x="1" y="1" width="62" height="62" rx="16" fill="none" stroke="#ffffff" strokeOpacity="0.14" />
      </svg>
    </span>
  )
}

export function BootSplash() {
  return (
    <div className="boot-splash">
      <div className="boot-glow" />
      <NexusMark size={64} className="boot-mark" />
      <h1>NEXUS</h1>
      <p>Chargement de votre espace personnel</p>
      <span className="boot-loader" aria-hidden="true">
        <span />
      </span>
    </div>
  )
}
