import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  CloudSun,
  Droplets,
  Gamepad2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  Star,
  Thermometer,
  TrendingUp,
  Wind,
  Wrench,
} from 'lucide-react'
import { useData } from '../state/DataContext'
import { usePrefs } from '../state/PrefsContext'
import { useNavigation } from '../state/NavigationContext'
import { useToast } from '../components/Toast'
import { EmptyState } from '../components/ui'
import { useOnline } from '../lib/hooks'
import { fetchForecast, geocodeCity, weatherInfo, weatherUpdatedLabel } from '../lib/weather'
import { levelInfo } from '../lib/gameStats'
import { gameById, toolById } from '../lib/catalog'
import { timeAgo } from '../lib/utils'

/* ------------------------------ Weather ------------------------------ */

export function WeatherWidget({ expanded = false }) {
  const { data, setWeather } = useData()
  const { prefs, setPref } = usePrefs()
  const { toast } = useToast()
  const online = useOnline()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const weatherRef = useRef(data.weather)
  weatherRef.current = data.weather

  const place = prefs.weatherPlace
  const weather = data.weather

  const refresh = async (target = place) => {
    if (!target) return
    if (!navigator.onLine) {
      setError('Hors connexion : la météo ne peut pas être actualisée.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = await fetchForecast(target)
      setWeather(next)
    } catch (cause) {
      setError(cause.message || 'Météo momentanément indisponible.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!place) return
    const cached = weatherRef.current
    const samePlace =
      cached?.place &&
      Math.abs(cached.place.latitude - place.latitude) < 0.001 &&
      Math.abs(cached.place.longitude - place.longitude) < 0.001
    const stale = !cached || Date.now() - cached.fetchedAt > 30 * 60 * 1000
    if (!samePlace || (stale && navigator.onLine)) refresh(place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.latitude, place?.longitude])

  const locate = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible sur cet appareil.')
      return
    }
    setSearching(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          name: 'Ma position',
          country: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setPref('weatherPlace', next)
        setEditing(false)
        setSearching(false)
        refresh(next)
      },
      () => {
        setSearching(false)
        setError('Localisation refusée. Recherchez plutôt une ville.')
      },
      { timeout: 9000, maximumAge: 10 * 60 * 1000 },
    )
  }

  const search = async (event) => {
    event.preventDefault()
    if (!query.trim()) return
    if (!navigator.onLine) {
      setError('Recherche indisponible hors connexion.')
      return
    }
    setSearching(true)
    setError('')
    try {
      const found = await geocodeCity(query.trim())
      setResults(found)
      if (!found.length) setError('Aucune ville trouvée.')
    } catch {
      setError('Recherche impossible pour le moment.')
    } finally {
      setSearching(false)
    }
  }

  const choosePlace = (result) => {
    setPref('weatherPlace', result)
    setResults(null)
    setQuery('')
    setEditing(false)
    refresh(result)
    toast({ title: 'Lieu météo enregistré', description: `${result.name}${result.country ? `, ${result.country}` : ''}` })
  }

  if (!place || editing) {
    return (
      <div className="weather-setup">
        <div className="weather-setup-head">
          <span className="weather-orb">
            <CloudSun size={26} />
          </span>
          <div>
            <strong>Météo en direct</strong>
            <p>Localisez-vous ou choisissez une ville. Aucun réglage n’est simulé.</p>
          </div>
        </div>
        <div className="weather-actions">
          <button type="button" className="btn btn-primary" onClick={locate} disabled={searching}>
            <LocateFixed size={15} /> Me localiser
          </button>
          {place ? (
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Annuler
            </button>
          ) : null}
        </div>
        <form className="weather-search" onSubmit={search}>
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une ville…"
            aria-label="Rechercher une ville"
          />
          <button type="submit" className="btn btn-ghost btn-sm" disabled={searching || !query.trim()}>
            {searching ? '…' : 'Chercher'}
          </button>
        </form>
        {results?.length ? (
          <ul className="weather-results">
            {results.map((result) => (
              <li key={`${result.latitude}-${result.longitude}`}>
                <button type="button" onClick={() => choosePlace(result)}>
                  <MapPin size={14} />
                  <span>
                    <strong>{result.name}</strong>
                    <small>{[result.admin, result.country].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="inline-error">{error}</p> : null}
        {!online ? <p className="inline-note">Hors connexion — la configuration météo nécessite Internet.</p> : null}
        <p className="weather-source">Données Open-Meteo · actualisation toutes les 30 min</p>
      </div>
    )
  }

  const info = weather ? weatherInfo(weather.current.code, weather.current.isDay) : null
  const WeatherIcon = info?.icon ?? CloudSun
  const stale = weather && Date.now() - weather.fetchedAt > 45 * 60 * 1000

  return (
    <div className={`weather ${expanded ? 'is-expanded' : ''}`}>
      <div className="weather-main">
        <div className="weather-place">
          <MapPin size={13} />
          <span>{place.name}</span>
          {place.country ? <small>{place.country}</small> : null}
          <button type="button" className="link-btn" onClick={() => setEditing(true)}>
            Changer
          </button>
        </div>
        {weather ? (
          <>
            <div className="weather-now">
              <span className="weather-icon-lg">
                <WeatherIcon size={expanded ? 54 : 40} strokeWidth={1.4} />
              </span>
              <div>
                <div className="weather-temp">
                  {Math.round(weather.current.temperature)}
                  <span>°C</span>
                </div>
                <p className="weather-label">{info.label}</p>
              </div>
            </div>
            <div className="weather-meta">
              <span>
                <Thermometer size={13} /> Ressenti {Math.round(weather.current.apparent)}°
              </span>
              <span>
                <Wind size={13} /> {Math.round(weather.current.wind)} km/h
              </span>
              <span>
                <Droplets size={13} /> {Math.round(weather.current.humidity)} %
              </span>
            </div>
          </>
        ) : (
          <div className="weather-loading">
            {busy ? 'Chargement de la météo…' : 'Météo indisponible pour le moment.'}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => refresh()} disabled={busy}>
              <RefreshCw size={14} className={busy ? 'spin' : ''} /> Réessayer
            </button>
          </div>
        )}
        {error ? <p className="inline-error">{error}</p> : null}
        {!online && weather ? (
          <p className="inline-note">Hors connexion · données de {weatherUpdatedLabel(weather.fetchedAt)}</p>
        ) : stale && online ? (
          <p className="inline-note">Données de {weatherUpdatedLabel(weather.fetchedAt)}</p>
        ) : null}
        <p className="weather-source">Données Open-Meteo · {place.name}</p>
      </div>
      {expanded && weather?.daily?.length ? (
        <div className="weather-forecast">
          {weather.daily.slice(1, 5).map((day) => {
            const dayInfo = weatherInfo(day.code, 1)
            const DayIcon = dayInfo.icon
            return (
              <div className="weather-day" key={day.day}>
                <span>
                  {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${day.day}T12:00:00`))}
                </span>
                <DayIcon size={20} strokeWidth={1.5} />
                <strong>{Math.round(day.max)}°</strong>
                <small>{Math.round(day.min)}°</small>
              </div>
            )
          })}
        </div>
      ) : null}
      <button
        type="button"
        className="icon-btn weather-refresh"
        aria-label="Actualiser la météo"
        onClick={() => refresh()}
        disabled={busy}
      >
        <RefreshCw size={14} className={busy ? 'spin' : ''} />
      </button>
    </div>
  )
}

/* ------------------------------ Recents ------------------------------ */

export function RecentsWidget() {
  const { prefs } = usePrefs()
  const { openGame, openTool, navigate } = useNavigation()

  if (!prefs.recents.length) {
    return (
      <EmptyState
        icon={Gamepad2}
        compact
        title="Rien encore lancé"
        description="Les jeux et outils que vous ouvrez apparaîtront ici."
        action={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('arcade')}>
            Ouvrir l’arcade <ArrowRight size={14} />
          </button>
        }
      />
    )
  }

  return (
    <ul className="recent-list">
      {prefs.recents.slice(0, 4).map((entry) => {
        const item = entry.type === 'game' ? gameById(entry.id) : toolById(entry.id)
        if (!item) return null
        const Icon = item.icon
        return (
          <li key={`${entry.type}-${entry.id}`}>
            <button
              type="button"
              className="recent-row"
              onClick={() => (entry.type === 'game' ? openGame(entry.id) : openTool(entry.id))}
            >
              <span className="recent-icon" style={{ '--row-hue': item.hue }}>
                <Icon size={16} />
              </span>
              <span className="recent-copy">
                <strong>{item.title}</strong>
                <small>{entry.type === 'game' ? 'Jeu' : 'Outil'} · {timeAgo(entry.at)}</small>
              </span>
              {entry.type === 'game' ? <Gamepad2 size={13} className="recent-type" /> : <Wrench size={13} className="recent-type" />}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------ Favorites ------------------------------ */

export function FavoritesWidget() {
  const { prefs, toggleFavorite } = usePrefs()
  const { openGame, navigate } = useNavigation()
  const favorites = prefs.favorites.map(gameById).filter(Boolean)

  if (!favorites.length) {
    return (
      <EmptyState
        icon={Star}
        compact
        title="Aucun favori"
        description="Étoilez un jeu dans l’arcade pour le retrouver ici."
        action={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('arcade')}>
            Choisir un jeu <ArrowRight size={14} />
          </button>
        }
      />
    )
  }

  return (
    <ul className="recent-list">
      {favorites.slice(0, 4).map((game) => {
        const Icon = game.icon
        return (
          <li key={game.id} className="recent-row">
            <button type="button" className="recent-main" onClick={() => openGame(game.id)}>
              <span className="recent-icon" style={{ '--row-hue': game.hue }}>
                <Icon size={16} />
              </span>
              <span className="recent-copy">
                <strong>{game.title}</strong>
                <small>{game.tagline}</small>
              </span>
            </button>
            <button
              type="button"
              className="mini-star is-active"
              aria-label={`Retirer ${game.title} des favoris`}
              onClick={() => toggleFavorite(game.id)}
            >
              <Star size={13} fill="currentColor" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* ------------------------------ Personal stats ------------------------------ */

export function StatsWidget() {
  const { data } = useData()
  const { navigate } = useNavigation()
  const info = levelInfo(data.stats.xp)
  const tasksDone = data.tasks.filter((task) => task.done).length
  const notesCount = data.notes.length

  return (
    <div className="personal-stats">
      <div className="level-row">
        <div
          className="level-ring"
          style={{ '--progress': `${Math.round(info.progress * 100)}%` }}
          aria-label={`Niveau ${info.level}, ${Math.round(info.progress * 100)} %`}
        >
          <span>{info.level}</span>
        </div>
        <div>
          <strong>Niveau {info.level} · {info.title}</strong>
          <span className="hint">{info.inLevel} / {info.needed} XP vers le niveau {info.level + 1}</span>
          <div className="thin-progress">
            <span style={{ width: `${info.progress * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="mini-metrics">
        <div>
          <strong>{data.stats.gamesPlayed}</strong>
          <span>parties</span>
        </div>
        <div>
          <strong>{notesCount}</strong>
          <span>notes</span>
        </div>
        <div>
          <strong>{tasksDone}</strong>
          <span>tâches finies</span>
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm full" onClick={() => navigate('arcade')}>
        <TrendingUp size={14} /> Voir la progression
      </button>
    </div>
  )
}
