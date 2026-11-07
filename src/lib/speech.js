/* Local speech synthesis for NEXUS Mind. Text is always displayed; voice is optional. */

let selectedVoice = null

function pickVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  selectedVoice =
    voices.find((voice) => /^fr[-_]FR/i.test(voice.lang) && /natural|amelie|amélie|audrey|thomas/i.test(voice.name)) ??
    voices.find((voice) => /^fr[-_]FR/i.test(voice.lang)) ??
    voices.find((voice) => /^fr/i.test(voice.lang)) ??
    voices[0]
  return selectedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  pickVoice()
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice)
}

export function speechAvailable() {
  return typeof window !== 'undefined' && Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance)
}

export function stopSpeech() {
  if (!speechAvailable()) return
  try {
    window.speechSynthesis.cancel()
  } catch {
    /* no-op */
  }
}

export function speakAssistant(text, { enabled = true, rate = 1.03, pitch = 1.02 } = {}) {
  if (!enabled || !text || !speechAvailable()) return false
  try {
    stopSpeech()
    const utterance = new window.SpeechSynthesisUtterance(
      text.replace(/[`*_#>]/g, '').replace(/\s+/g, ' ').slice(0, 600),
    )
    utterance.lang = 'fr-FR'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = 0.86
    const voice = selectedVoice ?? pickVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    return false
  }
}
