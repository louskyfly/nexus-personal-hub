import { useEffect, useRef, useState } from 'react'
import { Bot, RotateCcw, Trophy, Users } from 'lucide-react'
import { useData } from '../state/DataContext'
import { Segmented } from '../components/ui'
import { playSound } from '../lib/sound'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

const EMPTY = Array(9).fill(null)

function outcomeOf(board) {
  for (const line of LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line }
    }
  }
  if (board.every(Boolean)) return { draw: true }
  return null
}

function minimax(board, maximizing, depth = 0) {
  const result = outcomeOf(board)
  if (result?.winner === 'O') return { score: 10 - depth }
  if (result?.winner === 'X') return { score: depth - 10 }
  if (result?.draw) return { score: 0 }

  let best = maximizing ? { score: -Infinity } : { score: Infinity }
  for (let index = 0; index < 9; index += 1) {
    if (board[index]) continue
    const next = [...board]
    next[index] = maximizing ? 'O' : 'X'
    const { score } = minimax(next, !maximizing, depth + 1)
    if (maximizing ? score > best.score : score < best.score) {
      best = { score, index }
    }
  }
  return best
}

export default function TicTacToe({ onFinish }) {
  const { data } = useData()
  const [mode, setMode] = useState('ai')
  const [aiLevel, setAiLevel] = useState('expert')
  const [board, setBoard] = useState(EMPTY)
  const [turn, setTurn] = useState('X')
  const [result, setResult] = useState(null)
  const [series, setSeries] = useState({ X: 0, O: 0, draws: 0 })
  const recordedRef = useRef(false)
  const onFinishRef = useRef(onFinish)
  const aiTimer = useRef(null)
  onFinishRef.current = onFinish

  const record = (finalResult) => {
    if (mode !== 'ai' || recordedRef.current) return
    recordedRef.current = true
    const outcome = finalResult?.winner === 'X' ? 'win' : finalResult?.winner === 'O' ? 'loss' : 'draw'
    onFinishRef.current?.({
      score: outcome === 'win' ? 1 : 0,
      outcome,
      label: outcome === 'win' ? 'Victoire contre l’IA' : outcome === 'loss' ? 'Défaite contre l’IA' : 'Match nul contre l’IA',
    })
  }

  const settle = (nextBoard, mark) => {
    const outcome = outcomeOf(nextBoard)
    if (outcome) {
      setResult(outcome)
      setSeries((prev) => ({
        X: prev.X + (outcome.winner === 'X' ? 1 : 0),
        O: prev.O + (outcome.winner === 'O' ? 1 : 0),
        draws: prev.draws + (outcome.draw ? 1 : 0),
      }))
      record(outcome)
      playSound(outcome.draw ? 'click' : 'success')
      return
    }
    setTurn(mark === 'X' ? 'O' : 'X')
  }

  const play = (index) => {
    if (board[index] || result) return
    if (mode === 'ai' && turn === 'O') return
    const next = [...board]
    next[index] = turn
    setBoard(next)
    playSound('click')
    settle(next, turn)
  }

  useEffect(() => {
    if (mode !== 'ai' || turn !== 'O' || result) return undefined
    aiTimer.current = setTimeout(() => {
      const available = board.map((cell, index) => (cell ? null : index)).filter((index) => index !== null)
      if (!available.length) return
      let choice
      if (aiLevel === 'friendly' && Math.random() < 0.42) {
        choice = available[Math.floor(Math.random() * available.length)]
      } else {
        choice = minimax(board, true).index
      }
      if (choice == null) choice = available[0]
      const next = [...board]
      next[choice] = 'O'
      setBoard(next)
      playSound('click')
      settle(next, 'O')
    }, 420)
    return () => clearTimeout(aiTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode, board, result, aiLevel])

  const resetRound = () => {
    clearTimeout(aiTimer.current)
    setBoard(EMPTY)
    setTurn('X')
    setResult(null)
    recordedRef.current = false
    playSound('open')
  }

  const changeMode = (value) => {
    setMode(value)
    resetRound()
    setSeries({ X: 0, O: 0, draws: 0 })
  }

  const statusText = result
    ? result.draw
      ? 'Match nul — parfaitement défendu.'
      : result.winner === 'X'
        ? mode === 'ai' ? 'Vous remportez la manche !' : 'Les X remportent la manche !'
        : mode === 'ai' ? 'L’IA remporte la manche.' : 'Les O remportent la manche !'
    : mode === 'ai'
      ? turn === 'X' ? 'À vous de jouer (X).' : 'L’IA réfléchit…'
      : `Au tour des ${turn}.`

  return (
    <div className="game tictactoe-game">
      <div className="ttt-config">
        <Segmented
          size="sm"
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'ai', label: 'Contre l’IA', icon: Bot },
            { value: 'duo', label: '2 joueurs', icon: Users },
          ]}
          ariaLabel="Mode de jeu"
        />
        {mode === 'ai' ? (
          <Segmented
            size="sm"
            value={aiLevel}
            onChange={setAiLevel}
            options={[
              { value: 'friendly', label: 'Amicale' },
              { value: 'expert', label: 'Experte' },
            ]}
            ariaLabel="Niveau de l’IA"
          />
        ) : null}
      </div>

      <div className="ttt-scoreline">
        <div className={turn === 'X' && !result ? 'is-active' : ''}>
          <span className="ttt-mark x">X</span>
          <strong>{mode === 'ai' ? 'Vous' : 'Joueur 1'}</strong>
          <small>{series.X} victoire(s)</small>
        </div>
        <div className="ttt-draws">
          <small>{series.draws} nul(s)</small>
          <span className="ttt-record"><Trophy size={12} /> {data.stats.bests.tictactoe?.wins ?? 0} V au total</span>
        </div>
        <div className={turn === 'O' && !result ? 'is-active' : ''}>
          <span className="ttt-mark o">O</span>
          <strong>{mode === 'ai' ? 'IA' : 'Joueur 2'}</strong>
          <small>{series.O} victoire(s)</small>
        </div>
      </div>

      <p className={`ttt-status ${result ? 'is-final' : ''}`} aria-live="polite">{statusText}</p>

      <div className="ttt-board" role="grid" aria-label="Plateau de morpion">
        {board.map((cell, index) => {
          const winning = result?.line?.includes(index)
          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              className={`ttt-cell ${cell ? `has-${cell.toLowerCase()}` : ''} ${winning ? 'is-winning' : ''}`}
              onClick={() => play(index)}
              disabled={Boolean(cell) || Boolean(result) || (mode === 'ai' && turn === 'O')}
              aria-label={cell ? `Case ${index + 1} : ${cell}` : `Case ${index + 1}, vide`}
            >
              {cell === 'X' ? <span className="ttt-x">×</span> : null}
              {cell === 'O' ? <span className="ttt-o">○</span> : null}
            </button>
          )
        })}
      </div>

      <div className="ttt-actions">
        <button type="button" className="btn btn-primary" onClick={resetRound}>
          <RotateCcw size={15} /> {result ? 'Nouvelle manche' : 'Recommencer la manche'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            resetRound()
            setSeries({ X: 0, O: 0, draws: 0 })
          }}
        >
          Réinitialiser la série
        </button>
      </div>
      <p className="game-hint">
        {mode === 'ai'
          ? 'Les manches contre l’IA comptent pour votre progression. L’IA experte ne commet aucune erreur.'
          : 'Mode deux joueurs : à tour de rôle sur le même écran. Les manches amicales ne comptent pas pour la progression.'}
      </p>
    </div>
  )
}
