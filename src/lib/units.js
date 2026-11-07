/* Unit conversion catalogue with factors relative to a category base unit. */

export const UNIT_CATEGORIES = [
  {
    id: 'length',
    label: 'Longueur',
    base: 'm',
    units: [
      { id: 'mm', label: 'Millimètre (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimètre (cm)', factor: 0.01 },
      { id: 'm', label: 'Mètre (m)', factor: 1 },
      { id: 'km', label: 'Kilomètre (km)', factor: 1000 },
      { id: 'in', label: 'Pouce (in)', factor: 0.0254 },
      { id: 'ft', label: 'Pied (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
      { id: 'nmi', label: 'Mille marin (nmi)', factor: 1852 },
    ],
  },
  {
    id: 'mass',
    label: 'Masse',
    base: 'g',
    units: [
      { id: 'mg', label: 'Milligramme (mg)', factor: 0.001 },
      { id: 'g', label: 'Gramme (g)', factor: 1 },
      { id: 'kg', label: 'Kilogramme (kg)', factor: 1000 },
      { id: 't', label: 'Tonne (t)', factor: 1000000 },
      { id: 'oz', label: 'Once (oz)', factor: 28.349523125 },
      { id: 'lb', label: 'Livre (lb)', factor: 453.59237 },
    ],
  },
  {
    id: 'temperature',
    label: 'Température',
    base: 'c',
    units: [
      { id: 'c', label: 'Celsius (°C)' },
      { id: 'f', label: 'Fahrenheit (°F)' },
      { id: 'k', label: 'Kelvin (K)' },
    ],
  },
  {
    id: 'area',
    label: 'Surface',
    base: 'm2',
    units: [
      { id: 'cm2', label: 'Centimètre carré (cm²)', factor: 0.0001 },
      { id: 'm2', label: 'Mètre carré (m²)', factor: 1 },
      { id: 'km2', label: 'Kilomètre carré (km²)', factor: 1000000 },
      { id: 'ha', label: 'Hectare (ha)', factor: 10000 },
      { id: 'ft2', label: 'Pied carré (ft²)', factor: 0.09290304 },
      { id: 'in2', label: 'Pouce carré (in²)', factor: 0.00064516 },
      { id: 'acre', label: 'Acre', factor: 4046.8564224 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    base: 'l',
    units: [
      { id: 'ml', label: 'Millilitre (mL)', factor: 0.001 },
      { id: 'cl', label: 'Centilitre (cL)', factor: 0.01 },
      { id: 'l', label: 'Litre (L)', factor: 1 },
      { id: 'm3', label: 'Mètre cube (m³)', factor: 1000 },
      { id: 'gal', label: 'Gallon US (gal)', factor: 3.785411784 },
      { id: 'pt', label: 'Pinte US (pt)', factor: 0.473176473 },
      { id: 'cup', label: 'Tasse US', factor: 0.2365882365 },
    ],
  },
  {
    id: 'speed',
    label: 'Vitesse',
    base: 'ms',
    units: [
      { id: 'ms', label: 'Mètre/seconde (m/s)', factor: 1 },
      { id: 'kmh', label: 'Kilomètre/heure (km/h)', factor: 0.2777777778 },
      { id: 'mph', label: 'Mile/heure (mph)', factor: 0.44704 },
      { id: 'knot', label: 'Nœud (kn)', factor: 0.5144444444 },
      { id: 'fts', label: 'Pied/seconde (ft/s)', factor: 0.3048 },
    ],
  },
  {
    id: 'data',
    label: 'Données',
    base: 'b',
    units: [
      { id: 'bit', label: 'Bit', factor: 0.125 },
      { id: 'b', label: 'Octet (o)', factor: 1 },
      { id: 'kb', label: 'Kilooctet (Ko)', factor: 1024 },
      { id: 'mb', label: 'Mégaoctet (Mo)', factor: 1048576 },
      { id: 'gb', label: 'Gigaoctet (Go)', factor: 1073741824 },
      { id: 'tb', label: 'Téraoctet (To)', factor: 1099511627776 },
    ],
  },
  {
    id: 'time',
    label: 'Temps',
    base: 's',
    units: [
      { id: 'ms', label: 'Milliseconde (ms)', factor: 0.001 },
      { id: 's', label: 'Seconde (s)', factor: 1 },
      { id: 'min', label: 'Minute (min)', factor: 60 },
      { id: 'h', label: 'Heure (h)', factor: 3600 },
      { id: 'day', label: 'Jour', factor: 86400 },
      { id: 'week', label: 'Semaine', factor: 604800 },
    ],
  },
  {
    id: 'pressure',
    label: 'Pression',
    base: 'pa',
    units: [
      { id: 'pa', label: 'Pascal (Pa)', factor: 1 },
      { id: 'kpa', label: 'Kilopascal (kPa)', factor: 1000 },
      { id: 'bar', label: 'Bar', factor: 100000 },
      { id: 'psi', label: 'PSI', factor: 6894.757293 },
      { id: 'atm', label: 'Atmosphère (atm)', factor: 101325 },
    ],
  },
]

export function getCategory(id) {
  return UNIT_CATEGORIES.find((category) => category.id === id) ?? UNIT_CATEGORIES[0]
}

export function convertUnits(categoryId, fromId, toId, value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return NaN
  const category = getCategory(categoryId)
  if (categoryId === 'temperature') {
    const celsius =
      fromId === 'c' ? numeric : fromId === 'f' ? ((numeric - 32) * 5) / 9 : numeric - 273.15
    if (toId === 'c') return celsius
    if (toId === 'f') return (celsius * 9) / 5 + 32
    return celsius + 273.15
  }
  const from = category.units.find((unit) => unit.id === fromId)
  const to = category.units.find((unit) => unit.id === toId)
  if (!from || !to) return NaN
  return (numeric * from.factor) / to.factor
}

export function formatConverted(value) {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(6)
  return new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 12 }).format(value)
}
