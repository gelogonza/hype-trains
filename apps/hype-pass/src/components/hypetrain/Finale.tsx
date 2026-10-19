import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { LIVE_BADGE_ID } from '../../data/badges'
import { stationName, themeOf } from '../../state/station'
import { useStation } from '../../state/useStation'
import { RIM_NAME, Stamp } from '../ui/Stamp'
import css from './hypetrain.module.css'

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: Math.random() * 100,
        d: 1.6 + Math.random() * 1.6,
        delay: Math.random() * 0.5,
        c: ['#ff9f1a', '#bf94ff', '#ffca5f', '#00e6cb', '#ff6f9f'][i % 5],
        r: Math.random() * 360,
      })),
    [],
  )
  return (
    <div className={css.confetti} aria-hidden>
      {bits.map((b, i) => (
        <motion.i
          key={i}
          style={{ left: `${b.x}%`, background: b.c }}
          initial={{ y: -20, rotate: b.r, opacity: 1 }}
          animate={{ y: 320, rotate: b.r + 360, opacity: 0 }}
          transition={{ duration: b.d, delay: b.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  )
}

/** Resolution: happy path (arrived) or recovery path (delayed), plus the sequel hint. */
export function Finale({ onOpenPassport }: { onOpenPassport: () => void }) {
  const { state, dispatch } = useStation()
  const arrived = state.phase === 'arrived'
  const mine = state.myBadges.find((b) => b.badgeId === LIVE_BADGE_ID)
  const stopAt = stationName(state, Math.max(0, state.completed - 1))

  return (
    <div className={`${css.finale} ${arrived ? css.finaleWin : css.finaleDelay}`}>
      {arrived && <Confetti />}
      <h3>{arrived ? `🏁 Arrived at ${stationName(state, 4)}!` : `⏸ Delayed at ${state.completed ? stopAt : 'the platform'}`}</h3>
      <p>
        {arrived
          ? 'Chat filled all five stations. pixelpilot is unlocking the golden stamp for every rider.'
          : `The timer ran out, but the ride still counts — chat reached Level ${state.completed}. Every rider keeps a stamp with the rim they earned.`}
      </p>

      {mine ? (
        <div className={css.earned}>
          <motion.div
            initial={{ scale: 2.6, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 0.25 }}
          >
            <Stamp earned={mine} size={112} />
          </motion.div>
          <div>
            <strong>Stamped into your Hype Pass</strong>
            <span>
              {RIM_NAME[mine.level]} rim · Level {mine.level}
            </span>
            <button className={css.cta} onClick={onOpenPassport}>
              View in passport →
            </button>
          </div>
        </div>
      ) : (
        <p className={css.missed}>
          You didn’t ride this one, so no stamp. This {themeOf(state).stamp.eventName} stamp is retired now — catch the next train.
        </p>
      )}

      <div className={css.sequel}>
        <span>❄️</span>
        <div>
          <small>NEXT DEPARTURE</small>
          <strong>Winter Express · Dec 24</strong>
        </div>
        <button className={css.remind}>🔔 Remind me</button>
      </div>

      <button className={css.replay} onClick={() => dispatch({ type: 'reset' })}>
        ↺ Replay the train (demo)
      </button>
    </div>
  )
}
