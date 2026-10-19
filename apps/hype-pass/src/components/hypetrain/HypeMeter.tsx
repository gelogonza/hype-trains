import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LIVE_BADGE_ID } from '../../data/badges'
import type { Role } from '../../data/types'
import { ME_ID } from '../../data/viewers'
import { buzz, chime } from '../../state/feedback'
import { KIND_INFO, LEVEL_GOALS, stationName, themeOf, type StationState } from '../../state/station'
import { RIM, RIM_NAME, Stamp } from '../ui/Stamp'
import css from './ht.module.css'

/* ---------------- Stamp + progress ring ---------------- */

/** Your live stamp, with a ring that fills as chat pushes the level. Slams down on every level clear. */
export function StampRing({ state, role, poke }: { state: StationState; role?: Role; poke: number }) {
  const ended = state.phase === 'arrived' || state.phase === 'delayed'
  const reached = state.phase === 'arrived' ? 5 : state.completed
  const goal = LEVEL_GOALS[state.level - 1]
  const frac = state.phase === 'running' ? Math.min(1, state.points / goal) : ended ? 1 : 0
  const R = 30
  const C = 2 * Math.PI * R
  const target = state.phase === 'running' ? state.level : Math.max(1, reached)
  const slam = useAnimationControls()
  const wiggle = useAnimationControls()

  useEffect(() => {
    if (!state.levelUpKey) return
    void slam.start({ scale: [1.9, 0.86, 1.06, 1], rotate: [-24, 6, -2, 0], transition: { duration: 0.6, times: [0, 0.45, 0.75, 1] } })
  }, [state.levelUpKey, slam])

  useEffect(() => {
    if (!poke) return
    void wiggle.start({ rotate: [0, -12, 10, -6, 0], scale: [1, 1.12, 1], transition: { duration: 0.45 } })
  }, [poke, wiggle])

  return (
    <span className={css.ring} aria-hidden>
      <svg viewBox="0 0 72 72" className={css.ringSvg}>
        <circle cx="36" cy="36" r={R} fill="none" stroke="var(--hover)" strokeWidth="5" />
        <motion.circle
          cx="36"
          cy="36"
          r={R}
          fill="none"
          stroke={RIM[target]}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - frac) }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <motion.span animate={wiggle} className={css.ringStamp}>
        <motion.span animate={slam} style={{ display: 'block' }}>
          <Stamp earned={{ badgeId: LIVE_BADGE_ID, level: Math.max(1, reached), role: role ?? 'rider' }} size={44} still={!role} />
        </motion.span>
      </motion.span>
    </span>
  )
}

/** Five checkpoints that light up as levels clear. */
export function Pips({ state }: { state: StationState }) {
  const reached = state.phase === 'arrived' ? 5 : state.completed
  return (
    <span className={css.pips} aria-label={`${reached} of 5 stations cleared`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.i
          key={n}
          className={reached >= n ? css.pipOn : state.phase === 'running' && state.level === n ? css.pipNow : undefined}
          style={reached >= n ? { background: RIM[n] } : undefined}
          animate={reached >= n ? { scale: [1.8, 1] } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 12 }}
        />
      ))}
    </span>
  )
}

/* ---------------- Momentum: combo + my contributions ---------------- */

/** How many contributions landed in the last few seconds. */
export function useCombo(state: StationState) {
  const times = useRef<number[]>([])
  const last = useRef<string | undefined>(undefined)
  const [n, setN] = useState(0)
  useEffect(() => {
    const top = state.feed[0]
    if (top && top.id !== last.current) {
      last.current = top.id
      times.current.push(Date.now())
    }
  }, [state.feed])
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      times.current = times.current.filter((x) => now - x < 3000 / Math.max(1, state.speed * 0.6))
      setN(times.current.length)
    }, 300)
    return () => clearInterval(t)
  }, [state.speed])
  return state.phase === 'running' ? n : 0
}

/** Fires when *you* contribute: returns a pop to show and a counter to wiggle the stamp. */
export function useMyHype(state: StationState) {
  const last = useRef<string | undefined>(undefined)
  const total = useRef(0)
  const [pop, setPop] = useState<{ key: string; points: number; first: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    const top = state.feed[0]
    if (!top || top.id === last.current) return
    last.current = top.id
    if (top.viewerId !== ME_ID) return
    const first = total.current === 0
    total.current += top.points
    setPop({ key: top.id, points: top.points, first })
    buzz(top.kind === 'chat' ? 12 : [20, 30, 20])
    chime('tap')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPop(null), 2600)
  }, [state.feed])
  useEffect(() => {
    if (state.phase === 'idle') total.current = 0
  }, [state.phase])
  return { pop, total: total.current }
}

