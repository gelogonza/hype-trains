import { useSyncExternalStore } from 'react'

/** The viewer's Twitch "Dark Theme" setting. Twitch defaults to dark. */
export type UiTheme = 'dark' | 'light'

// Prefixed with the app name: apps hosted on one domain share localStorage.
const KEY = 'hype-pass:twitch-dark-theme'
const subs = new Set<() => void>()

function read(): UiTheme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* storage unavailable: fall back to Twitch's default */
  }
  return 'dark'
}

function apply(t: UiTheme) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0e0e10' : '#ffffff')
}

let current = read()
apply(current)

export function setUiTheme(t: UiTheme) {
  current = t
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* still applies for this session */
  }
  apply(t)
  subs.forEach((f) => f())
}

export function useUiTheme() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => current,
  )
}
