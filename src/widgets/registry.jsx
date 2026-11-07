import {
  Calculator,
  CalendarDays,
  CloudSun,
  Globe2,
  Hourglass,
  Link2,
  ListTodo,
  NotebookPen,
  Star,
  StickyNote,
  Timer,
  TrendingUp,
  Clock3,
  ArrowLeftRight,
  Dices,
  Gamepad2,
} from 'lucide-react'
import { WeatherWidget, RecentsWidget, FavoritesWidget, StatsWidget } from './HomeWidgets'
import {
  CalendarWidget,
  StopwatchWidget,
  TimerWidget,
  CountdownWidget,
  WorldClockWidget,
} from './TimeWidgets'
import {
  TasksWidget,
  QuickNotesWidget,
  BookmarksWidget,
  NotepadWidget,
} from './ProductivityWidgets'
import { CalculatorWidget, ConverterWidget, RandomWidget } from './MiscWidgets'

export const WIDGETS = {
  weather: {
    title: 'Météo',
    subtitle: 'Conditions réelles',
    description: 'La météo actuelle et les prochains jours pour votre position ou une ville choisie.',
    icon: CloudSun,
    component: WeatherWidget,
  },
  calendar: {
    title: 'Calendrier',
    subtitle: 'Mois & échéances',
    description: 'Un calendrier interactif relié à vos tâches, avec ajout direct par journée.',
    icon: CalendarDays,
    component: CalendarWidget,
  },
  tasks: {
    title: 'Tâches',
    subtitle: 'À faire aujourd’hui',
    description: 'Votre liste de tâches, avec échéances, filtres et sauvegarde automatique.',
    icon: ListTodo,
    component: TasksWidget,
  },
  quicknotes: {
    title: 'Notes rapides',
    subtitle: 'Bloc éclair',
    description: 'Un espace d’écriture instantané, sauvegardé au fil de la frappe.',
    icon: StickyNote,
    component: QuickNotesWidget,
  },
  recents: {
    title: 'Applications récentes',
    subtitle: 'Reprendre en un clic',
    description: 'Les jeux et outils que vous avez utilisés récemment.',
    icon: Gamepad2,
    component: RecentsWidget,
  },
  favorites: {
    title: 'Jeux favoris',
    subtitle: 'Votre sélection',
    description: 'Un accès direct aux jeux que vous avez ajoutés aux favoris.',
    icon: Star,
    component: FavoritesWidget,
  },
  stats: {
    title: 'Statistiques personnelles',
    subtitle: 'Progression réelle',
    description: 'Niveau, XP et activité enregistrée dans votre NEXUS.',
    icon: TrendingUp,
    component: StatsWidget,
  },
  calculator: {
    title: 'Calculatrice',
    subtitle: 'Scientifique',
    description: 'Trigonométrie, puissances, racines, factorielles et historique de session.',
    icon: Calculator,
    component: CalculatorWidget,
  },
  stopwatch: {
    title: 'Chronomètre',
    subtitle: 'Précision au centième',
    description: 'Mesurez le temps avec tours et temps intermédiaires.',
    icon: Clock3,
    component: StopwatchWidget,
  },
  timer: {
    title: 'Minuteur',
    subtitle: 'Compte à rebours',
    description: 'Minuteur personnalisable avec presets et alerte sonore.',
    icon: Timer,
    component: TimerWidget,
  },
  countdown: {
    title: 'Compte à rebours',
    subtitle: 'Dates cibles',
    description: 'Suivez le temps restant avant vos événements importants.',
    icon: Hourglass,
    component: CountdownWidget,
  },
  worldclock: {
    title: 'Horloge mondiale',
    subtitle: 'Fuseaux horaires',
    description: 'L’heure locale et celle de vos villes, en temps réel.',
    icon: Globe2,
    component: WorldClockWidget,
  },
  bookmarks: {
    title: 'Liens favoris',
    subtitle: 'Raccourcis web',
    description: 'Vos liens utiles, ouverts en un clic dans un nouvel onglet.',
    icon: Link2,
    component: BookmarksWidget,
  },
  notepad: {
    title: 'Bloc-notes',
    subtitle: 'Documents durables',
    description: 'Plusieurs documents pour consigner informations et idées.',
    icon: NotebookPen,
    component: NotepadWidget,
  },
  converter: {
    title: 'Convertisseur',
    subtitle: 'Unités',
    description: 'Longueurs, masses, températures, données et bien plus.',
    icon: ArrowLeftRight,
    component: ConverterWidget,
  },
  random: {
    title: 'Hasard',
    subtitle: 'Nombres aléatoires',
    description: 'Tirez des nombres uniques ou non, entiers ou décimaux.',
    icon: Dices,
    component: RandomWidget,
  },
}

export const HOME_WIDGET_IDS = ['weather', 'calendar', 'tasks', 'quicknotes', 'recents', 'favorites', 'stats']
export const DASH_WIDGET_IDS = [
  'calculator', 'stopwatch', 'timer', 'countdown', 'worldclock', 'calendar',
  'tasks', 'quicknotes', 'bookmarks', 'notepad', 'converter', 'random',
]
