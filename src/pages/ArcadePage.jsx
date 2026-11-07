import { useState } from 'react'
import {
  ArrowRight,
  Gamepad2,
  Lock,
  Star,
  Trophy,
  Zap,
  Flame,
  Medal,
  Flag,
  Bomb,
  Table2,
  Hash,
  Layers,
  LayoutGrid,
  Spline,
  Worm,
  Compass,
  NotebookPen,
  CircleCheck,
  TrendingUp,
  Sparkles,
  History,
  Terminal,
  DoorOpen,
} from 'lucide-react'
import { GAMES } from '../lib/catalog'
import { ACHIEVEMENTS, levelInfo } from '../lib/gameStats'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useNavigation } from '../state/NavigationContext'
import { useToast } from '../components/Toast'
import { PageHeader, Segmented, EmptyState } from '../components/ui'
import { formatSeconds, timeAgo } from '../lib/utils'
import { playSound } from '../lib/sound'

const ACHIEVEMENT_ICONS = {
  Gamepad2, Spline, Worm, LayoutGrid, Trophy, Flag, Bomb, Table2, Medal, Hash,
  Layers, Zap, Flame, Star, Compass, NotebookPen, CircleCheck, TrendingUp,
  Terminal, DoorOpen,
}

function bestLabel(gameId, stats) {
  const bests = stats.bests
  switch (gameId) {
    case 'snake':
      return bests.snake ? `${bests.snake} pts` : '—'
    case '2048':
      return bests['2048'] ? `${bests['2048']} pts` : '—'
    case 'minesweeper': {
      const times = Object.values(bests.minesweeper ?? {}).filter((value) => value != null)
      return times.length ? `${Math.min(...times)} s` : '—'
    }
    case 'pong':
      return bests.pong?.wins ? `${bests.pong.wins} V` : '—'
    case 'tictactoe':
      return bests.tictactoe?.wins ? `${bests.tictactoe.wins} V` : '—'
    case 'memory':
      return bests.memory ? `${bests.memory.attempts} essais` : '—'
    case 'reaction':
      return bests.reaction != null ? `${bests.reaction} ms` : '—'
    case 'blackbox':
      return bests.blackbox ? `${bests.blackbox} / 5 missions` : '—'
    default:
      return '—'
  }
}

