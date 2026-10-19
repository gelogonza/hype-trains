import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { themeLiveBadge } from '../data/badges'
import { THEMES, resolveTheme, themeFromUrl } from '../data/themes'
import { ME_ID, VIEWERS, VIEWER_BY_ID } from '../data/viewers'
import { KIND_INFO, initialState, reducer, type Action, type Kind, type StationState } from './station'

let uid = 0
const nextId = () => `l${++uid}`

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]
const crowd = VIEWERS.filter((v) => v.id !== ME_ID)

/** Weighted mix of what the simulated crowd spends. Average ≈ 60 hype per contribution. */
const CROWD_MIX: [Kind, number][] = [
  ['chat', 0.4],
  ['bits100', 0.25],
  ['bits500', 0.15],
  ['sub', 0.15],
  ['gift5', 0.05],
]
function crowdKind(paidOnly = false): Kind {
  const mix = paidOnly ? CROWD_MIX.filter(([k]) => k !== 'chat') : CROWD_MIX
  const total = mix.reduce((n, [, w]) => n + w, 0)
  let r = Math.random() * total
  for (const [k, w] of mix) {
    if ((r -= w) <= 0) return k
  }
  return 'bits100'
}

const CROWD_RATE = { auto: 0.28, success: 0.48, fail: 0.11 }
/** Sim-seconds of quiet chat before the crowd starts boarding the train. */
const IDLE_WARMUP = 7

/** Chat lines follow the scene (pumpkin talk vs. bus-drop talk). */
const lines = { hype: THEMES.spooky.hypeLines, idle: THEMES.spooky.idleLines }

function contributionAction(viewerId: string, kind: Kind, text?: string): Action {
  const info = KIND_INFO[kind]
  const id = nextId()
  return {
    type: 'contribute',
    c: { id, viewerId, kind, points: info.points },
    line:
      kind === 'chat'
        ? { id, viewerId, text: text ?? pick(lines.hype) }
        : { id, viewerId, text: `${info.verb} · +${info.points} hype`, system: 'contribution' },
  }
}

interface StationApi {
  state: StationState
  contribute: (kind: Kind) => void
  sendChat: (text: string) => void
  dispatch: (a: Action) => void
}

const Ctx = createContext<StationApi | null>(null)

export function StationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, VIEWER_BY_ID[ME_ID].badges, (b) => ({ ...initialState(b), ...themeFromUrl() }))
  const theme = THEMES[resolveTheme(state.game, state.themeChoice)]
  // Keep the live stamp and ambient chat in step with the scene before anything renders.
  themeLiveBadge(resolveTheme(state.game, state.themeChoice))
  lines.hype = theme.hypeLines
  lines.idle = theme.idleLines
  const ref = useRef(state)
  ref.current = state
  const idleFor = useRef(0)

  useEffect(() => {
    const t = setInterval(() => {
      const s = ref.current
      dispatch({ type: 'tick' })

      if (s.phase === 'idle') idleFor.current += 1
      else idleFor.current = 0

      const active = s.phase === 'running' || s.phase === 'boarding'
      if (s.phase === 'running') {
        // Crowd spending (includes free chat hype).
        if (Math.random() < CROWD_RATE[s.outcome]) dispatch(contributionAction(pick(crowd).id, crowdKind()))
        if (Math.random() < 0.45) dispatch(contributionAction(pick(crowd).id, 'chat'))
      } else if (s.phase === 'boarding' || (s.phase === 'idle' && idleFor.current > IDLE_WARMUP)) {
        if (Math.random() < 0.22) dispatch(contributionAction(pick(crowd).id, crowdKind(true)))
      }

      if (!active && Math.random() < 0.5) {
        dispatch({ type: 'chat', line: { id: nextId(), viewerId: pick(crowd).id, text: pick(lines.idle) } })
      }
    }, 1000 / state.speed)
    return () => clearInterval(t)
  }, [state.speed])

  const contribute = useCallback((kind: Kind) => dispatch(contributionAction(ME_ID, kind)), [])

  const sendChat = useCallback((text: string) => {
    const s = ref.current
    if (s.phase === 'running' || s.phase === 'boarding') {
      // Chatting during a train is free participation: it counts you aboard.
      dispatch(contributionAction(ME_ID, 'chat', text))
    } else {
      dispatch({ type: 'chat', line: { id: nextId(), viewerId: ME_ID, text } })
    }
  }, [])

  return <Ctx.Provider value={{ state, contribute, sendChat, dispatch }}>{children}</Ctx.Provider>
}

export function useStation() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStation must be used inside StationProvider')
  return v
}
