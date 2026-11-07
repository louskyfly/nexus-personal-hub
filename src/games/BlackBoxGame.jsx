import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react'
import { useData } from '../state/DataContext'
import { playSound } from '../lib/sound'
import { pad2 } from '../lib/utils'
import {
  BLACKBOX_FINALE,
  BLACKBOX_INTRO,
  BLACKBOX_MISSIONS,
  BLACKBOX_TOTAL,
  getMission,
  nextMissionId,
} from './blackboxData'

let bbLineId = 0

const line = (type, text) => ({ id: ++bbLineId, type, text })

const LOGO = '> BLACK BOX // ARCHIVE 09'

const HELP_TEXT = `COMMANDES DISPONIBLES
help                      aide
ls [-a]                   fichiers
cat <fichier>             lire
scan                      réseau
connect <nœud>            session
disconnect                racine
decrypt base64 <txt>      Base64
decrypt caesar <n> <txt>  César
decrypt hex <hex>         hexa
unlock <code>             valider
hint                      indice
missions                  campagne
start <n>                 mission
next                      suivante
status                    session
clear                     écran
reset                     réinitialiser`

function formatElapsed(seconds) {
  const safe = Math.max(0, seconds)
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`
}

function missionIntro(mission) {
  return [
    line('system', `MISSION ${pad2(mission.id)} / ${pad2(BLACKBOX_TOTAL)} — ${mission.title.toUpperCase()}`),
    ...mission.briefing.map((text) => line('story', text)),
    line('goal', `OBJECTIF // ${mission.objective}`),
    line('dim', 'Tapez `help` pour les commandes, `ls` pour explorer, `hint` si vous êtes bloqué.'),
    line('dim', '─'.repeat(34)),
  ]
}

function buildBoot(completed) {
  const allDone = BLACKBOX_MISSIONS.every((mission) => completed.includes(mission.id))
  const next = BLACKBOX_MISSIONS.find((mission) => !completed.includes(mission.id)) ?? BLACKBOX_MISSIONS[BLACKBOX_TOTAL - 1]
  const lines = [
    line('ascii', LOGO),
    ...BLACKBOX_INTRO.map((text, index) => line(index === 0 ? 'system' : 'story', text)),
    line('dim', '─'.repeat(34)),
  ]
  if (allDone) {
    lines.push(line('ok', `CAMPAGNE TERMINÉE — ${BLACKBOX_TOTAL} / ${BLACKBOX_TOTAL} missions.`))
    lines.push(line('story', 'MIRA : « Tu peux revenir quand tu veux. La chambre noire se souviendra de toi. »'))
    lines.push(line('dim', 'Tapez `missions` pour revoir la campagne, ou `start 1` pour rejouer.'))
  } else {
    lines.push(...missionIntro(next))
  }
  return lines
}

function decodeBase64(value) {
  const clean = value.replace(/\s+/g, '')
  if (!clean) throw new Error('Chaîne vide')
  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function caesarShift(value, shift) {
  const amount = ((Number(shift) % 26) + 26) % 26
  if (!Number.isFinite(amount)) throw new Error('Décalage invalide')
  return value.replace(/[a-z]/gi, (character) => {
    const base = character <= 'Z' ? 65 : 97
    return String.fromCharCode(((character.charCodeAt(0) - base - amount + 26) % 26) + base)
  })
}

function decodeHex(value) {
  const clean = value.replace(/\s+/g, '')
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2 !== 0) throw new Error('Hexadécimal invalide')
  let result = ''
  for (let index = 0; index < clean.length; index += 2) {
    result += String.fromCharCode(parseInt(clean.slice(index, index + 2), 16))
  }
  return result
}