/** The one line under the title: always the most motivating true thing. */
export function nudge(state: StationState, aboard: boolean, pop: { points: number; first: boolean } | null, myTotal: number) {
  if (pop) return pop.first ? themeOf(state).joined : `+${pop.points} from you · ${myTotal} total`
  const goal = LEVEL_GOALS[state.level - 1]
  const left = Math.max(0, goal - state.points)
  const subs = Math.ceil(left / KIND_INFO.sub.points)
  const bits = Math.ceil(left / KIND_INFO.bits100.points) * 100
  switch (state.phase) {
    case 'idle':
      return 'Ride to collect the one-night stamp'
    case 'boarding':
      return `${3 - state.boarded} more to depart · ${Math.max(0, state.timeLeft)}s`
    case 'running':
      if (state.points / goal >= 0.85) return `🔥 Almost there! ${subs} sub to ${RIM_NAME[state.level]}`
      return aboard ? `${subs} sub${subs === 1 ? '' : 's'} or ${kfmt(bits)} Bits → ${RIM_NAME[state.level]}` : 'Chat to hop on — it’s free'
    case 'arrived':
      return aboard ? '🏁 Legend stamp earned!' : '🏁 Arrived — catch the next one'
    case 'delayed':
      return aboard ? `Stamp kept · ${RIM_NAME[Math.max(1, state.completed)]} rim` : 'Train stopped · next: Dec 24'
  }
}

const kfmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n))

/* ---------------- Level-cleared burst ---------------- */

const CONFETTI = ['#ffca5f', '#bf94ff', '#ff6f9f', '#00e6cb', '#57a4ff', '#ff9f1a']

/** Full-width celebration over chat each time a level clears (and a bigger one on arrival). */
export function LevelBurst({ state, aboard }: { state: StationState; aboard: boolean }) {
  const [show, setShow] = useState<{ key: number; level: number; arrived: boolean } | null>(null)
  const seen = useRef(state.levelUpKey)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    const fresh = state.levelUpKey > seen.current
    seen.current = state.levelUpKey
    if (!fresh) return
    const arrived = state.phase === 'arrived'
    setShow({ key: state.levelUpKey, level: state.completed, arrived })
    buzz(arrived ? [40, 60, 40, 60, 120] : [30, 50, 80])
    chime(arrived ? 'arrive' : 'level')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(null), arrived ? 3600 : 2400)
    // Only a new level clear should trigger this; phase/completed are read alongside it.
  }, [state.levelUpKey])

  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: (i / 28) * 100 + Math.random() * 4,
        d: 0.9 + Math.random() * 0.9,
        r: Math.random() * 540,
        c: CONFETTI[i % CONFETTI.length],
      })),
    // fresh confetti per burst
    [show?.key],
  )

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={show.key}
          className={`${css.burst} ${show.arrived ? css.burstGold : ''}`}
          initial={{ opacity: 0, y: -10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          role="status"
          aria-live="polite"
        >
          <div className={css.burstConfetti} aria-hidden>
            {bits.map((b, i) => (
              <motion.i
                key={i}
                style={{ left: `${b.x}%`, background: b.c }}
                initial={{ y: -10, rotate: 0, opacity: 1 }}
                animate={{ y: 150, rotate: b.r, opacity: 0 }}
                transition={{ duration: b.d, ease: 'easeIn' }}
              />
            ))}
          </div>
          <motion.div
            className={css.burstStamp}
            initial={{ scale: 2.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
          >
            <Stamp earned={{ badgeId: LIVE_BADGE_ID, level: show.level, role: 'rider' }} size={64} />
          </motion.div>
          <div className={css.burstText}>
            <small>{show.arrived ? `ALL 5 ${themeOf(state).unit.toUpperCase()}S` : `${themeOf(state).unit.toUpperCase()} ${show.level} OF 5`}</small>
            <strong>{show.arrived ? themeOf(state).arrived : themeOf(state).cleared}</strong>
            <span>
              {aboard
                ? show.level > 1
                  ? `Your stamp: ${RIM_NAME[show.level - 1]} → ${RIM_NAME[show.level]}`
                  : `Your stamp: ${RIM_NAME[1]} rim locked in`
                : `${stationName(state, Math.max(0, show.level - 1))} cleared — chat to ride`}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
