export function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function hexToRgb(hex) {
  let value = hex.replace('#', '').trim()
  if (value.length === 3) value = value.split('').map((char) => char + char).join('')
  if (!/^[0-9a-f]{6}$/i.test(value)) return null
  const number = parseInt(value, 16)
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 }
}

export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((channel) => clampChannel(channel).toString(16).padStart(2, '0')).join('')}`
}

export function rgbToHsl({ r, g, b }) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
  }
  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  return {
    h: hue,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

function hueToRgb(p, q, t) {
  let value = t
  if (value < 0) value += 1
  if (value > 1) value -= 1
  if (value < 1 / 6) return p + (q - p) * 6 * value
  if (value < 1 / 2) return q
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6
  return p
}

export function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360
  const saturation = Math.max(0, Math.min(100, s)) / 100
  const lightness = Math.max(0, Math.min(100, l)) / 100
  if (saturation === 0) {
    const channel = Math.round(lightness * 255)
    return { r: channel, g: channel, b: channel }
  }
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q
  return {
    r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hue) * 255),
    b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
  }
}

export function hslToHex(h, s, l) {
  return rgbToHex(hslToRgb(h, s, l))
}

export function formatRgb({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`
}

export function formatHsl({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`
}

export function readableText(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.62 ? '#0a0d14' : '#ffffff'
}

export function randomHex() {
  const value = Math.floor(Math.random() * 0xffffff)
  return `#${value.toString(16).padStart(6, '0')}`
}

export function buildPalette() {
  const base = Math.floor(Math.random() * 360)
  const schemes = [
    [base, 72, 58],
    [(base + 32) % 360, 68, 50],
    [(base + 180) % 360, 62, 60],
    [(base + 210) % 360, 55, 44],
    [(base + 24) % 360, 40, 72],
  ]
  return schemes.map(([h, s, l]) => ({ hex: hslToHex(h, s, l), h, s, l }))
}

export function colorInfo(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const hsl = rgbToHsl(rgb)
  return {
    hex: rgbToHex(rgb),
    rgb,
    hsl,
    rgbText: formatRgb(rgb),
    hslText: formatHsl(hsl),
  }
}
