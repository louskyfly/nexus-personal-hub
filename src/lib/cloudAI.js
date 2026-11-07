/* Optional conversational AI layer for NEXUS Mind.
   The app remains fully local for actions; this module connects to any
   OpenAI-compatible endpoint for general questions. The key is stored only
   in this browser and is never included in NEXUS exports. */

const STORAGE_KEY = 'nexus.ai.cloud.v1'

export const AI_PRESETS = [
  {
    id: 'off',
    label: 'Local uniquement',
    description: 'Actions NEXUS et recherches locales, sans question générale.',
    baseUrl: '',
    model: '',
    requiresKey: false,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Un seul accès pour de nombreux modèles.',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    requiresKey: true,
    keyHint: 'sk-or-…',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'API ChatGPT / OpenAI.',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    requiresKey: true,
    keyHint: 'sk-…',
  },
  {
    id: 'groq',
    label: 'Groq',
    description: 'Réponses très rapides, modèles ouverts.',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    requiresKey: true,
    keyHint: 'gsk_…',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Endpoint compatible OpenAI de Google AI Studio.',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    requiresKey: true,
    keyHint: 'AIza…',
  },
  {
    id: 'ollama',
    label: 'Ollama local',
    description: 'Modèle exécuté sur votre machine, sans clé.',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    requiresKey: false,
    keyHint: 'aucune clé nécessaire',
  },
  {
    id: 'custom',
    label: 'Personnalisé',
    description: 'Tout endpoint compatible /chat/completions.',
    baseUrl: '',
    model: '',
    requiresKey: false,
    keyHint: 'clé si le fournisseur en demande une',
  },
]

export const DEFAULT_CLOUD_CONFIG = {
  enabled: false,
  preset: 'off',
  baseUrl: '',
  model: '',
  apiKey: '',
  temperature: 0.6,
}

export function getPreset(id) {
  return AI_PRESETS.find((preset) => preset.id === id) ?? AI_PRESETS[0]
}

export function applyPreset(config, presetId) {
  const preset = getPreset(presetId)
  return {
    ...config,
    preset: preset.id,
    enabled: preset.id !== 'off',
    baseUrl: preset.baseUrl,
    model: preset.model,
  }
}

export function loadCloudConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CLOUD_CONFIG }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_CLOUD_CONFIG,
      ...parsed,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    }
  } catch {
    return { ...DEFAULT_CLOUD_CONFIG }
  }
}

export function saveCloudConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    /* storage may be blocked */
  }
  window.dispatchEvent(new Event('nexus:ai-config-changed'))
}

export function clearCloudConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('nexus:ai-config-changed'))
}

export function isCloudConfigured(config = loadCloudConfig()) {
  if (!config?.enabled) return false
  if (!config.baseUrl?.trim() || !config.model?.trim()) return false
  if (config.apiKey?.trim()) return true
  if (config.preset === 'ollama') return true
  return /localhost|127\.0\.0\.1/i.test(config.baseUrl)
}

export function cloudLabel(config = loadCloudConfig()) {
  const preset = getPreset(config.preset)
  return preset.id === 'off' || preset.id === 'custom' ? config.model || preset.label : preset.label
}

function endpointFor(baseUrl) {
  const base = baseUrl.trim().replace(/\/+$/, '')
  if (/\/chat\/completions$/i.test(base)) return base
  if (base.endsWith('/v1')) return `${base}/chat/completions`
  return `${base}/chat/completions`
}

async function requestCompletion(config, messages, { maxTokens = 900, timeout = 40000 } = {}) {
  if (!isCloudConfigured(config)) {
    throw new Error('Aucune IA conversationnelle configurée.')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const headers = {
    'Content-Type': 'application/json',
  }
  if (config.apiKey?.trim()) headers.Authorization = `Bearer ${config.apiKey.trim()}`
  if (config.preset === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin
    headers['X-Title'] = 'NEXUS Personal Hub'
  }

  let response
  try {
    response = await fetch(endpointFor(config.baseUrl), {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model.trim(),
        messages,
        temperature: Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : 0.6,
        max_tokens: maxTokens,
        stream: false,
      }),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Le fournisseur IA n’a pas répondu à temps.')
    throw new Error(
      'Connexion au fournisseur impossible. Vérifiez l’URL, la clé et l’autorisation CORS de votre fournisseur.',
    )
  } finally {
    clearTimeout(timer)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.message ??
      (typeof payload?.error === 'string' ? payload.error : null) ??
      `Erreur HTTP ${response.status}`
    throw new Error(String(message).replace(/\s+/g, ' ').slice(0, 220))
  }

  const content = payload?.choices?.[0]?.message?.content
  const answer = Array.isArray(content)
    ? content.map((part) => (typeof part === 'string' ? part : part?.text ?? '')).join('')
    : content
  if (!answer || !String(answer).trim()) {
    throw new Error('Le fournisseur a renvoyé une réponse vide.')
  }
  return String(answer).trim()
}

export function buildSystemPrompt({ prefs, data, route, noteTitles = [], taskTitles = [] }) {
  const level = data?.stats ? Math.floor((data.stats.xp ?? 0) / 300) + 1 : 1
  const date = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
  const favoriteGames = prefs?.favorites?.length ? prefs.favorites.join(', ') : 'aucun'
  return `Tu es NEXUS Mind, l’assistant conversationnel de NEXUS, un espace numérique personnel.
Tu réponds en français, de façon directe, chaleureuse et concise, sans flatterie ni remplissage. Tu peux développer quand la question le demande.
N’utilise pas de syntaxe Markdown : écris du texte simple, avec des listes en « • » si c’est utile.
Tu ne contrôles pas l’interface : les actions locales de NEXUS sont exécutées par une couche séparée. Ne prétends jamais ouvrir une page, lancer un jeu, créer une note ou modifier l’application. Si on te le demande, réponds que l’assistant local s’en charge.
Ne fabrique jamais une donnée personnelle. Le contexte fourni ci-dessous est limité et peut être incomplet ; dis-le si nécessaire.
Pour les connaissances générales, réponds normalement. Pour l’actualité, rappelle que ta connaissance peut avoir une date limite.
Contexte : ${date}.
Utilisateur : ${prefs?.name || 'invité'}.
Page actuelle : ${route?.page || 'home'}.
Niveau : ${level}. Notes : ${data?.notes?.length ?? 0}. Tâches en attente : ${data?.tasks?.filter((task) => !task.done).length ?? 0}. Parties jouées : ${data?.stats?.gamesPlayed ?? 0}.
Jeux favoris : ${favoriteGames}.
Titres de notes récentes, sans leur contenu : ${noteTitles.length ? noteTitles.join(' · ') : 'aucun'}.
Tâches en cours : ${taskTitles.length ? taskTitles.join(' · ') : 'aucune'}.`
}

export function buildCloudMessages({ history, userText, systemPrompt }) {
  const recent = (history ?? [])
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: String(message.text ?? '').slice(0, 2400),
    }))
  return [
    { role: 'system', content: systemPrompt },
    ...recent,
    { role: 'user', content: userText },
  ]
}

export async function askCloudAI({ config, messages, maxTokens }) {
  return requestCompletion(config, messages, { maxTokens })
}

export async function testCloudConnection(config) {
  return requestCompletion(
    config,
    [
      {
        role: 'user',
        content: 'Réponds uniquement par : connexion réussie.',
      },
    ],
    { maxTokens: 20, timeout: 30000 },
  )
}
