import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'

const WEATHER_CODES = {
  0: { label: 'Ciel dégagé', nightLabel: 'Nuit claire', icon: Sun },
  1: { label: 'Plutôt dégagé', nightLabel: 'Plutôt dégagé', icon: CloudSun },
  2: { label: 'Partiellement nuageux', nightLabel: 'Partiellement nuageux', icon: CloudSun },
  3: { label: 'Couvert', nightLabel: 'Couvert', icon: Cloud },
  45: { label: 'Brouillard', icon: CloudFog },
  48: { label: 'Brouillard givrant', icon: CloudFog },
  51: { label: 'Bruine légère', icon: CloudRain },
  53: { label: 'Bruine', icon: CloudRain },
  55: { label: 'Bruine dense', icon: CloudRain },
  56: { label: 'Bruine verglaçante', icon: CloudRain },
  57: { label: 'Bruine verglaçante dense', icon: CloudRain },
  61: { label: 'Pluie légère', icon: CloudRain },
  63: { label: 'Pluie', icon: CloudRain },
  65: { label: 'Pluie forte', icon: CloudRain },
  66: { label: 'Pluie verglaçante', icon: CloudRain },
  67: { label: 'Pluie verglaçante forte', icon: CloudRain },
  71: { label: 'Neige légère', icon: CloudSnow },
  73: { label: 'Neige', icon: CloudSnow },
  75: { label: 'Neige forte', icon: CloudSnow },
  77: { label: 'Grains de neige', icon: CloudSnow },
  80: { label: 'Averses légères', icon: CloudRain },
  81: { label: 'Averses', icon: CloudRain },
  82: { label: 'Averses violentes', icon: CloudRain },
  85: { label: 'Averses de neige', icon: CloudSnow },
  86: { label: 'Averses de neige fortes', icon: CloudSnow },
  95: { label: 'Orage', icon: CloudLightning },
  96: { label: 'Orage avec grêle', icon: CloudLightning },
  99: { label: 'Orage avec grêle forte', icon: CloudLightning },
}

export function weatherInfo(code, isDay = 1) {
  const info = WEATHER_CODES[code] ?? { label: 'Conditions inconnues', icon: Cloud }
  if (code === 0 && !isDay) return { ...info, label: info.nightLabel ?? 'Nuit claire', icon: Moon }
  return { label: info.label, icon: info.icon }
}

export async function geocodeCity(query) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '6')
  url.searchParams.set('language', 'fr')
  url.searchParams.set('format', 'json')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Recherche impossible')
  const json = await response.json()
  return (json.results ?? []).map((result) => ({
    name: result.name,
    country: result.country,
    admin: result.admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }))
}

export async function fetchForecast(place) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(place.latitude))
  url.searchParams.set('longitude', String(place.longitude))
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
  )
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min')
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('forecast_days', '5')
  const response = await fetch(url)
  if (!response.ok) throw new Error('Météo momentanément indisponible')
  const json = await response.json()
  if (!json.current) throw new Error('Réponse météo invalide')
  return {
    place,
    fetchedAt: Date.now(),
    current: {
      temperature: json.current.temperature_2m,
      apparent: json.current.apparent_temperature,
      humidity: json.current.relative_humidity_2m,
      wind: json.current.wind_speed_10m,
      code: json.current.weather_code,
      isDay: json.current.is_day,
    },
    daily: (json.daily?.time ?? []).map((day, index) => ({
      day,
      code: json.daily.weather_code[index],
      max: json.daily.temperature_2m_max[index],
      min: json.daily.temperature_2m_min[index],
    })),
  }
}

export function weatherUpdatedLabel(timestamp) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}
