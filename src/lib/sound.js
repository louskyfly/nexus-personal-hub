/* Tiny synthesized UI soundscape — no audio assets, fully offline. */

let ctx = null
let enabled = true
let volume = 0.5

export function configureSound({ sound, volume: nextVolume } = {}) {
  if (typeof sound === 'boolean') enabled = sound
  if (typeof nextVolume === 'number') volume = Math.min(1, Math.max(0, nextVolume))
}

function getContext() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.2, delay = 0, slide = null }) {
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const env = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slide), start + duration)
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * volume), start + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(env).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

const SOUNDS = {
  click: () => tone({ freq: 520, type: 'triangle', duration: 0.06, gain: 0.08 }),
  open: () => {
    tone({ freq: 420, type: 'sine', duration: 0.14, gain: 0.09 })
    tone({ freq: 630, type: 'sine', duration: 0.18, gain: 0.07, delay: 0.05 })
  },
  close: () => tone({ freq: 380, type: 'sine', duration: 0.12, gain: 0.07, slide: 240 }),
  success: () => {
    tone({ freq: 523, type: 'sine', duration: 0.14, gain: 0.12 })
    tone({ freq: 659, type: 'sine', duration: 0.14, gain: 0.12, delay: 0.1 })
    tone({ freq: 784, type: 'sine', duration: 0.22, gain: 0.12, delay: 0.2 })
  },
  error: () => {
    tone({ freq: 220, type: 'sawtooth', duration: 0.16, gain: 0.09, slide: 130 })
  },
  point: () => tone({ freq: 720, type: 'square', duration: 0.05, gain: 0.05 }),
  tick: () => tone({ freq: 900, type: 'sine', duration: 0.03, gain: 0.03 }),
  gameover: () => {
    tone({ freq: 330, type: 'triangle', duration: 0.2, gain: 0.1 })
    tone({ freq: 247, type: 'triangle', duration: 0.3, gain: 0.1, delay: 0.16 })
  },
  flip: () => tone({ freq: 660, type: 'sine', duration: 0.05, gain: 0.05 }),
  merge: () => tone({ freq: 480, type: 'triangle', duration: 0.08, gain: 0.07, slide: 700 }),
  flag: () => tone({ freq: 820, type: 'triangle', duration: 0.05, gain: 0.06 }),
  bounce: () => tone({ freq: 260, type: 'square', duration: 0.04, gain: 0.05 }),
  win: () => {
    ;[523, 659, 784, 1046].forEach((freq, index) =>
      tone({ freq, type: 'sine', duration: 0.24, gain: 0.11, delay: index * 0.09 }),
    )
  },
}

export function playSound(name) {
  if (!enabled) return
  try {
    SOUNDS[name]?.()
  } catch {
    /* audio should never break the app */
  }
}
