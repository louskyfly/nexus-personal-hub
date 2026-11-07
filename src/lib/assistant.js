import { GAMES, TOOLS } from './catalog.js'
import { levelInfo } from './gameStats.js'
import { ISO_DAY } from './utils.js'

export const ASSISTANT_PAGES = [
  {
    id: 'home',
    title: 'Accueil',
    subtitle: 'Votre espace personnel',
    icon: 'home',
    aliases: ['accueil', 'home', 'maison', 'page d accueil', 'retour a l accueil'],
  },
  {
    id: 'dashboard',
    title: 'Pocket Dashboard',
    subtitle: 'Tous les widgets et outils',
    icon: 'dashboard',
    aliases: ['dashboard', 'tableau de bord', 'panneau de controle', 'panneau de configuration', 'widgets'],
  },
  {
    id: 'arcade',
    title: 'Arcade',
    subtitle: 'Jeux et progression',
    icon: 'arcade',
    aliases: ['arcade', 'jeux', 'salle de jeux', 'mini jeux', 'mini-jeux'],
  },
  {
    id: 'tools',
    title: 'Outils',
    subtitle: 'Générateurs et convertisseurs',
    icon: 'tools',
    aliases: ['outils', 'tools', 'boite a outils', 'bibliotheque d outils'],
  },
  {
    id: 'notes',
    title: 'Notes',
    subtitle: 'Votre espace d’écriture',
    icon: 'notes',
    aliases: ['notes', 'note', 'mes notes', 'carnet', 'espace notes'],
  },
  {
    id: 'settings',
    title: 'Paramètres',
    subtitle: 'Apparence et données',
    icon: 'settings',
    aliases: ['parametres', 'settings', 'reglages', 'préférences', 'preferences', 'configuration'],
  },
]

const WIDGET_INTENTS = [
  { id: 'weather', page: 'home', title: 'Météo', subtitle: 'Conditions réelles', words: ['meteo', 'temps qu il fait', 'la meteo', 'weather'] },
  { id: 'calendar', page: 'home', title: 'Calendrier', subtitle: 'Agenda et échéances', words: ['calendrier', 'agenda', 'planning'] },
  { id: 'tasks', page: 'dashboard', title: 'Tâches', subtitle: 'Votre liste', words: ['taches', 'tache', 'todo', 'liste de taches', 'a faire'] },
  { id: 'quicknotes', page: 'home', title: 'Notes rapides', subtitle: 'Bloc éclair', words: ['notes rapides', 'note rapide', 'pense bête', 'pense bete', 'bloc eclair', 'scratch'] },
  { id: 'calculator', page: 'dashboard', title: 'Calculatrice', subtitle: 'Scientifique', words: ['calculatrice', 'calc', 'calcul'] },
  { id: 'stopwatch', page: 'dashboard', title: 'Chronomètre', subtitle: 'Temps précis', words: ['chronometre', 'chrono', 'stopwatch'] },
  { id: 'timer', page: 'dashboard', title: 'Minuteur', subtitle: 'Compte à rebours', words: ['minuteur', 'timer'] },
  { id: 'worldclock', page: 'dashboard', title: 'Horloge mondiale', subtitle: 'Fuseaux horaires', words: ['horloge mondiale', 'fuseaux horaires', 'fuseaux', 'heure mondiale'] },
  { id: 'countdown', page: 'dashboard', title: 'Compte à rebours', subtitle: 'Dates cibles', words: ['compte a rebours', 'countdown'] },
  { id: 'bookmarks', page: 'dashboard', title: 'Liens favoris', subtitle: 'Raccourcis web', words: ['liens favoris', 'favoris web', 'signets', 'bookmarks', 'liens'] },
  { id: 'notepad', page: 'dashboard', title: 'Bloc-notes', subtitle: 'Documents', words: ['bloc notes', 'bloc-notes', 'notepad', 'documents'] },
  { id: 'converter', page: 'dashboard', title: 'Convertisseur', subtitle: 'Unités', words: ['convertisseur', 'conversion', 'unites'] },
  { id: 'random', page: 'dashboard', title: 'Hasard', subtitle: 'Nombres aléatoires', words: ['nombres aleatoires', 'generateur de nombres', 'hasard'] },
  { id: 'stats', page: 'home', title: 'Statistiques personnelles', subtitle: 'Progression', words: ['statistiques personnelles', 'mes statistiques', 'progression'] },
  { id: 'recents', page: 'home', title: 'Applications récentes', subtitle: 'Reprendre', words: ['applications recentes', 'apps recentes'] },
  { id: 'favorites', page: 'home', title: 'Jeux favoris', subtitle: 'Votre sélection', words: ['jeux favoris', 'mes favoris'] },
]

const GAME_ALIASES = {
  snake: ['serpent'],
  '2048': ['2048', 'tuiles', 'nombre 2048'],
  minesweeper: ['demineur', 'mines', 'champ de mines'],
  pong: ['pong', 'raquettes'],
  tictactoe: ['morpion', 'tic tac toe', 'tic-tac-toe', 'trois en ligne'],
  memory: ['memory', 'jeu de memoire', 'cartes'],
  reaction: ['reflexes', 'reaction', 'test de reaction', 'temps de reaction'],
  blackbox: ['black box', 'blackbox', 'terminal', 'piratage', 'chambre noire'],
}

const TOOL_ALIASES = {
  password: ['mot de passe', 'mots de passe', 'password', 'generateur de mots de passe'],
  qrcode: ['qr code', 'qrcode', 'qr'],
  wheel: ['roue', 'roue aleatoire', 'wheel'],
  color: ['couleurs', 'couleur', 'palette', 'generateur de couleurs'],
  eyedropper: ['pipette', 'pipette de couleurs', 'prelever une couleur'],
  converter: ['convertisseur d unites', 'convertisseur', 'conversion', 'unites', 'bases numeriques'],
  random: ['generateur de nombres aleatoires', 'nombres aleatoires', 'des a jouer'],
  datecalc: ['calcul de dates', 'calculateur de dates', 'calcul dates'],
}

