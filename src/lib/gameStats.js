/* Arcade progression rules kept out of the UI layer. */

export const GAME_IDS = ['snake', '2048', 'minesweeper', 'pong', 'tictactoe', 'memory', 'reaction']

export const LEVEL_STEP = 300

export function levelInfo(xp = 0) {
  const level = Math.floor(Math.max(0, xp) / LEVEL_STEP) + 1
  const inLevel = Math.max(0, xp) % LEVEL_STEP
  const titles = ['Novice', 'Explorateur', 'Navigateur', 'Architecte', 'Stratège', 'Maître NEXUS']
  return {
    level,
    title: titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))],
    inLevel,
    needed: LEVEL_STEP,
    progress: Math.min(1, inLevel / LEVEL_STEP),
    totalXp: Math.max(0, xp),
  }
}

export function computeGameXp(game, result = {}) {
  const detail = result.detail ?? {}
  switch (game) {
    case 'snake':
      return Math.min(120, 12 + Math.round((result.score ?? 0) / 4))
    case '2048':
      return Math.min(120, Math.round((result.score ?? 0) / 80))
    case 'minesweeper':
      if (!detail.won) return 8
      return { beginner: 40, intermediate: 70, expert: 120 }[detail.difficulty] ?? 40
    case 'pong':
      if (!detail.won) return 10
      return { easy: 30, normal: 50, hard: 80 }[detail.difficulty] ?? 40
    case 'tictactoe':
      if (result.outcome === 'win') return 40
      if (result.outcome === 'draw') return 15
      return 6
    case 'memory':
      return detail.completed ? 50 : 10
    case 'reaction':
      return Math.max(5, Math.min(60, Math.round(65 - (detail.ms ?? 600) / 10)))
    default:
      return 10
  }
}

export const ACHIEVEMENTS = [
  {
    id: 'first_game',
    title: 'Première partie',
    description: 'Terminer une première partie dans l’arcade.',
    icon: 'Gamepad2',
    xp: 20,
    check: (data) => data.stats.gamesPlayed >= 1,
  },
  {
    id: 'snake_50',
    title: 'Serpent agile',
    description: 'Atteindre 50 points au Snake.',
    icon: 'Spline',
    xp: 30,
    check: (data) => (data.stats.bests.snake ?? 0) >= 50,
  },
  {
    id: 'snake_150',
    title: 'Long serpent',
    description: 'Atteindre 150 points au Snake.',
    icon: 'Worm',
    xp: 70,
    check: (data) => (data.stats.bests.snake ?? 0) >= 150,
  },
  {
    id: 'block_512',
    title: 'Fusion parfaite',
    description: 'Créer une tuile 512 dans 2048.',
    icon: 'LayoutGrid',
    xp: 50,
    check: (data) => (data.stats.bests['2048Tile'] ?? 0) >= 512,
  },
  {
    id: 'block_2048',
    title: '2048 !',
    description: 'Créer la tuile 2048.',
    icon: 'Trophy',
    xp: 120,
    check: (data) => (data.stats.bests['2048Tile'] ?? 0) >= 2048,
  },
  {
    id: 'mine_beginner',
    title: 'Démineur prudent',
    description: 'Gagner une partie en mode Débutant.',
    icon: 'Flag',
    xp: 40,
    check: (data) => Boolean(data.stats.bests.minesweeper?.beginner),
  },
  {
    id: 'mine_expert',
    title: 'Sapeur d’élite',
    description: 'Gagner une partie en mode Expert.',
    icon: 'Bomb',
    xp: 150,
    check: (data) => Boolean(data.stats.bests.minesweeper?.expert),
  },
  {
    id: 'pong_win',
    title: 'Service gagnant',
    description: 'Remporter un match de Pong.',
    icon: 'Table2',
    xp: 40,
    check: (data) => (data.stats.bests.pong?.wins ?? 0) >= 1,
  },
  {
    id: 'pong_5',
    title: 'Roi du filet',
    description: 'Remporter 5 matchs de Pong.',
    icon: 'Medal',
    xp: 90,
    check: (data) => (data.stats.bests.pong?.wins ?? 0) >= 5,
  },
  {
    id: 'ttt_win',
    title: 'Alignement parfait',
    description: 'Gagner une partie de Morpion.',
    icon: 'Hash',
    xp: 35,
    check: (data) => (data.stats.bests.tictactoe?.wins ?? 0) >= 1,
  },
  {
    id: 'memory_clear',
    title: 'Mémoire de fer',
    description: 'Terminer une partie de Memory.',
    icon: 'Layers',
    xp: 40,
    check: (data) => Boolean(data.stats.bests.memory),
  },
  {
    id: 'lightning',
    title: 'Réflexe éclair',
    description: 'Obtenir un temps de réaction sous 250 ms.',
    icon: 'Zap',
    xp: 60,
    check: (data) => data.stats.bests.reaction != null && data.stats.bests.reaction < 250,
  },
  {
    id: 'marathon',
    title: 'Habitué de l’arcade',
    description: 'Jouer 10 parties, tous jeux confondus.',
    icon: 'Flame',
    xp: 60,
    check: (data) => data.stats.gamesPlayed >= 10,
  },
  {
    id: 'collector',
    title: 'Collectionneur',
    description: 'Ajouter 3 jeux aux favoris.',
    icon: 'Star',
    xp: 30,
    check: (data, prefs) => (prefs.favorites?.length ?? 0) >= 3,
  },
  {
    id: 'explorer_tools',
    title: 'Explorateur d’outils',
    description: 'Utiliser 4 outils différents.',
    icon: 'Compass',
    xp: 40,
    check: (data, prefs) => (prefs.toolsUsed?.length ?? 0) >= 4,
  },
  {
    id: 'note_taker',
    title: 'Plume organisée',
    description: 'Créer 5 notes.',
    icon: 'NotebookPen',
    xp: 40,
    check: (data) => data.notes.length >= 5,
  },
  {
    id: 'task_master',
    title: 'Mission accomplie',
    description: 'Terminer 10 tâches.',
    icon: 'CircleCheckBig',
    xp: 40,
    check: (data) =>
      data.tasks.filter((task) => task.done).length >= 10 ||
      (data.stats.completedTasks ?? 0) >= 10,
  },
  {
    id: 'level_5',
    title: 'Ascension',
    description: 'Atteindre le niveau 5.',
    icon: 'TrendingUp',
    xp: 80,
    check: (data) => levelInfo(data.stats.xp).level >= 5,
  },
]

export function eligibleAchievements(data, prefs) {
  return ACHIEVEMENTS.filter((achievement) => {
    if (data.stats.achievements[achievement.id]) return false
    try {
      return Boolean(achievement.check(data, prefs))
    } catch {
      return false
    }
  }).map((achievement) => achievement.id)
}
