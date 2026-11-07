export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Bleu nuit profond, reflets froids — le thème signature.',
    swatch: ['#070a12', '#111c33', '#5b9dff'],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Noir minéral et surfaces neutres, plus discret.',
    swatch: ['#0a0a0b', '#1a1a1c', '#a1a1aa'],
  },
  {
    id: 'frost',
    name: 'Frost',
    description: 'Verre clair et lumière douce, pour la journée.',
    swatch: ['#eef2f8', '#ffffff', '#3b82f6'],
  },
]

export const ACCENTS = [
  { id: 'blue', name: 'Océan', color: '#5b9dff', rgb: '91, 157, 255' },
  { id: 'violet', name: 'Violette', color: '#a78bfa', rgb: '167, 139, 250' },
  { id: 'mint', name: 'Menthe', color: '#5eead4', rgb: '94, 234, 212' },
  { id: 'amber', name: 'Ambre', color: '#f5c451', rgb: '245, 196, 81' },
  { id: 'rose', name: 'Rose', color: '#fb7185', rgb: '251, 113, 133' },
  { id: 'cyan', name: 'Cyan', color: '#22d3ee', rgb: '34, 211, 238' },
]

export function getAccent(id) {
  return ACCENTS.find((accent) => accent.id === id) ?? ACCENTS[0]
}

export function applyTheme(prefs) {
  const root = document.documentElement
  root.dataset.theme = prefs.theme ?? 'midnight'
  root.dataset.discrete = prefs.discreteMode ? 'true' : 'false'
  root.dataset.motion = prefs.animations === false ? 'reduced' : 'full'
  const accent = getAccent(prefs.accent)
  root.style.setProperty('--accent', accent.color)
  root.style.setProperty('--accent-rgb', accent.rgb)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', prefs.theme === 'frost' ? '#eef2f8' : '#070a12')
}
