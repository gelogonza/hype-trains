import { useSyncExternalStore } from 'react'

/** Little hits of feedback: a chime and a buzz. Sound can be muted; the choice is remembered. */

const KEY = 'hype-pass:sound-muted'
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
})()
const subs = new Set<() => void>()

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(KEY, m ? '1' : '0')
  } catch {
    /* session only */
  }
  subs.forEach((f) => f())
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => muted,
  )
}

let ctx: AudioContext | null = null

const NOTES = {
  tap: [988],
  level: [523, 659, 784],
  arrive: [523, 659, 784, 1047],
} as const

/** Short ascending chime. Only sounds once the page has had a user gesture (browser rule). */
export function chime(kind: keyof typeof NOTES) {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    if (ctx.state !== 'running') return
    const t0 = ctx.currentTime
    NOTES[kind].forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'triangle'
      osc.frequency.value = f
      const t = t0 + i * 0.09
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.12, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch {
    /* no audio available */
  }
}

export function buzz(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}