const THEME_MAP = {
  midnight: ['midnight', 'sombre', 'nuit', 'noir', 'bleu nuit'],
  graphite: ['graphite', 'gris', 'mineral', 'minéral'],
  frost: ['frost', 'clair', 'claire', 'lumineux', 'jour', 'blanc'],
}

const ACCENT_MAP = {
  blue: ['bleu', 'ocean', 'océan'],
  violet: ['violet', 'violette', 'lavande'],
  mint: ['menthe', 'vert', 'verte', 'mint'],
  amber: ['ambre', 'jaune', 'or'],
  rose: ['rose', 'corail'],
  cyan: ['cyan', 'turquoise'],
}

const STOP_WORDS = new Set(
  `le la les un une des de du d l a au aux et ou où en dans pour par sur avec sans que qui quoi dont est sont ete été etait était ai as avons avez ont j je tu il elle on nous vous ils elles me te se ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs y ne pas plus tres très si mais donc car or ni puis ensuite aussi comme tout tous toute toutes meme même cela ca ça ceci celui celle ceux celles quand comment pourquoi quel quelle quels quelles`.split(
    /\s+/,
  ),
)

const COMMAND_WORDS = new Set(
  `cherche cherche-moi recherche retrouve trouve trouver ouvre ouvre-moi affiche montre dis moi raconte donne lance joue demarre démarre va navigue amene emmène passe rends retourne cree crée creer créer ajoute ecris écris ecrire écrire prends note notes carnet mot mots ecrit écrit ecrire écrire parle parlent sujet propos vieux vieille vieilles ancienne ancien recent recente récente plus derniere dernière dernier stp s il te plait plaît peux veux voudrais aide merci genere génère generer générer active desactive désactive rallume coupe`.split(
    /\s+/,
  ),
)

export function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLowerCase()
    .trim()
}

