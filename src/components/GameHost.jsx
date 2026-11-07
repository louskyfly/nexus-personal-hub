import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { gameById } from '../lib/catalog'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useToast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { ErrorBoundary, LoadingFrame } from '../components/ui'
import { cn } from '../lib/utils'

export function GameHost({ gameId, open, onClose }) {
  const game = gameById(gameId)
  const { recordGame } = useData()
  const { prefs, toggleFavorite } = usePrefs()
  const { toast } = useToast()
  const [Component, setComponent] = useState(null)

  useEffect(() => {
    let cancelled = false
    setComponent(null)
    if (!game) return undefined
    game
      .load()
      .then((module) => {
        if (!cancelled) setComponent(() => module.default)
      })
      .catch((error) => {
        console.error(error)
        if (!cancelled) {
          toast({
            title: 'Jeu indisponible',
            description: 'Le module n’a pas pu être chargé.',
            tone: 'error',
          })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId])

  const finish = useCallback(
    (payload) => {
      if (!game) return
      const xp = recordGame(game.id, payload)
      const win = payload.outcome === 'win'
      const loss = payload.outcome === 'loss'
      toast({
        title: game.id === 'blackbox'
          ? payload.detail?.mission === 5 ? 'Campagne terminée' : 'Mission terminée'
          : win ? 'Victoire !' : loss ? 'Partie terminée' : 'Session enregistrée',
        description: `${game.title} · +${xp} XP`,
        tone: game.id === 'blackbox' || win ? 'achievement' : 'info',
        duration: 4200,
      })
    },
    [game, recordGame, toast],
  )

  if (!game) return null
  const favorite = prefs.favorites.includes(game.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="Nexus Arcade"
      title={game.title}
      subtitle={game.controls}
      size="xl"
      className={cn('game-modal', `game-modal-${game.id}`)}
      headerActions={
        <button
          type="button"
          className={`icon-btn game-fav-head ${favorite ? 'is-active' : ''}`}
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(game.id)}
        >
          <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      }
    >
      <div className="game-host">
        {Component ? (
          <ErrorBoundary key={gameId}>
            <Component onFinish={finish} />
          </ErrorBoundary>
        ) : (
          <LoadingFrame label={`Chargement de ${game.title}…`} tall />
        )}
      </div>
    </Modal>
  )
}