function normalizeCode(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export default function BlackBoxGame({ onFinish }) {
  const { data, setTerminalProgress } = useData()
  const saved = data.terminal ?? { completed: [], current: 1 }
  const savedCompleted = Array.isArray(saved.completed) ? saved.completed : []
  const [completed, setCompleted] = useState(savedCompleted)
  const initialMission =
    BLACKBOX_MISSIONS.find((mission) => !savedCompleted.includes(mission.id)) ??
    BLACKBOX_MISSIONS[BLACKBOX_TOTAL - 1]
  const [mission, setMission] = useState(initialMission)
  const [nodeKey, setNodeKey] = useState('root')
  const [output, setOutput] = useState(() => buildBoot(savedCompleted))
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState([])
  const [historyPosition, setHistoryPosition] = useState(-1)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintIndex, setHintIndex] = useState(0)
  const [solved, setSolved] = useState(false)
  const [nextReady, setNextReady] = useState(false)
  const [resetArmed, setResetArmed] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const screenRef = useRef(null)
  const inputRef = useRef(null)

  const currentNode = mission.nodes[nodeKey] ?? mission.nodes.root
  const prompt = `invite@${currentNode.label}:~$`
  const campaignComplete = completed.length >= BLACKBOX_TOTAL

  const append = (entries) => {
    setOutput((previous) => [...previous, ...entries].slice(-260))
  }

  const say = (text, type = 'out') => append([line(type, text)])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!solved) setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [startedAt, solved])

  useEffect(() => {
    const screen = screenRef.current
    if (screen) screen.scrollTop = screen.scrollHeight
  }, [output])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const startMission = (id) => {
    const next = getMission(id)
    setMission(next)
    setNodeKey('root')
    setSolved(false)
    setNextReady(false)
    setHintIndex(0)
    setHintsUsed(0)
    setStartedAt(Date.now())
    setElapsed(0)
    setResetArmed(false)
    append([line('dim', '─'.repeat(34)), ...missionIntro(next)])
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const findFile = (name) => {
    const files = currentNode.files ?? {}
    if (files[name] != null) return name
    return Object.keys(files).find((file) => file.toLowerCase() === name.toLowerCase()) ?? null
  }

  const completeMission = (isNew) => {
    const nextCompleted = [...new Set([...completed, mission.id])].sort((a, b) => a - b)
    const nextIncomplete =
      BLACKBOX_MISSIONS.find((item) => !nextCompleted.includes(item.id))?.id ?? BLACKBOX_TOTAL
    setCompleted(nextCompleted)
    setSolved(true)
    setNextReady(mission.id < BLACKBOX_TOTAL)
    setTerminalProgress({ completed: nextCompleted, current: nextIncomplete })
    append([
      ...mission.success.map((text) => line('ok', text)),
      line('dim', isNew ? 'Progression sauvegardée.' : 'Mission déjà validée — aucun nouvel XP.'),
      ...(mission.id < BLACKBOX_TOTAL
        ? [line('story', 'MIRA : « La suite t’attend. Tapez `next`. »')]
        : [
            line('ok', `CAMPAGNE TERMINÉE — ${BLACKBOX_TOTAL} / ${BLACKBOX_TOTAL} missions.`),
            ...BLACKBOX_FINALE.map((text) => line('system', text)),
          ]),
    ])
    playSound(mission.id < BLACKBOX_TOTAL ? 'success' : 'win')
    if (isNew) {
      onFinish?.({
        score: mission.id,
        outcome: 'win',
        detail: {
          mission: mission.id,
          missionsCompleted: nextCompleted.length,
          seconds: elapsed,
          hintsUsed,
        },
        label: `Mission ${mission.id} · ${mission.title} · ${formatElapsed(elapsed)}`,
      })
    }
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const resetCampaign = () => {
    setCompleted([])
    setMission(getMission(1))
    setNodeKey('root')
    setSolved(false)
    setNextReady(false)
    setHintIndex(0)
    setHintsUsed(0)
    setResetArmed(false)
    setStartedAt(Date.now())
    setElapsed(0)
    setOutput(buildBoot([]))
    setTerminalProgress({ completed: [], current: 1 })
    playSound('open')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const runCommand = (raw) => {
    const command = raw.trim()
    if (!command) return
    setCommandHistory((previous) => [command, ...previous].slice(0, 40))
    setHistoryPosition(-1)
    append([line('cmd', `${prompt} ${command}`)])
    setInput('')
    setResetArmed(false)

    if (command.toLowerCase() === 'reset confirm' && resetArmed) {
      resetCampaign()
      return
    }

    const tokens = command.split(/\s+/)
    const name = tokens[0].toLowerCase()
    const args = tokens.slice(1)

    switch (name) {
      case 'help':
        say(HELP_TEXT, 'pre')
        break

      case 'ls': {
        const showHidden = args.includes('-a')
        const files = Object.keys(currentNode.files ?? {})
          .filter((file) => showHidden || !file.startsWith('.'))
          .sort((a, b) => a.localeCompare(b))
        if (!files.length) {
          say('Aucun fichier visible. Essayez `ls -a`.', 'dim')
        } else {
          say(files.join('    '), 'out')
        }
        break
      }

      case 'cat': {
        if (!args[0]) {
          say('Usage : cat <fichier>', 'error')
          break
        }
        const file = findFile(args[0])
        if (!file) {
          say(`Fichier introuvable sur ce nœud : ${args[0]}`, 'error')
          break
        }
        say(currentNode.files[file], 'pre')
        break
      }

      case 'scan': {
        const nodes = Object.entries(mission.nodes).filter(([key]) => key !== 'root')
        if (!nodes.length) {
          say('Un seul hôte : blackbox (localhost). Aucun réseau externe détecté.', 'dim')
          break
        }
        append([
          line('system', `${nodes.length} hôte(s) en ligne :`),
          ...nodes.map(([key, node]) =>
            line('out', `  ${key.padEnd(12)} ${node.label.padEnd(10)} en ligne`),
          ),
          line('dim', 'Utilisez `connect <nœud>` pour ouvrir une session.'),
        ])
        break
      }

      case 'connect': {
        if (!args[0]) {
          say('Usage : connect <nœud>', 'error')
          break
        }
        const target = Object.keys(mission.nodes).find(
          (key) => key.toLowerCase() === args[0].toLowerCase(),
        )
        const byLabel = Object.entries(mission.nodes).find(
          ([key, node]) => key !== 'root' && node.label.toLowerCase() === args[0].toLowerCase(),
        )
        const resolved = target ?? byLabel?.[0]
        if (!resolved) {
          say(`Hôte inaccessible : ${args[0]}`, 'error')
          break
        }
        setNodeKey(resolved)
        if (resolved === 'root') {
          say('Session locale. Retour à blackbox.', 'system')
        } else {
          say(`Session ouverte sur ${mission.nodes[resolved].label} (${resolved}).`, 'ok')
        }
        break
      }

      case 'disconnect':
        setNodeKey('root')
        say('Déconnecté. Retour à blackbox.', 'system')
        break

      case 'decrypt': {
        const mode = (args[0] ?? '').toLowerCase()
        try {
          if (mode === 'base64' || mode === 'b64') {
            const value = args.slice(1).join('')
            if (!value) throw new Error('Texte manquant')
            say(`Résultat : ${decodeBase64(value)}`, 'ok')
          } else if (mode === 'caesar' || mode === 'cesar') {
            const shift = args[1]
            const value = args.slice(2).join(' ')
            if (!value) throw new Error('Texte manquant')
            say(`Résultat : ${caesarShift(value, shift)}`, 'ok')
          } else if (mode === 'hex') {
            const value = args.slice(1).join('')
            if (!value) throw new Error('Texte manquant')
            say(`Résultat : ${decodeHex(value)}`, 'ok')
          } else {
            say('Modes disponibles : base64, caesar <n>, hex.', 'dim')
          }
        } catch (error) {
          say(`Décodage impossible : ${error.message}`, 'error')
        }
        break
      }

      case 'unlock': {
        const submitted = normalizeCode(args.join(' '))
        if (!submitted) {
          say('Usage : unlock <code>', 'error')
          break
        }
        if (solved) {
          say('Cette mission est déjà validée. Tapez `next` ou `missions`.', 'dim')
          break
        }
        if (submitted !== mission.solution) {
          say('Code refusé. Le terminal reste verrouillé.', 'error')
          playSound('error')
          break
        }
        completeMission(!completed.includes(mission.id))
        break
      }

      case 'hint': {
        if (hintIndex >= mission.hints.length) {
          say('Plus d’indices disponibles pour cette mission. Le terminal croit en toi.', 'dim')
          break
        }
        say(`INDICE ${hintIndex + 1} / ${mission.hints.length} // ${mission.hints[hintIndex]}`, 'hint')
        setHintIndex((value) => value + 1)
        setHintsUsed((value) => value + 1)
        break
      }

      case 'missions': {
        append([
          line('system', 'ÉTAT DE LA CAMPAGNE'),
          ...BLACKBOX_MISSIONS.map((item) => {
            const isDone = completed.includes(item.id)
            const isCurrent = item.id === mission.id
            const marker = isDone ? '[✓]' : isCurrent ? '[>]' : '[ ]'
            return line(
              isDone ? 'ok' : isCurrent ? 'goal' : 'dim',
              `${marker} ${pad2(item.id)} — ${item.title}`,
            )
          }),
          line('dim', 'Tapez `next` après une mission, ou `start <n>` pour rejouer.'),
        ])
        break
      }

      case 'start': {
        const target = Number(args[0])
        const highestUnlocked = Math.max(
          1,
          mission.id,
          ...completed,
        )
        if (!Number.isInteger(target) || target < 1 || target > BLACKBOX_TOTAL) {
          say(`Mission inconnue. Choisissez un nombre entre 1 et ${BLACKBOX_TOTAL}.`, 'error')
          break
        }
        if (target > highestUnlocked) {
          say(`Mission ${target} verrouillée. Terminez d’abord les précédentes.`, 'error')
          break
        }
        startMission(target)
        break
      }

      case 'next': {
        if (!nextReady) {
          say('Aucune mission suivante disponible. Terminez la mission en cours.', 'dim')
          break
        }
        const nextId = nextMissionId(mission.id)
        if (!nextId) {
          say('La campagne est terminée.', 'ok')
          break
        }
        startMission(nextId)
        break
      }

      case 'status':
        append([
          line('system', `SESSION // ${mission.title}`),
          line('out', `Objectif : ${mission.objective}`),
          line('out', `Nœud : ${currentNode.label} (${currentNode.address ?? nodeKey})`),
          line('out', `Campagne : ${completed.length}/${BLACKBOX_TOTAL} missions validées`),
          line('out', `Indices utilisés : ${hintsUsed} · Durée : ${formatElapsed(elapsed)}`),
        ])
        break

      case 'clear':
        setOutput([])
        break

      case 'reset':
        setResetArmed(true)
        append([
          line('error', 'ATTENTION : cette commande efface la progression de la campagne.'),
          line('dim', 'Tapez `reset confirm` pour confirmer, ou ignorez pour annuler.'),
        ])
        break

      case 'whoami':
        say('invité — session locale — privilèges : lecture seule.', 'out')
        break

      case 'exit':
        say('Fermez la fenêtre pour quitter la session.', 'dim')
        break

      default:
        say(`Commande inconnue : ${name}. Tapez \`help\` pour la liste.`, 'error')
    }
  }

  const submit = (event) => {
    event.preventDefault()
    if (input.trim()) runCommand(input)
  }

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const nextPosition = Math.min(commandHistory.length - 1, historyPosition + 1)
      if (nextPosition >= 0 && commandHistory[nextPosition]) {
        setHistoryPosition(nextPosition)
        setInput(commandHistory[nextPosition])
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const nextPosition = historyPosition - 1
      setHistoryPosition(nextPosition)
      setInput(nextPosition >= 0 ? commandHistory[nextPosition] ?? '' : '')
    }
  }

  const quickCommands = ['help', 'ls', 'scan', 'hint', 'status', 'missions']

  return (
    <div className="blackbox">
      <div className="bb-head">
        <div className="bb-session">
          <span className="bb-live" />
          <span>BLACK BOX</span>
          <span className="bb-separator">/</span>
          <span className="bb-mission-tag">MISSION {pad2(mission.id)} / {pad2(BLACKBOX_TOTAL)}</span>
        </div>
        <div className="bb-head-meta">
          <span>{completed.length} / {BLACKBOX_TOTAL} validées</span>
          <span className="bb-clock">{formatElapsed(elapsed)}</span>
          <button
            type="button"
            className="icon-btn bb-reset"
            onClick={() => runCommand(resetArmed ? 'reset confirm' : 'reset')}
            aria-label="Réinitialiser la campagne"
            title="Réinitialiser la campagne"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className="bb-mission-title">
        <div>
          <span className="eyebrow">Archive 09 · Solo</span>
          <h3>{mission.title}</h3>
        </div>
        <span className={`bb-objective-pill ${campaignComplete ? 'is-complete' : ''}`}>
          {campaignComplete ? 'Campagne terminée' : mission.objective}
        </span>
      </div>

      <div
        className="bb-screen"
        ref={screenRef}
        onClick={(event) => {
          if (!event.target.closest('button, input')) inputRef.current?.focus()
        }}
        role="log"
        aria-live="polite"
        aria-label="Sortie du terminal BLACK BOX"
      >
        <div className="bb-scanlines" aria-hidden="true" />
        {output.map((entry) => (
          <div className={`bb-line bb-${entry.type}`} key={entry.id}>
            {entry.text}
          </div>
        ))}
        <div className="bb-end" />
      </div>

      <form className="bb-form" onSubmit={submit}>
        <span className="bb-prompt-label">{prompt}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="tapez une commande…"
          aria-label="Commande du terminal BLACK BOX"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="bb-send" aria-label="Exécuter la commande">
          <CornerDownLeft size={16} />
        </button>
      </form>

      <div className="bb-quick">
        {quickCommands.map((command) => (
          <button
            key={command}
            type="button"
            onClick={() => runCommand(command)}
          >
            {command}
          </button>
        ))}
        {nextReady ? (
          <button
            type="button"
            className="bb-next"
            onClick={() => runCommand('next')}
          >
            Mission suivante <ArrowRight size={14} />
          </button>
        ) : null}
      </div>

      <p className="bb-help">
        ↑ / ↓ pour l’historique · `help` pour les commandes · `reset` pour recommencer la campagne
      </p>
    </div>
  )
}