function wordList(value) {
  return normalize(value)
    .split(/[^a-z0-9'-]+/)
    .filter(Boolean)
}

function stripQueryNoise(value) {
  return value
    .replace(/^(s['’]il te pla[iî]t|stp|merci)\s+/i, '')
    .replace(/\b(s['’]il te pla[iî]t|stp|merci)\b/gi, '')
    .trim()
}

function contentWords(value) {
  return (value.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9'-]+/g) ?? []).filter((word) => {
    const normalized = normalize(word)
    return (
      normalized.length > 1 &&
      !STOP_WORDS.has(normalized) &&
      !COMMAND_WORDS.has(normalized)
    )
  })
}

function capitalizeFirst(value) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return count > 1 ? pluralForm : singular
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[b.length]
}

function fuzzyWordIn(text, word) {
  if (word.length < 5) return false
  if (text.includes(word)) return true
  return wordList(text).some((candidate) => Math.abs(candidate.length - word.length) <= 1 && levenshtein(candidate, word) <= 1)
}

function makeSnippet(note, query) {
  const body = (note.body ?? '').replace(/\s+/g, ' ').trim()
  if (!body) return note.title ? 'Note sans contenu.' : 'Note vide.'
  const normalizedBody = normalize(body)
  const firstWord = wordList(query)[0] ?? ''
  const index = firstWord ? normalizedBody.indexOf(firstWord) : -1
  if (index < 0) return body.slice(0, 150) + (body.length > 150 ? '…' : '')
  const start = Math.max(0, index - 50)
  const end = Math.min(body.length, index + 120)
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`
}

export function searchNotes(notes, query, limit = 5) {
  const q = normalize(query)
  if (!q) return []
  const qWords = wordList(q).filter((word) => !STOP_WORDS.has(word))
  const phrase = qWords.join(' ')
  return notes
    .map((note) => {
      const title = normalize(note.title ?? '')
      const body = normalize(note.body ?? '')
      const category = normalize(note.category ?? '')
      let score = 0
      if (title.includes(phrase)) score += 24
      if (body.includes(phrase)) score += 14
      if (category.includes(phrase)) score += 5
      for (const word of qWords) {
        if (title.includes(word)) score += 8
        else if (body.includes(word)) score += 3
        else if (category.includes(word)) score += 2
        else if (fuzzyWordIn(body, word) || fuzzyWordIn(title, word)) score += 1
      }
      if (!score) return null
      if (note.pinned) score += 1
      score += Math.min(2, ((note.updatedAt ?? 0) / Date.now()) * 2)
      return {
        id: note.id,
        title: note.title || 'Note sans titre',
        category: note.category || 'Général',
        updatedAt: note.updatedAt ?? note.createdAt,
        snippet: makeSnippet(note, query),
        score,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

function findMatch(raw, items, aliases = {}) {
  const n = normalize(raw)
  let best = null
  for (const item of items) {
    const names = [item.title, ...(aliases[item.id] ?? [])]
    for (const name of names) {
      const candidate = normalize(name)
      if (!candidate) continue
      let score = 0
      if (n === candidate) score = 120
      else if (n.includes(candidate)) score = 70 + candidate.length
      if (score > (best?.score ?? 0)) best = { item, score }
    }
  }
  return best?.item ?? null
}

function findWidget(raw) {
  const n = normalize(raw)
  let best = null
  for (const widget of WIDGET_INTENTS) {
    for (const word of [widget.title, ...(widget.words ?? [])]) {
      const candidate = normalize(word)
      if (!candidate) continue
      let score = 0
      if (n === candidate) score = 120
      else if (n.includes(candidate)) score = 60 + candidate.length
      if (score > (best?.score ?? 0)) best = { widget, score }
    }
  }
  return best?.widget ?? null
}

function findPage(raw) {
  const n = normalize(raw)
  let best = null
  for (const page of ASSISTANT_PAGES) {
    for (const name of [page.title, ...page.aliases]) {
      const candidate = normalize(name)
      if (!candidate) continue
      let score = 0
      if (n === candidate) score = 120
      else if (n.includes(candidate)) score = 50 + candidate.length
      if (score > (best?.score ?? 0)) best = { page, score }
    }
  }
  return best?.page ?? null
}

function findGame(raw) {
  return findMatch(raw, GAMES, GAME_ALIASES)
}

function findTool(raw) {
  return findMatch(raw, TOOLS, TOOL_ALIASES)
}

function findAccent(raw) {
  const n = normalize(raw)
  for (const [id, words] of Object.entries(ACCENT_MAP)) {
    if (words.some((word) => n.includes(normalize(word)))) return id
  }
  return null
}

function findTheme(raw) {
  const n = normalize(raw)
  for (const [id, words] of Object.entries(THEME_MAP)) {
    if (words.some((word) => n.includes(normalize(word)))) return id
  }
  return null
}

function pageAction(page, prefix = 'J’ouvre') {
  return {
    type: 'navigate',
    page: page.id,
    title: page.title,
    subtitle: page.subtitle,
    label: `${prefix} ${page.title}`,
  }
}

function parseDue(raw) {
  const n = normalize(raw)
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let label = null
  let due = null

  if (/\bapres[- ]demain\b/.test(n)) {
    date.setDate(date.getDate() + 2)
    due = ISO_DAY(date)
    label = 'après-demain'
  } else if (/\bdemain\b/.test(n)) {
    date.setDate(date.getDate() + 1)
    due = ISO_DAY(date)
    label = 'demain'
  } else if (/\baujourd hui\b|\bce soir\b/.test(n)) {
    due = ISO_DAY(date)
    label = 'aujourd’hui'
  } else if (/\bdans (\d+) jours?\b/.test(n)) {
    const amount = Number(n.match(/\bdans (\d+) jours?\b/)[1])
    date.setDate(date.getDate() + amount)
    due = ISO_DAY(date)
    label = `dans ${amount} jour${amount > 1 ? 's' : ''}`
  } else {
    const weekdays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    for (let index = 0; index < weekdays.length; index += 1) {
      if (new RegExp(`\\b${weekdays[index]}\\b`).test(n)) {
        let delta = (index - date.getDay() + 7) % 7
        if (delta === 0) delta = 7
        date.setDate(date.getDate() + delta)
        due = ISO_DAY(date)
        label = weekdays[index]
        break
      }
    }
  }
  return { due, label }
}

function cleanTaskTitle(raw) {
  let text = stripQueryNoise(raw)
  text = text
    .replace(/^(rappelle[- ]moi\s+(de\s+|d['’]|que je dois\s+)?)/i, '')
    .replace(/^(n['’]oublie pas\s+(de\s+|d['’])?)/i, '')
    .replace(/^(ajoute|crée|cree|créer|planifie)\s+(une\s+|la\s+)?(tâche|tache|todo)\s*(de\s+|:)?/i, '')
    .replace(/^(ajoute|crée|cree|créer)\s+(une\s+)?(tâche|tache|todo)\s*(de\s+|:)?/i, '')
    .replace(/\b(pour|avant|à|a)\s+(aujourd['’]hui|demain|après[- ]demain|apres[- ]demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|dans \d+ jours?)\b.*$/i, '')
    .replace(/\b(aujourd['’]hui|demain|après[- ]demain|apres[- ]demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\b.*$/i, '')
    .replace(/^[:\-–—\s]+/, '')
    .trim()
  if (text.length < 2) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function cleanNoteText(raw) {
  let text = stripQueryNoise(raw)
  text = text
    .replace(/^(crée|créer|cree|créer|ajoute|écris|ecris|écrire|ecrire|prends|nouvelle)\s+(une\s+|la\s+|ma\s+)?note\s*(sur|à propos de|a propos de|pour|:)?\s*/i, '')
    .replace(/^(note|nouvelle note)\s*[:\-–—]\s*/i, '')
    .replace(/^[:\-–—\s]+/, '')
    .trim()
  return text
}

function searchWorkspace(data, query) {
  const q = normalize(query)
  const qWords = wordList(q).filter((word) => !STOP_WORDS.has(word))
  if (!qWords.length) return { notes: [], tasks: [], bookmarks: [] }
  const notes = searchNotes(data.notes, query, 5)
  const tasks = (data.tasks ?? [])
    .filter((task) => {
      const text = normalize(task.title)
      return qWords.every((word) => text.includes(word))
    })
    .slice(0, 4)
  const bookmarks = (data.bookmarks ?? [])
    .filter((bookmark) => {
      const text = normalize(`${bookmark.name} ${bookmark.url}`)
      return qWords.some((word) => text.includes(word))
    })
    .slice(0, 4)
  return { notes, tasks, bookmarks }
}

function createResult(reply, extra = {}) {
  return {
    reply,
    actions: extra.actions ?? [],
    notes: extra.notes ?? [],
    suggestions: extra.suggestions ?? defaultSuggestions(),
    closeAssistant: extra.closeAssistant ?? false,
    multi: extra.multi ?? false,
    kind: extra.kind ?? 'local',
  }
}

export function defaultSuggestions() {
  return [
    'Cherche un mot dans mes notes',
    'Ouvre ma calculatrice',
    'Lance Snake',
    'Visite NEXUS',
    'Mode discret',
  ]
}

function capabilitiesReply(prefs) {
  return `Je suis NEXUS Mind, votre assistant${prefs?.name ? ` de ${prefs.name}` : ''}. Je peux chercher un mot dans vos notes, ouvrir une page, un jeu, un outil ou un widget, créer une note ou une tâche, et changer vos préférences. Je peux aussi répondre aux questions générales si une IA conversationnelle est connectée dans les paramètres.`
}

function statsReply(data) {
  const level = levelInfo(data.stats.xp)
  const activeTasks = data.tasks.filter((task) => !task.done).length
  const notes = data.notes.length
  const played = data.stats.gamesPlayed
  return `Niveau ${level.level} (${level.title}), ${data.stats.xp} XP. Vous avez ${notes} ${plural(notes, 'note')}, ${activeTasks} ${plural(activeTasks, 'tâche')} en attente et ${played} ${plural(played, 'partie jouée', 'parties jouées')}.`
}

function isOpenVerb(normalized) {
  return /\b(ouvre|ouvrir|lance|lancer|joue|demarre|démarre|affiche|montre|va|aller|navigue|amene|emmene|passe|accede|retourne|reviens|genere|génère|generer|générer|donne|fais)\b/.test(
    normalized,
  )
}

function isGeneralQuestion(raw, normalized) {
  if (/^(resume|résume|resume-moi|résume-moi|fais-moi un (petit )?r[ée]sum[ée])/.test(normalized)) return true
  const startsLikeQuestion =
    /^(pourquoi|comment|qu['’]?est[- ]ce|que |quels?|quelles?|qui\b|quand\b|où\b|ou\b|explique|raconte|résume|resume|donne[- ]moi (des |une )?idées?|peux[- ]tu (m['’]expliquer|me (dire|raconter))|what|why|how)\b/i.test(
      raw,
    ) || /resume|résume|resumer|résumer/.test(normalized)
  const questionMark = /\?\s*$/.test(raw)
  if (!startsLikeQuestion && !questionMark) return false
  if (/(ouvre|lance|joue|cherche|recherche|trouve|retrouve|crée|cree|ajoute|supprime|marque|épingle|epingle|active|désactive|desactive|coupe|change|mets|passe|va|navigue|ferme|exporte|visite|mode)\b/.test(normalized)) {
    return false
  }
  if (/(mes notes|\bnotes?\b|\bmots?\b|\bécrit|\becrit|\btaches?\b|\btâches?\b|\btodo\b|\brecords?\b|\bniveaux?\b|\bxp\b|progression|\bcombien\b|quelle heure|quelle date|mes favoris|mon agenda|meteo|météo|quel temps|dashboard|arcade|outils|calculatrice|minuteur|chronometre|compte a rebours|fuseau|calendrier)/.test(normalized)) {
    return false
  }
  return true
}

function extractSearchQuery(raw) {
  const text = stripQueryNoise(raw)
  const patterns = [
    /(?:cherche|recherche|retrouve|trouve|où est|ou est|où ai-je écrit|ou ai-je ecrit|qu['’]est-ce que j['’]ai écrit|qu['’]est-ce que j['’]ai ecrit)\s+(?:le\s+|la\s+|les\s+|un\s+|une\s+)?(?:mot\s+|mots\s+)?(.+)/i,
    /(?:dans|parmi)\s+(?:mes|les|ta|tes|vos)\s+notes?\s*[:,]?\s*(.+)/i,
    /note\s+(?:sur|à propos de|a propos de|au sujet de)\s+(.+)/i,
    /(?:j['’]ai|j ai)\s+(?:écrit|ecrit|noté|note)\s+(?:le\s+|la\s+)?(?:mot\s+)?(.+)/i,
    /(?:mot|mots)\s*[:,]?\s*(.+)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/\b(dans|parmi)\s+(mes|les|ta|tes|vos)\s+notes?\b.*$/i, '')
        .replace(/\b(s['’]il te pla[iî]t|stp|merci)\b.*$/i, '')
        .trim()
      const words = contentWords(cleaned)
      if (words.length) return words.join(' ')
    }
  }
  return contentWords(text).join(' ').trim()
}

function interpretSingle(input, { data, prefs }) {
  const raw = input.trim()
  const n = normalize(raw)
  const openVerb = isOpenVerb(n)

  if (!n) return createResult('Je vous écoute.')

  if (/^(bonjour|bonsoir|salut|coucou|hey|hello)\b/.test(n) && n.length < 50) {
    return createResult(
      `Bonjour${prefs?.name ? ` ${prefs.name}` : ''}. Je peux chercher dans vos notes, ouvrir une page, lancer un jeu ou vous faire visiter NEXUS.`,
    )
  }

  if (
    /^(aide|help)\b/.test(n) ||
    /(que peux[- ]tu|que sais[- ]tu|tes capacites|qui es[- ]tu|tu es qui|comment (fonctionnes|marches)[- ]tu)/.test(n)
  ) {
    return createResult(capabilitiesReply(prefs), {
      suggestions: [
        'Trouve le mot ordinateur dans mes notes',
        'Ouvre le Dashboard',
        'Change le thème en Frost',
        'Fais le tour du site',
      ],
    })
  }

  if (
    /\b(tour|visite|visiter|démo|demo|promenade)\b/.test(n) &&
    /(site|nexus|pages?|découvrir|decouvrir)/.test(n)
  ) {
    const pages = ASSISTANT_PAGES.map((page) => pageAction(page, 'Je vous emmène sur'))
    pages.push(pageAction(ASSISTANT_PAGES[0], 'Je reviens sur'))
    return createResult('Je vous fais visiter NEXUS, page par page.', {
      actions: pages,
      suggestions: ['Où ai-je écrit un mot ?', 'Ouvre un jeu', 'Mode discret'],
    })
  }

  if (/(ferme|fermer)\s+(la\s+)?(fen[êe]tre|panneau|modal|modale|overlay|tout)/.test(n) || /^ferme$/.test(n)) {
    return createResult('Je referme les fenêtres ouvertes.', {
      actions: [{ type: 'closeOverlays', label: 'Je referme les fenêtres' }],
    })
  }

  if (/(ferme|fermer)\s+(l['’]|le\s+)?assistant|tais toi|va t en/.test(n)) {
    return createResult('Je me retire. Appelez-moi quand vous voulez.', {
      actions: [{ type: 'closeAssistant', label: 'Je ferme l’assistant' }],
      closeAssistant: true,
    })
  }

  if (/(derniere|dernière|plus recente|plus récente|recente|récente)\s+note|note\s+(la\s+)?(derniere|dernière|plus recente|plus récente)/.test(n)) {
    const recent = [...data.notes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0]
    if (!recent) return createResult('Vous n’avez encore aucune note enregistrée.')
    return createResult(`J’ouvre votre note la plus récente : « ${recent.title || 'Note sans titre'} ».`, {
      actions: [{ type: 'openNote', id: recent.id, title: recent.title || 'Note sans titre', label: 'J’ouvre votre note la plus récente' }],
    })
  }

  const wantsNoteSearch =
    /(note|notes|carnet|écrit|ecrit|mot|mots)/.test(n) &&
    /(cherche|recherche|retrouve|trouve|ouvre|affiche|montre|où|ou est|ai je|j ai ecrit|j'ai écrit|parle|sujet)/.test(n)
  if (wantsNoteSearch) {
    const query = extractSearchQuery(raw)
    if (!query) {
      if (openVerb) return createResult('J’ouvre votre espace Notes.', { actions: [pageAction(ASSISTANT_PAGES[4])] })
      return createResult('Quel mot ou sujet dois-je chercher dans vos notes ?', {
        suggestions: ['Cherche « rendez-vous » dans mes notes', 'Ouvre mes notes'],
      })
    }
    const matches = searchNotes(data.notes, query, 5)
    if (!matches.length) {
      return createResult(
        `Je n’ai trouvé « ${query} » dans aucune de vos ${data.notes.length} notes. Essayez un autre mot, ou demandez-moi de créer une note.`,
        { suggestions: [query, 'Ouvre mes notes', 'Crée une note'] },
      )
    }
    const top = matches[0]
    if (/ouvre|affiche|montre|va sur|amène|amene/.test(n)) {
      return createResult(`J’ai trouvé ${matches.length} ${plural(matches.length, 'note')}. J’ouvre « ${top.title} ».`, {
        actions: [{ type: 'openNote', id: top.id, title: top.title, label: `J’ouvre « ${top.title} »` }],
        notes: matches,
      })
    }
    return createResult(
      `J’ai trouvé ${matches.length} ${plural(matches.length, 'note')} qui ${matches.length > 1 ? 'parlent' : 'parle'} de « ${query} ». La plus pertinente est « ${top.title} ».`,
      { notes: matches },
    )
  }

  const wantsTaskCreate =
    (/(ajoute|crée|cree|créer|planifie|rappelle|n['’]oublie pas)/.test(n) &&
      /(tache|tâche|todo|rappelle|n['’]oublie pas)/.test(n)) ||
    /^(rappelle[- ]moi|n['’]oublie pas)/.test(n)
  if (wantsTaskCreate) {
    const due = parseDue(raw)
    const title = cleanTaskTitle(raw)
    if (!title) {
      return createResult('Que dois-je mettre dans cette tâche ?', {
        suggestions: ['Ajoute une tâche : appeler maman', 'Rappelle-moi de ranger demain'],
      })
    }
    const when = due.label ? ` pour ${due.label}` : ''
    return createResult(`J’ai ajouté la tâche « ${title} »${when}.`, {
      actions: [{ type: 'createTask', title, due: due.due, label: `J’ajoute la tâche « ${title} »` }],
      suggestions: ['Ouvre mes tâches', 'Ajoute une autre tâche'],
    })
  }

  const wantsTaskDone =
    /(termine|terminer|coche|cocher|valide|marque)/.test(n) &&
    /(tache|tâche|todo|fait|faite)/.test(n)
  if (wantsTaskDone) {
    let query = stripQueryNoise(raw)
      .replace(/^(marque|coche|termine|valide)\s+(la\s+|ma\s+|une\s+)?(tâche|tache|todo)\s*(comme\s+)?/i, '')
      .replace(/\b(comme\s+)?(terminée|terminee|terminé|termine|faite|fait|validee|validée)\b.*$/i, '')
      .replace(/^(coche|termine|valide)\s+/i, '')
      .trim()
    const words = contentWords(query)
    const needle = normalize(words.join(' '))
    const task =
      data.tasks.find((item) => !item.done && needle && normalize(item.title).includes(needle)) ??
      data.tasks.find((item) => !item.done && words.every((word) => normalize(item.title).includes(normalize(word))))
    if (!task) {
      return createResult('Je ne trouve pas cette tâche en cours. Précisez son nom.', {
        suggestions: ['Ouvre mes tâches', 'Ajoute une tâche'],
      })
    }
    return createResult(`J’ai marqué la tâche « ${task.title} » comme terminée.`, {
      actions: [{ type: 'completeTask', id: task.id, label: `Je termine « ${task.title} »` }],
    })
  }

  const wantsTaskDelete =
    /(supprime|supprimer|enleve|enlève|retire)\s+(la\s+|ma\s+|une\s+)?(tâche|tache|todo)/.test(n) &&
    /(tache|tâche|todo)/.test(n)
  if (wantsTaskDelete) {
    const query = contentWords(raw.replace(/.*?\b(?:tâche|tache|todo)\b/i, '')).join(' ')
    const words = contentWords(query)
    const task = data.tasks.find((item) => words.length && words.every((word) => normalize(item.title).includes(normalize(word))))
    if (task) {
      return createResult(`Je supprime la tâche « ${task.title} ».`, {
        actions: [{ type: 'deleteTask', id: task.id, label: `Je supprime « ${task.title} »` }],
      })
    }
    return createResult('Quelle tâche dois-je supprimer ?')
  }

  const pinIntent = /(epingle|épingle|desepingle|désépingle|pin)/.test(n) && /(note|notes)/.test(n)
  if (pinIntent) {
    const unpin = /(desepingle|désépingle|retire)/.test(n)
    const query = extractSearchQuery(raw.replace(/^(des)?[ée]pingle\s+/i, ''))
    const matches = searchNotes(data.notes, query, 1)
    if (!matches.length) {
      return createResult(query ? `Je n’ai pas trouvé de note correspondant à « ${query} ».` : 'Quelle note dois-je épingler ?')
    }
    const note = matches[0]
    return createResult(
      unpin ? `Je désépingle « ${note.title} ».` : `J’épingle « ${note.title} » en haut de vos notes.`,
      {
        actions: [{ type: 'pinNote', id: note.id, pinned: !unpin, label: unpin ? 'Je désépingle la note' : 'J’épingle la note' }],
      },
    )
  }

  const wantsNoteCreate =
    /(crée|cree|créer|creer|ajoute|écris|ecris|écrire|ecrire|prends|nouvelle)\b.*\bnote\b/.test(n) ||
    /^note\s*[:\-–—]/.test(n)
  if (wantsNoteCreate) {
    const text = cleanNoteText(raw)
    if (!text) {
      return createResult('Que dois-je écrire dans cette note ?', {
        suggestions: ['Crée une note sur les idées du projet', 'Nouvelle note : appeler le garage'],
      })
    }
    const long = text.length > 72
    const title = long ? `${capitalizeFirst(text.slice(0, 72).trimEnd())}…` : capitalizeFirst(text)
    const body = long ? text : ''
    return createResult(`J’ai créé la note « ${title} » et je l’ouvre.`, {
      actions: [{ type: 'createNote', title, body, label: `Je crée la note « ${title} »` }],
    })
  }

  if (/(ajoute|enregistre|crée|cree)\b.*\b(lien|signet|favori web)\b/.test(n)) {
    const url = raw.match(/https?:\/\/[^\s]+/i)?.[0]
    if (!url) {
      return createResult('Donnez-moi l’adresse du lien, par exemple : « ajoute le lien https://exemple.fr ».')
    }
    let name = raw
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/(ajoute|enregistre|crée|cree)\s+(un\s+|le\s+)?(lien|signet|favori web)\s*/i, '')
      .trim()
      .replace(/^(pour|vers|:|-)?\s*/i, '')
    if (!name) {
      try {
        name = new URL(url).hostname.replace(/^www\./, '')
      } catch {
        name = 'Lien'
      }
    }
    return createResult(`J’ai ajouté le lien « ${name} » à vos raccourcis.`, {
      actions: [{ type: 'createBookmark', name, url, label: `J’ajoute le lien « ${name} »` }],
    })
  }

  const favoriteIntent =
    /(favori|favoris)/.test(n) && /(ajoute|mets|met|retire|enleve|enlève|supprime)/.test(n)
  if (favoriteIntent) {
    const game = findGame(raw)
    if (!game) {
      return createResult('De quel jeu parlez-vous ?', { suggestions: ['Ajoute Snake aux favoris', 'Ouvre mes jeux favoris'] })
    }
    const add = !/(retire|enleve|enlève|supprime)/.test(n)
    const isFavorite = prefs.favorites?.includes(game.id)
    if (add && isFavorite) return createResult(`${game.title} est déjà dans vos favoris.`)
    if (!add && !isFavorite) return createResult(`${game.title} n’est pas dans vos favoris.`)
    return createResult(
      add ? `J’ajoute ${game.title} à vos favoris.` : `Je retire ${game.title} de vos favoris.`,
      {
        actions: [{ type: 'setFavoriteGame', id: game.id, favorite: add, label: add ? 'J’ajoute le jeu aux favoris' : 'Je retire le jeu des favoris' }],
      },
    )
  }

  const themeRequested = /(theme|thème|ambiance|mode clair|mode sombre)/.test(n)
  if (themeRequested) {
    const theme = findTheme(raw)
    if (theme) {
      const names = { midnight: 'Midnight', graphite: 'Graphite', frost: 'Frost' }
      return createResult(`Je passe le thème en ${names[theme]}.`, {
        actions: [{ type: 'setTheme', value: theme, label: `Je passe en thème ${names[theme]}` }],
      })
    }
    return createResult('Choisissez un thème : Midnight, Graphite ou Frost.')
  }

  if (/(accent|couleur d accent|changer la couleur)/.test(n)) {
    const accent = findAccent(raw)
    if (accent) {
      const names = { blue: 'Océan', violet: 'Violette', mint: 'Menthe', amber: 'Ambre', rose: 'Rose', cyan: 'Cyan' }
      return createResult(`Je mets l’accent en ${names[accent]}.`, {
        actions: [{ type: 'setAccent', value: accent, label: `Je change l’accent en ${names[accent]}` }],
      })
    }
    return createResult('Quelle couleur d’accent ? Océan, Violette, Menthe, Ambre, Rose ou Cyan.')
  }

  if (/(mode silencieux|tais toi|coupe ta voix|désactive ta voix|desactive ta voix|sans voix|silence)/.test(n)) {
    return createResult('Je reste silencieuse. Le texte continuera de s’écrire.', {
      actions: [{ type: 'setPref', key: 'aiVoice', value: false, label: 'Je passe en mode silencieux' }],
    })
  }

  if (/(active ta voix|rallume ta voix|parle à nouveau|parle a nouveau|remets ta voix|mode vocal)/.test(n)) {
    return createResult('Je réactive ma voix.', {
      actions: [{ type: 'setPref', key: 'aiVoice', value: true, label: 'Je réactive la voix' }],
    })
  }

  if (/(désactive|desactive|coupe|mets|met)\s+(le\s+|les\s+)?(son|sons)\b/.test(n) && !/assistant|voix/.test(n)) {
    return createResult('Je coupe les sons de l’interface.', {
      actions: [{ type: 'setPref', key: 'sound', value: false, label: 'Je coupe les sons' }],
    })
  }
  if (/(active|rallume|remets)\s+(le\s+|les\s+)?(son|sons)\b/.test(n)) {
    return createResult('Je réactive les sons.', {
      actions: [{ type: 'setPref', key: 'sound', value: true, label: 'Je réactive les sons' }],
    })
  }

  if (/(mode discret|réduis les effets|reduis les effets)/.test(n)) {
    return createResult('Je passe en mode discret.', {
      actions: [{ type: 'setPref', key: 'discreteMode', value: true, label: 'Je passe en mode discret' }],
    })
  }
  if (/(désactive|desactive|coupe)\s+(les\s+)?animations/.test(n)) {
    return createResult('Je réduis les animations.', {
      actions: [{ type: 'setPref', key: 'animations', value: false, label: 'Je réduis les animations' }],
    })
  }
  if (/(active|rétablis|retablis)\s+(les\s+)?animations/.test(n)) {
    return createResult('Je réactive les animations.', {
      actions: [{ type: 'setPref', key: 'animations', value: true, label: 'Je réactive les animations' }],
    })
  }

  if (/(replie|masque|cache)\s+(la\s+)?barre lat[ée]rale/.test(n)) {
    return createResult('Je replie la barre latérale.', {
      actions: [{ type: 'setPref', key: 'sidebarCollapsed', value: true, label: 'Je replie la barre latérale' }],
    })
  }
  if (/(déploie|deploie|ouvre|affiche)\s+(la\s+)?barre lat[ée]rale/.test(n)) {
    return createResult('Je déploie la barre latérale.', {
      actions: [{ type: 'setPref', key: 'sidebarCollapsed', value: false, label: 'Je déploie la barre latérale' }],
    })
  }

  if (/(personnalise|personnaliser|modifie|change)/.test(n) && /(disposition|dashboard|tableau de bord|accueil|widgets?)/.test(n)) {
    const page = /dashboard|tableau de bord/.test(n) ? 'dashboard' : 'home'
    return createResult('J’ouvre le panneau de personnalisation.', {
      actions: [{ type: 'openCustomize', page, label: 'J’ouvre la personnalisation' }],
    })
  }

  if (/(exporte|sauvegarde|télécharge|telecharge)\s+(mes\s+)?(données|donnees|sauvegarde|nexus)/.test(n)) {
    return createResult('J’exporte toutes vos données dans un fichier JSON.', {
      actions: [{ type: 'exportData', label: 'J’exporte vos données' }],
    })
  }

  if (/^(ouvre|affiche|montre)?\s*(la\s+)?recherche globale$/.test(n) || /(ouvre|affiche)\s+(la\s+)?recherche/.test(n)) {
    return createResult('J’ouvre la recherche globale.', {
      actions: [{ type: 'openSearch', label: 'J’ouvre la recherche' }],
    })
  }

  if (/(quelle heure|quel heure|heure est il|heure est-il)/.test(n)) {
    const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())
    return createResult(`Il est ${time}.`)
  }
  if (/(quelle date|quel jour|date est il|date est-il|on est quel jour)/.test(n)) {
    const date = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
    return createResult(`Nous sommes ${date}.`)
  }

  const recordGame = GAMES.find((game) => {
    const candidates = [game.title, ...(GAME_ALIASES[game.id] ?? [])].map(normalize)
    return candidates.some((candidate) => n.includes(candidate))
  })
  if (/record|meilleur score|meilleure score/.test(n) && recordGame) {
    const bests = data.stats.bests
    let detail = 'Aucun record enregistré.'
    if (recordGame.id === 'snake') detail = bests.snake ? `${bests.snake} points` : detail
    else if (recordGame.id === '2048') detail = bests['2048'] ? `${bests['2048']} points, tuile ${bests['2048Tile']}` : detail
    else if (recordGame.id === 'reaction') detail = bests.reaction != null ? `${bests.reaction} ms` : detail
    else if (recordGame.id === 'blackbox') detail = `${bests.blackbox ?? 0} / 5 missions`
    else if (recordGame.id === 'minesweeper') detail = Object.values(bests.minesweeper ?? {}).filter(Boolean).length ? 'Consultez le classement de l’arcade.' : detail
    else if (recordGame.id === 'pong') detail = `${bests.pong?.wins ?? 0} victoires`
    else if (recordGame.id === 'tictactoe') detail = `${bests.tictactoe?.wins ?? 0} victoires`
    else if (recordGame.id === 'memory') detail = bests.memory ? `${bests.memory.attempts} essais` : detail
    return createResult(`Votre record à ${recordGame.title} : ${detail}.`)
  }

  if (/(combien de notes|nombre de notes|niveau|\bxp\b|progression|statistiques|combien de taches|combien de tâches|combien de parties|mes records|mes favoris|ou en suis je|où en suis-je)/.test(n) && !openVerb) {
    if (/(combien de notes|nombre de notes)/.test(n)) {
      return createResult(`Vous avez ${data.notes.length} ${plural(data.notes.length, 'note')} enregistrée${data.notes.length > 1 ? 's' : ''}.`)
    }
    if (/(mes favoris|jeux favoris)/.test(n)) {
      const favorites = prefs.favorites.map((id) => GAMES.find((game) => game.id === id)?.title).filter(Boolean)
      return createResult(favorites.length ? `Vos jeux favoris : ${favorites.join(', ')}.` : 'Vous n’avez pas encore de jeu favori.')
    }
    if (/(combien de taches|combien de tâches)/.test(n)) {
      const active = data.tasks.filter((task) => !task.done).length
      return createResult(`${active} ${plural(active, 'tâche')} en attente, ${data.tasks.filter((task) => task.done).length} terminée${data.tasks.filter((task) => task.done).length > 1 ? 's' : ''}.`)
    }
    if (/(combien de parties|mes records)/.test(n)) {
      return createResult(`${data.stats.gamesPlayed} ${plural(data.stats.gamesPlayed, 'partie jouée', 'parties jouées')}. Consultez l’arcade pour le classement détaillé.`)
    }
    return createResult(statsReply(data))
  }

  if (/(quelle est la meteo|quel temps|il fait quel temps|ouvre.*meteo)/.test(n) || (/(meteo)/.test(n) && !openVerb)) {
    return createResult('J’ouvre votre météo et son état actuel.', {
      actions: [{ type: 'openWidget', id: 'weather', page: 'home', title: 'Météo', subtitle: 'Conditions réelles', label: 'J’ouvre votre météo' }],
    })
  }

  if (isGeneralQuestion(raw, n)) {
    return createResult(
      'Je peux répondre à cette question si une IA conversationnelle est connectée. Ouvre les paramètres pour ajouter un fournisseur compatible (OpenRouter, OpenAI, Groq, Gemini ou Ollama).',
      {
        kind: 'general',
        suggestions: ['Ouvre les paramètres', 'Cherche dans mes notes', 'Ouvre ma calculatrice'],
      },
    )
  }

  const tool = findTool(raw)
  if (tool) {
    return createResult(`J’ouvre l’outil ${tool.title}.`, {
      actions: [{ type: 'openTool', id: tool.id, title: tool.title, label: `J’ouvre ${tool.title}` }],
    })
  }

  const widget = findWidget(raw)
  if (widget) {
    return createResult(`J’ouvre ${widget.title}.`, {
      actions: [{ type: 'openWidget', id: widget.id, page: widget.page, title: widget.title, subtitle: widget.subtitle, label: `J’ouvre ${widget.title}` }],
    })
  }

  const game = findGame(raw)
  if (game) {
    return createResult(`Je lance ${game.title}.`, {
      actions: [{ type: 'openGame', id: game.id, title: game.title, label: `Je lance ${game.title}` }],
    })
  }

  const page = findPage(raw)
  if (page && (openVerb || n.includes(normalize(page.title)) || raw.length < 40)) {
    return createResult(`J’ouvre ${page.title}.`, { actions: [pageAction(page)] })
  }

  if (/(lance|joue|démarre|demarre|ouvre)\s+(un\s+|une\s+)?(jeu|partie)/.test(n) || /^jeux?$/.test(n)) {
    return createResult('J’ouvre l’arcade.', { actions: [pageAction(ASSISTANT_PAGES[2])] })
  }

  const query = extractSearchQuery(raw)
  if (query) {
    const found = searchWorkspace(data, query)
    const bits = []
    if (found.notes.length) bits.push(`${found.notes.length} ${plural(found.notes.length, 'note')}`)
    if (found.tasks.length) bits.push(`${found.tasks.length} ${plural(found.tasks.length, 'tâche')}`)
    if (found.bookmarks.length) bits.push(`${found.bookmarks.length} ${plural(found.bookmarks.length, 'lien')}`)
    if (bits.length) {
      return createResult(
        `J’ai trouvé ${bits.join(', ')} pour « ${query} ».${found.notes.length ? ` La note la plus pertinente est « ${found.notes[0].title} ».` : ''}`,
        { notes: found.notes },
      )
    }
  }

  return createResult(
    `Je n’ai pas trouvé « ${raw.slice(0, 60)} » dans votre espace. Je peux chercher un mot dans vos notes, ouvrir une page, lancer un jeu, créer une note ou changer vos préférences.`,
    {
      kind: 'fallback',
      suggestions: ['Trouve le mot vacances dans mes notes', 'Ouvre mes notes', 'Lance Memory', 'Fais-moi visiter NEXUS'],
    },
  )
}

function splitSegments(input) {
  return input
    .split(/\s+(?:puis|ensuite|et puis|apr[èe]s(?:\s+ça)?)\s+/i)
    .flatMap((part) =>
      part.split(
        /\s+et\s+(?=(?:ouvre|lance|joue|affiche|montre|va|navigue|cherche|trouve|crée|cree|ajoute|active|désactive|desactive|change|ferme|passe)\b)/i,
      ),
    )
    .map((part) => part.trim())
    .filter(Boolean)
}

export function interpret(input, context) {
  const segments = splitSegments(input)
  if (segments.length > 1) {
    const results = segments.map((segment) => interpretSingle(segment, context))
    const notes = results.flatMap((entry) => entry.notes ?? []).slice(0, 5)
    const cloudish = results.every((entry) => entry.kind === 'general' || entry.kind === 'fallback')
    return createResult(
      results.map((entry) => entry.reply).filter(Boolean).join(' '),
      {
        actions: results.flatMap((entry) => entry.actions ?? []),
        notes,
        suggestions: results.at(-1)?.suggestions ?? defaultSuggestions(),
        closeAssistant: results.some((entry) => entry.closeAssistant),
        multi: true,
        kind: cloudish ? 'general' : 'local',
      },
    )
  }
  return interpretSingle(input, context)
}
