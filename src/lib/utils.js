/* Small, dependency-free helpers shared across NEXUS. */

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const pad2 = (n) => String(n).padStart(2, '0')

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function debounce(fn, wait = 300) {
  let timer
  const wrapped = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
  wrapped.cancel = () => clearTimeout(timer)
  return wrapped
}

/* ---------- Dates ---------- */

export const ISO_DAY = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

export function parseDay(day) {
  if (!day) return null
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDayLong(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatDayShort(date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date)
}

export function timeAgo(timestamp) {
  if (!timestamp) return ''
  const seconds = Math.round((timestamp - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(seconds / (86400 * 30)), 'month')
  return rtf.format(Math.round(seconds / (86400 * 365)), 'year')
}

export function formatDateNumeric(timestamp) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function formatDateTime(timestamp) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatClock(date, opts = {}) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: opts.seconds ? '2-digit' : undefined,
    hour12: false,
  }).format(date)
}

/* ---------- Durations ---------- */

export function formatStopwatch(ms) {
  const totalMs = Math.max(0, Math.floor(ms))
  const h = Math.floor(totalMs / 3600000)
  const m = Math.floor((totalMs % 3600000) / 60000)
  const s = Math.floor((totalMs % 60000) / 1000)
  const cs = Math.floor((totalMs % 1000) / 10)
  return h > 0
    ? `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`
    : `${pad2(m)}:${pad2(s)}.${pad2(cs)}`
}

export function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const rest = s % 60
  if (h > 0) return `${h} h ${pad2(m)} min ${pad2(rest)} s`
  if (m > 0) return `${m} min ${pad2(rest)} s`
  return `${rest} s`
}

export function formatTimer(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`
}

/* ---------- Misc ---------- */

export function normalizeUrl(input) {
  const value = input.trim()
  if (!value) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value
  return `https://${value}`
}

export function isValidUrl(input) {
  try {
    const url = new URL(normalizeUrl(input))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function hostOf(input) {
  try {
    return new URL(normalizeUrl(input)).hostname.replace(/^www\./, '')
  } catch {
    return input
  }
}

export function initials(text = '') {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function downloadText(text, filename, type = 'application/json') {
  downloadBlob(new Blob([text], { type }), filename)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
      return true
    } catch {
      return false
    }
  }
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function storageBytes(value) {
  try {
    return new Blob([typeof value === 'string' ? value : JSON.stringify(value)]).size
  } catch {
    return 0
  }
}

export function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
