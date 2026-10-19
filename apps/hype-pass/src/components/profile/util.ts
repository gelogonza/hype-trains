/** Airport-style 3-letter code from a channel name, e.g. pixelpilot → PXL. */
export function stationCode(name: string) {
  const letters = name.replace(/[^a-z]/gi, '').toUpperCase()
  const consonants = letters[0] + letters.slice(1).replace(/[AEIOU]/g, '')
  return (consonants.length >= 3 ? consonants : letters).slice(0, 3).padEnd(3, 'X')
}

export function ticketNo(name: string) {
  let h = 7
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 99991
  return `HT ${String(h).padStart(5, '0')}`
}

/** Deterministic little tilt so stamps look hand-pressed. */
export function tilt(seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 17 + ch.charCodeAt(0)) % 997
  return (h % 25) - 12
}
