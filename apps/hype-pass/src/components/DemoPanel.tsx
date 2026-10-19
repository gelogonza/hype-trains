import { useRef, useState } from 'react'
import { GAMES, THEMES, type GameId, type ThemeChoice } from '../data/themes'
import type { Outcome } from '../state/station'
import { useStation } from '../state/useStation'
import { DarkThemeSwitch } from './layout/TopNav'
import css from './app.module.css'

/** Presenter controls for critique, plus the streamer's Hype Train setup. Shown with ?demo=1. */
export function DemoPanel() {
  const { state, dispatch, contribute } = useStation()
  const [open, setOpen] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const upload = (f: File | undefined) => {
    if (!f) return
    if (state.backdrop) URL.revokeObjectURL(state.backdrop)
    dispatch({ type: 'setChannel', backdrop: URL.createObjectURL(f) })
  }
  const clearBackdrop = () => {
    if (state.backdrop) URL.revokeObjectURL(state.backdrop)
    dispatch({ type: 'setChannel', backdrop: null })
  }

  return (
    <div className={css.demo}>
      <button className={css.demoToggle} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Demo controls">
        ⚙
      </button>
      {open && (
        <div className={css.demoPanel}>
          <strong>Viewer's Twitch settings</strong>
          <DarkThemeSwitch />
          <strong>Streamer setup</strong>
          <label>
            Playing
            <select value={state.game} onChange={(e) => dispatch({ type: 'setChannel', game: e.target.value as GameId })}>
              {Object.entries(GAMES).map(([id, g]) => (
                <option key={id} value={id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Train scene
            <select value={state.themeChoice} onChange={(e) => dispatch({ type: 'setChannel', themeChoice: e.target.value as ThemeChoice })}>
              <option value="auto">Auto (match game)</option>
              {Object.entries(THEMES).map(([id, t]) => (
                <option key={id} value={id}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className={css.demoRow}>
            <button onClick={() => file.current?.click()}>{state.backdrop ? 'Change backdrop' : 'Upload backdrop'}</button>
            {state.backdrop && <button onClick={clearBackdrop}>Clear</button>}
          </div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />

          <strong>Demo</strong>
          <label>
            Outcome
            <select value={state.outcome} onChange={(e) => dispatch({ type: 'setOutcome', outcome: e.target.value as Outcome })}>
              <option value="auto">Auto (close race)</option>
              <option value="success">Force arrival</option>
              <option value="fail">Force delay</option>
            </select>
          </label>
          <label>
            Speed
            <select value={state.speed} onChange={(e) => dispatch({ type: 'setSpeed', speed: Number(e.target.value) })}>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </label>
          <div className={css.demoRow}>
            <button onClick={() => contribute('bits500')}>Kick off</button>
            <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
          </div>
          <span className={css.demoState}>
            phase: {state.phase} · lv {state.level} · {Math.floor(state.points)} pts
          </span>
        </div>
      )}
    </div>
  )
}
