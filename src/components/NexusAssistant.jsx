import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  Gamepad2,
  Home,
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react'
import { NexusMark } from './BootSplash'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useNavigation } from '../state/NavigationContext'
import { useToast } from './Toast'
import { ASSISTANT_PAGES, defaultSuggestions, interpret } from '../lib/assistant'
import { speakAssistant, speechAvailable, stopSpeech } from '../lib/speech'
import { downloadText, timeAgo } from '../lib/utils'
import { playSound } from '../lib/sound'

const PAGE_ICONS = {
  home: Home,
  dashboard: LayoutDashboard,
  arcade: Gamepad2,
  tools: Wrench,
  notes: NotebookPen,
  settings: SettingsIcon,
}

let messageCounter = 0
let activityCounter = 0

const nextMessageId = () => ++messageCounter
const nextActivityId = () => ++activityCounter
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function truncate(text, max = 190) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

function pageMeta(pageId) {
  return ASSISTANT_PAGES.find((page) => page.id === pageId) ?? ASSISTANT_PAGES[0]
}

function useTypewriter(text, animate = true, speed = 15) {
  const [shown, setShown] = useState(animate ? '' : text)

  useEffect(() => {
    if (!animate) {
      setShown(text)
      return undefined
    }
    setShown('')
    if (!text) return undefined
    const chunk = Math.max(1, Math.ceil(text.length / 150))
    let index = 0
    const timer = setInterval(() => {
      index = Math.min(text.length, index + chunk)
      setShown(text.slice(0, index))
      if (index >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, animate, speed])

  return shown
}

function TypedText({ text, animate = true, speed = 15 }) {
  const shown = useTypewriter(text, animate, speed)
  const typing = animate && shown.length < text.length
  return (
    <span className="ai-typed">
      {shown}
      {typing ? <span className="ai-caret" aria-hidden="true" /> : null}
    </span>
  )
}

export function NexusAssistant({ open, onOpenChange }) {
  const { data, addNote, addTask, addBookmark, toggleTask, deleteTask, updateNote } = useData()
  const { prefs, setPref, toggleFavorite } = usePrefs()
  const { navigate, openGame, openTool, openCustomize, openSearch, closeOverlays } = useNavigation()
  const { toast } = useToast()
  const [messages, setMessages] = useState(() => [
    {
      id: nextMessageId(),
      role: 'assistant',
      text: `Je suis NEXUS Mind, votre assistant local${prefs.name ? ` de ${prefs.name}` : ''}. Je cherche dans vos notes, j’ouvre pages, jeux et outils, et j’agis sur vos préférences. Que fait-on ?`,
      welcome: true,
    },
  ])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState(defaultSuggestions)
  const [typingId, setTypingId] = useState(null)
  const [running, setRunning] = useState(false)
  const [activity, setActivity] = useState(null)
  const [portal, setPortal] = useState(null)
  const runningRef = useRef(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const hideTimer = useRef(null)
  const mountedRef = useRef(true)

  const voiceActive = Boolean(prefs.aiVoice && prefs.sound)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(hideTimer.current)
      stopSpeech()
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopSpeech()
      return
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 220)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      stopSpeech()
      onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    const container = messagesRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, typingId, open])

  const startActivity = (message, step = 0, total = 0, tone = 'working') => {
    clearTimeout(hideTimer.current)
    setActivity({ id: nextActivityId(), message, step, total, tone })
  }

  const finishActivity = (message, tone = 'done') => {
    clearTimeout(hideTimer.current)
    setActivity({
      id: nextActivityId(),
      message: truncate(message),
      step: 0,
      total: 0,
      tone,
    })
    hideTimer.current = setTimeout(() => {
      if (mountedRef.current) setActivity(null)
    }, 5200)
  }

  const pushUserMessage = (text) => {
    setMessages((previous) => [...previous, { id: nextMessageId(), role: 'user', text }])
  }

  const pushAssistantMessage = (text, extra = {}) => {
    const id = nextMessageId()
    setMessages((previous) => [...previous, { id, role: 'assistant', text, ...extra }])
    setTypingId(id)
    return id
  }

  const closeChat = () => {
    stopSpeech()
    onOpenChange(false)
  }

  const showPortal = async (pageId, title, subtitle, action) => {
    if (prefs.animations === false) {
      action()
      await wait(380)
      return
    }
    setPortal({ id: Date.now(), page: pageId, title, subtitle, phase: 'in' })
    await wait(260)
    action()
    await wait(320)
    setPortal((previous) => (previous ? { ...previous, phase: 'out' } : previous))
    await wait(270)
    setPortal(null)
    await wait(100)
  }

  const runAction = async (action) => {
    switch (action.type) {
      case 'navigate': {
        const meta = pageMeta(action.page)
        await showPortal(action.page, action.title ?? meta.title, action.subtitle ?? meta.subtitle, () => {
          closeOverlays()
          navigate(action.page)
        })
        break
      }
      case 'openNote': {
        await showPortal('notes', 'Notes', action.title ?? 'Ouverture de la note', () => {
          closeOverlays()
          navigate('notes', { param: action.id })
        })
        break
      }
      case 'createNote': {
        const id = addNote({ title: action.title, body: action.body ?? '', category: 'NEXUS' })
        await showPortal('notes', 'Notes', `Nouvelle note · ${action.title}`, () => {
          closeOverlays()
          navigate('notes', { param: id })
        })
        playSound('success')
        break
      }
      case 'openGame':
        closeOverlays()
        await wait(180)
        openGame(action.id)
        await wait(620)
        break
      case 'openTool':
        closeOverlays()
        await wait(180)
        openTool(action.id)
        await wait(620)
        break
      case 'openWidget': {
        const meta = pageMeta(action.page)
        await showPortal(action.page, action.title ?? meta.title, action.subtitle ?? meta.subtitle, () => {
          closeOverlays()
          navigate(action.page)
        })
        await wait(280)
        window.dispatchEvent(new CustomEvent('nexus:open-widget', { detail: { id: action.id } }))
        await wait(620)
        break
      }
      case 'createTask':
        addTask({ title: action.title, due: action.due ?? null })
        playSound('success')
        await wait(260)
        break
      case 'completeTask':
        toggleTask(action.id)
        playSound('success')
        await wait(260)
        break
      case 'deleteTask':
        deleteTask(action.id)
        playSound('close')
        await wait(260)
        break
      case 'pinNote':
        updateNote(action.id, { pinned: action.pinned !== false })
        playSound('success')
        await wait(260)
        break
      case 'setFavoriteGame':
        if (prefs.favorites.includes(action.id) !== Boolean(action.favorite)) toggleFavorite(action.id)
        playSound('success')
        await wait(260)
        break
      case 'createBookmark':
        addBookmark({ name: action.name, url: action.url })
        playSound('success')
        await wait(260)
        break
      case 'setTheme':
        setPref('theme', action.value)
        playSound('open')
        await wait(320)
        break
      case 'setAccent':
        setPref('accent', action.value)
        playSound('click')
        await wait(320)
        break
      case 'setPref':
        setPref(action.key, action.value)
        playSound('click')
        await wait(260)
        break
      case 'openCustomize':
        closeChat()
        closeOverlays()
        await wait(160)
        openCustomize(action.page ?? 'dashboard')
        await wait(450)
        break
      case 'openSearch':
        closeChat()
        closeOverlays()
        await wait(160)
        openSearch()
        await wait(400)
        break
      case 'closeOverlays':
        closeOverlays()
        await wait(320)
        break
      case 'closeAssistant':
        closeChat()
        break
      case 'exportData': {
        const payload = {
          app: 'NEXUS',
          format: 'nexus-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          content: data,
          prefs,
        }
        downloadText(
          JSON.stringify(payload, null, 2),
          `nexus-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`,
        )
        toast({ title: 'Sauvegarde exportée par NEXUS Mind', tone: 'success' })
        await wait(350)
        break
      }
      case 'wait':
        await wait(action.ms ?? 300)
        break
      default:
        break
    }
    await wait(110)
  }

  const executeActions = async (actions) => {
    const total = actions.length
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index]
      startActivity(action.label ?? 'Je m’en occupe…', index + 1, total)
      playSound('point')
      try {
        await runAction(action)
      } catch (error) {
        console.error('NEXUS Mind action:', error)
        startActivity('Je n’ai pas pu terminer cette action.', index + 1, total, 'error')
        await wait(400)
      }
    }
  }

  const submitText = async (rawText) => {
    const text = rawText.trim()
    if (!text || runningRef.current) return
    runningRef.current = true
    setRunning(true)
    setInput('')
    pushUserMessage(text)
    setTypingId(null)
    startActivity('Je réfléchis…', 0, 0, 'thinking')

    await wait(240)
    let result
    try {
      result = interpret(text, { data, prefs })
    } catch (error) {
      console.error('NEXUS Mind interpret:', error)
      result = {
        reply: 'Je n’ai pas réussi à comprendre cette demande. Essayez de la reformuler.',
        actions: [],
        notes: [],
        suggestions: defaultSuggestions(),
      }
    }

    const reply = result.reply || 'Je suis là.'
    pushAssistantMessage(reply, { notes: result.notes ?? [] })
    setSuggestions(result.suggestions?.length ? result.suggestions : defaultSuggestions())

    const actions = result.actions ?? []
    const hidesChat = actions.some((action) =>
      ['navigate', 'openNote', 'createNote', 'openGame', 'openTool', 'openWidget', 'openCustomize', 'openSearch'].includes(
        action.type,
      ),
    )
    if (hidesChat) onOpenChange(false)

    if (actions.length) {
      await executeActions(actions)
    }

    const mutedByAction = actions.some(
      (action) =>
        action.type === 'setPref' &&
        ((action.key === 'aiVoice' && action.value === false) ||
          (action.key === 'sound' && action.value === false)),
    )
    const shouldSpeak = prefs.aiVoice && prefs.sound && !mutedByAction && speechAvailable()
    if (shouldSpeak) speakAssistant(reply, { enabled: true })

    finishActivity(reply, actions.length ? 'done' : 'answer')
    if (result.closeAssistant) onOpenChange(false)
    runningRef.current = false
    if (mountedRef.current) setRunning(false)
  }

  const submit = (event) => {
    event.preventDefault()
    submitText(input)
  }

  const clearConversation = () => {
    stopSpeech()
    messageCounter = 0
    setMessages([
      {
        id: nextMessageId(),
        role: 'assistant',
        text: 'Conversation effacée. Je suis prête pour une nouvelle demande.',
        welcome: true,
      },
    ])
    setTypingId(null)
    setSuggestions(defaultSuggestions())
    setActivity(null)
    clearTimeout(hideTimer.current)
    playSound('click')
  }

  const toggleVoice = () => {
    if (voiceActive) {
      stopSpeech()
      setPref('aiVoice', false)
      playSound('click')
      return
    }
    setPref('aiVoice', true)
    setPref('sound', true)
    playSound('open')
    if (speechAvailable()) speakAssistant('Me voici. Le texte s’écrit toujours, même quand ma voix est coupée.')
  }

  const openNoteResult = async (note) => {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(true)
    onOpenChange(false)
    startActivity(`J’ouvre « ${note.title} »…`, 1, 1)
    try {
      await runAction({ type: 'openNote', id: note.id, title: note.title })
      finishActivity(`J’ai ouvert « ${note.title} ».`)
    } finally {
      runningRef.current = false
      setRunning(false)
    }
  }

  const PortalIcon = portal ? PAGE_ICONS[portal.page] ?? Sparkles : Sparkles

  return (
    <>
      {portal ? (
        <div className={`ai-portal ${portal.phase === 'out' ? 'is-leaving' : ''}`} aria-hidden="true">
          <div className="ai-portal-glass">
            <span className="ai-portal-icon">
              <PortalIcon size={26} />
            </span>
            <span className="eyebrow">NEXUS</span>
            <strong>{portal.title}</strong>
            <span className="ai-portal-subtitle">{portal.subtitle}</span>
            <span className="ai-portal-loader"><span /></span>
          </div>
        </div>
      ) : null}

      {activity ? (
        <div className={`ai-popup ${activity.tone}`} role="status" aria-live="polite">
          <span className="ai-popup-liquid" aria-hidden="true" />
          <div className="ai-popup-head">
            <span className="ai-popup-orb"><Sparkles size={14} /></span>
            <strong>NEXUS Mind</strong>
            {activity.total ? (
              <span className="ai-popup-step">{activity.step} / {activity.total}</span>
            ) : null}
          </div>
          <p className="ai-popup-message">
            <TypedText text={activity.message} animate key={activity.id} speed={12} />
          </p>
          {activity.total ? (
            <div className="ai-popup-progress">
              <span style={{ width: `${(activity.step / activity.total) * 100}%` }} />
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className={`ai-orb ${open ? 'is-hidden' : ''} ${running ? 'is-busy' : ''}`}
        onClick={() => onOpenChange(true)}
        aria-label="Ouvrir NEXUS Mind"
        title="NEXUS Mind — Ctrl+J"
      >
        <span className="ai-orb-glow" aria-hidden="true" />
        <Sparkles size={20} />
        <span className="ai-orb-label">NEXUS Mind</span>
      </button>

      {open ? (
        <aside className="ai-panel" role="dialog" aria-label="NEXUS Mind, assistant local">
          <header className="ai-panel-head">
            <div className="ai-identity">
              <span className="ai-avatar">
                <NexusMark size={30} />
                <span className="ai-avatar-dot" />
              </span>
              <div>
                <strong>NEXUS Mind</strong>
                <span>{running ? 'agit sur votre espace…' : 'assistant local · hors ligne'}</span>
              </div>
            </div>
            <div className="ai-head-buttons">
              <button
                type="button"
                className={`icon-btn ${voiceActive ? 'is-accent' : ''}`}
                onClick={toggleVoice}
                aria-label={voiceActive ? 'Couper la voix' : 'Activer la voix'}
                title={voiceActive ? 'Couper la voix' : 'Activer la voix'}
              >
                {voiceActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button type="button" className="icon-btn" onClick={clearConversation} aria-label="Effacer la conversation" title="Effacer" disabled={running}>
                <Trash2 size={15} />
              </button>
              <button type="button" className="icon-btn" onClick={closeChat} aria-label="Fermer NEXUS Mind">
                <X size={17} />
              </button>
            </div>
          </header>

          <div className="ai-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`ai-message ai-message-${message.role}`}>
                {message.role === 'assistant' ? (
                  <span className="ai-message-avatar"><Sparkles size={13} /></span>
                ) : null}
                <div className="ai-bubble">
                  <TypedText
                    text={message.text}
                    animate={message.role === 'assistant' && typingId === message.id}
                    speed={10}
                  />
                  {message.notes?.length ? (
                    <div className="ai-note-results">
                      {message.notes.map((note) => (
                        <button
                          type="button"
                          key={note.id}
                          className="ai-note-result"
                          onClick={() => openNoteResult(note)}
                        >
                          <span className="ai-note-icon"><NotebookPen size={14} /></span>
                          <span className="ai-note-copy">
                            <strong>{note.title}</strong>
                            <small>{note.category} · {timeAgo(note.updatedAt)}</small>
                            <em>{note.snippet}</em>
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {running ? (
              <div className="ai-message ai-message-assistant ai-thinking">
                <span className="ai-message-avatar"><Sparkles size={13} /></span>
                <div className="ai-bubble">
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                </div>
              </div>
            ) : null}
          </div>

          {suggestions?.length && !running ? (
            <div className="ai-suggestions">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => submitText(suggestion)}
                  disabled={running}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form className="ai-composer" onSubmit={submit}>
            <MessageCircle size={15} className="ai-composer-icon" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Demandez-moi quelque chose…"
              aria-label="Message pour NEXUS Mind"
              autoComplete="off"
              disabled={running}
            />
            <button type="submit" className="ai-send" aria-label="Envoyer" disabled={running || !input.trim()}>
              <Send size={15} />
            </button>
          </form>
          <footer className="ai-foot">
            <span><Sparkles size={11} /> Actions réelles · données locales</span>
            <span>{voiceActive ? 'voix active' : 'mode texte'} · Ctrl J</span>
          </footer>
        </aside>
      ) : null}
    </>
  )
}