export default function ArcadePage() {
  const { data } = useData()
  const { prefs, toggleFavorite } = usePrefs()
  const { openGame } = useNavigation()
  const { toast } = useToast()
  const [filter, setFilter] = useState('all')
  const info = levelInfo(data.stats.xp)
  const unlocked = Object.keys(data.stats.achievements ?? {}).length
  const games = filter === 'favorites' ? GAMES.filter((game) => prefs.favorites.includes(game.id)) : GAMES

  const launch = (game) => {
    playSound('open')
    openGame(game.id)
  }

  const bests = data.stats.bests

  return (
    <div className="page arcade-page">
      <PageHeader
        eyebrow="Mini Arcade"
        title="Sept jeux et un terminal."
        description="Des classiques revisités, un récit à décrypter, des records personnels et une progression qui vous suit. Tout fonctionne hors ligne."
        actions={
          <div className="arcade-rank glass">
            <div className="rank-ring" style={{ '--progress': `${Math.round(info.progress * 100)}%` }}>
              <span>{info.level}</span>
            </div>
            <div>
              <strong>Niveau {info.level} · {info.title}</strong>
              <span className="hint">{info.inLevel} / {info.needed} XP</span>
            </div>
          </div>
        }
      />

      <section className="arcade-overview">
        <div className="overview-tile glass">
          <span className="overview-icon"><Gamepad2 size={17} /></span>
          <div>
            <strong>{data.stats.gamesPlayed}</strong>
            <span>parties jouées</span>
          </div>
        </div>
        <div className="overview-tile glass">
          <span className="overview-icon"><Trophy size={17} /></span>
          <div>
            <strong>{unlocked} / {ACHIEVEMENTS.length}</strong>
            <span>succès débloqués</span>
          </div>
        </div>
        <div className="overview-tile glass">
          <span className="overview-icon"><Star size={17} /></span>
          <div>
            <strong>{prefs.favorites.length}</strong>
            <span>jeux favoris</span>
          </div>
        </div>
        <div className="overview-tile glass">
          <span className="overview-icon"><Zap size={17} /></span>
          <div>
            <strong>{data.stats.xp}</strong>
            <span>XP au total</span>
          </div>
        </div>
      </section>

      <div className="page-subhead arcade-subhead">
        <div>
          <h2>Salle de jeux</h2>
          <p>Choisissez votre terrain de jeu. Cliquez sur une carte pour lancer la partie.</p>
        </div>
        <Segmented
          size="sm"
          value={filter}
          onChange={(value) => {
            setFilter(value)
            playSound('click')
          }}
          options={[
            { value: 'all', label: 'Tous les jeux' },
            { value: 'favorites', label: 'Favoris', icon: Star },
          ]}
          ariaLabel="Filtrer les jeux"
        />
      </div>

      {games.length ? (
        <div className="game-grid">
          {games.map((game) => {
            const Icon = game.icon
            const favorite = prefs.favorites.includes(game.id)
            const played = data.stats.playCounts?.[game.id] ?? 0
            return (
              <article className="game-card glass" key={game.id}>
                <button
                  type="button"
                  className="game-art"
                  style={{ '--hue': game.hue }}
                  onClick={() => launch(game)}
                  aria-label={`Jouer à ${game.title}`}
                >
                  <span className="game-art-glow" aria-hidden="true" />
                  <span className="game-art-lines" aria-hidden="true" />
                  <Icon size={58} strokeWidth={1.3} className="game-art-icon" />
                  <span className="game-art-tag">{game.tagline}</span>
                </button>
                <button
                  type="button"
                  className={`game-fav ${favorite ? 'is-active' : ''}`}
                  aria-label={favorite ? `Retirer ${game.title} des favoris` : `Ajouter ${game.title} aux favoris`}
                  aria-pressed={favorite}
                  onClick={() => {
                    toggleFavorite(game.id)
                    playSound('click')
                    toast({
                      title: favorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
                      description: game.title,
                      duration: 2000,
                    })
                  }}
                >
                  <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
                </button>
                <div className="game-card-body">
                  <div className="game-card-title">
                    <div>
                      <h3>{game.title}</h3>
                      <span className="game-tags">{game.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
                    </div>
                    <span className="game-best" title="Votre meilleur résultat">
                      <Trophy size={12} /> {bestLabel(game.id, data.stats)}
                    </span>
                  </div>
                  <p className="game-desc">{game.description}</p>
                  <div className="game-card-foot">
                    <span className="game-playcount">{played ? `${played} partie${played > 1 ? 's' : ''}` : 'Jamais joué'}</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => launch(game)}>
                      Jouer <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="glass board-empty">
          <EmptyState
            icon={Star}
            title="Aucun jeu favori"
            description="Ajoutez des jeux avec l’étoile pour créer votre sélection personnelle."
            action={<button type="button" className="btn btn-primary" onClick={() => setFilter('all')}>Voir tous les jeux</button>}
          />
        </div>
      )}

      <div className="arcade-columns">
        <section className="arcade-section glass">
          <div className="arcade-section-head">
            <div>
              <h2><Trophy size={16} /> Meilleurs scores personnels</h2>
              <p>Seuls vos résultats réels apparaissent ici.</p>
            </div>
          </div>
          <ul className="best-list">
            <li>
              <span><Worm size={14} /> Snake</span>
              <strong>{bests.snake ? `${bests.snake} points` : 'Aucun score'}</strong>
            </li>
            <li>
              <span><LayoutGrid size={14} /> 2048</span>
              <strong>{bests['2048'] ? `${bests['2048']} points · tuile ${bests['2048Tile'] ?? '—'}` : 'Aucun score'}</strong>
            </li>
            <li>
              <span><Bomb size={14} /> Démineur</span>
              <div className="best-chips">
                {['beginner', 'intermediate', 'expert'].map((difficulty) => (
                  <span key={difficulty} className="mini-chip">
                    {difficulty === 'beginner' ? 'Déb.' : difficulty === 'intermediate' ? 'Interm.' : 'Expert'}
                    {' '}
                    {bests.minesweeper?.[difficulty] ? `${bests.minesweeper[difficulty]} s` : '—'}
                  </span>
                ))}
              </div>
            </li>
            <li>
              <span><Table2 size={14} /> Pong</span>
              <strong>{bests.pong?.wins ?? 0} V · {bests.pong?.losses ?? 0} D</strong>
            </li>
            <li>
              <span><Hash size={14} /> Morpion</span>
              <strong>{bests.tictactoe?.wins ?? 0} victoire{(bests.tictactoe?.wins ?? 0) === 1 ? '' : 's'} · {bests.tictactoe?.draws ?? 0} nul{(bests.tictactoe?.draws ?? 0) === 1 ? '' : 's'}</strong>
            </li>
            <li>
              <span><Layers size={14} /> Memory</span>
              <strong>{bests.memory ? `${bests.memory.attempts} essais · ${formatSeconds(bests.memory.seconds)}` : 'Aucun score'}</strong>
            </li>
            <li>
              <span><Zap size={14} /> Réflexes</span>
              <strong>{bests.reaction != null ? `${bests.reaction} ms` : 'Aucun score'}</strong>
            </li>
            <li>
              <span><Terminal size={14} /> Black Box</span>
              <strong>{bests.blackbox ? `${bests.blackbox} / 5 missions` : 'Aucune mission'}</strong>
            </li>
          </ul>
        </section>

        <section className="arcade-section glass">
          <div className="arcade-section-head">
            <div>
              <h2><History size={16} /> Activité récente</h2>
              <p>Vos {Math.min(data.stats.history.length, 8)} dernières parties.</p>
            </div>
          </div>
          {data.stats.history.length ? (
            <ul className="history-list">
              {data.stats.history.slice(0, 8).map((entry) => {
                const game = GAMES.find((item) => item.id === entry.game)
                if (!game) return null
                const GameIcon = game.icon
                return (
                  <li key={entry.id}>
                    <span className="history-icon" style={{ '--hue': game.hue }}>
                      <GameIcon size={15} />
                    </span>
                    <div className="history-copy">
                      <strong>{game.title}</strong>
                      <small>{entry.label || (entry.outcome === 'win' ? 'Victoire' : entry.outcome === 'loss' ? 'Défaite' : 'Partie terminée')}</small>
                    </div>
                    <div className="history-meta">
                      <span className={`outcome-badge outcome-${entry.outcome}`}>
                        {entry.outcome === 'win' ? 'Victoire' : entry.outcome === 'loss' ? 'Défaite' : entry.outcome === 'draw' ? 'Nul' : 'Terminée'}
                      </span>
                      <small>+{entry.xp} XP · {timeAgo(entry.at)}</small>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Gamepad2}
              compact
              title="Aucune partie enregistrée"
              description="Lancez un jeu : vos résultats et votre progression apparaîtront ici."
            />
          )}
        </section>
      </div>

      <section className="achievements-section glass">
        <div className="arcade-section-head">
          <div>
            <h2><Medal size={16} /> Succès</h2>
            <p>{unlocked} débloqué(s) sur {ACHIEVEMENTS.length}. Chaque succès rapporte 25 XP bonus.</p>
          </div>
          <div className="achievement-progress">
            <div className="thin-progress">
              <span style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }} />
            </div>
            <span>{Math.round((unlocked / ACHIEVEMENTS.length) * 100)} %</span>
          </div>
        </div>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const unlockedAt = data.stats.achievements?.[achievement.id]
            const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Trophy
            return (
              <article key={achievement.id} className={`achievement-card ${unlockedAt ? 'is-unlocked' : 'is-locked'}`}>
                <span className="achievement-icon">
                  {unlockedAt ? <Icon size={18} /> : <Lock size={15} />}
                </span>
                <div>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                  <small>{unlockedAt ? `Débloqué ${timeAgo(unlockedAt.at)}` : `+${achievement.xp} XP`}</small>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="arcade-tip">
        <Sparkles size={15} />
        <span>
          Astuce : vos données d’arcade sont conservées localement et incluses dans l’export depuis les paramètres.
        </span>
      </div>
    </div>
  )
}
