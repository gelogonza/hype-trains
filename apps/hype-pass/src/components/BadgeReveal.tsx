import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { BADGES, ROLE_LABEL } from '../data/badges'
import type { EarnedBadge } from '../data/types'
import { buzz, chime } from '../state/feedback'
import { themeOf, type StationState } from '../state/station'
import { RIM, RIM_NAME, Stamp } from './ui/Stamp'
import css from './reveal.module.css'

const AUTO_CLOSE = 30

const CONFETTI = ['#ffca5f', '#bf94ff', '#ff6f9f', '#00e6cb', '#57a4ff', '#ff9f1a']

/**
 * Full-screen "you got the badge" moment. The stamp slams in, then its tier climbs
 * Bronze → … → the tier you earned, one tick at a time, before the details land.
 */
export function BadgeReveal({ earned, state, onPassport, onClose }: { earned: EarnedBadge; state: StationState; onPassport: () => void; onClose: () => void }) {
  const b = BADGES[earned.badgeId]
  const th = themeOf(state)
  const [tier, setTier] = useState(1)
  const done = tier >= earned.level
  const riders = Object.keys(state.riders).length + state.contribs * 3

  // Tier roll: tick up to the earned tier, then land.
  useEffect(() => {
    if (tier >= earned.level) {
      buzz([40, 50, 90])
      chime('arrive')
      return
    }
    const t = setTimeout(() => {
      setTier((n) => n + 1)
      buzz(15)
      chime('tap')
    }, tier === 1 ? 900 : 480)
    return () => clearTimeout(t)
  }, [tier, earned.level])

  // Closes itself after 30s so it never blocks the stream.
  useEffect(() => {
    const t = setTimeout(onClose, AUTO_CLOSE * 1000)
    return () => clearTimeout(t)
  }, [onClose])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const confetti = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        x: Math.random() * 100,
        d: 1.6 + Math.random() * 1.6,
        delay: Math.random() * 0.4,
        r: Math.random() * 720,
        c: CONFETTI[i % CONFETTI.length],
        w: 5 + Math.random() * 5,
      })),
    [],
  )

  return createPortal(
    <motion.div
      className={css.reveal}
      style={{ ['--glow' as string]: b.colors.bg, ['--rim' as string]: RIM[tier] }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Badge earned: ${b.eventName}, ${RIM_NAME[earned.level]} tier`}
    >
      <div className={css.rays} aria-hidden />
      {done && (
        <div className={css.confetti} aria-hidden>
          {confetti.map((c, i) => (
            <motion.i
              key={i}
              style={{ left: `${c.x}%`, background: c.c, width: c.w }}
              initial={{ y: '-10vh', rotate: 0, opacity: 1 }}
              animate={{ y: '105vh', rotate: c.r, opacity: [1, 1, 0] }}
              transition={{ duration: c.d, delay: c.delay, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}

      <div className={css.inner}>
        <motion.p className={css.kicker} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          {state.phase === 'arrived' ? th.arrived : `${th.emoji} ${th.vehicle} complete`} · Badge earned
        </motion.p>

        <motion.div
          className={css.stamp}
          initial={{ scale: 3, rotate: -40, opacity: 0, y: -40 }}
          animate={{ scale: 1, rotate: -6, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.25 }}
        >
          <motion.div key={tier} initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
            <Stamp earned={{ ...earned, level: tier }} size={210} />
          </motion.div>
          <span className={css.halo} aria-hidden />
        </motion.div>

        <div className={css.tierRow} aria-live="polite">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.span
              key={n}
              className={`${css.tier} ${n <= tier ? css.tierOn : ''} ${n === earned.level && done ? css.tierFinal : ''}`}
              style={n <= tier ? { background: RIM[n] } : undefined}
              animate={n === tier ? { scale: [1.4, 1] } : undefined}
            >
              {RIM_NAME[n]}
            </motion.span>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.h2
            key={done ? 'final' : tier}
            className={css.tierName}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {RIM_NAME[tier]} {done ? 'tier!' : '…'}
          </motion.h2>
        </AnimatePresence>

        <AnimatePresence>
          {done && (
            <motion.div className={css.details} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3>{b.eventName}</h3>
              <p className={css.meta}>
                {b.streamer} · {b.date}
              </p>
              <ul className={css.facts}>
                <li>
                  <b>{RIM_NAME[earned.level]}</b>
                  <span>tier · chat reached Lv {earned.level}</span>
                </li>
                <li>
                  <b>{ROLE_LABEL[earned.role].split(' · ')[0]}</b>
                  <span>{ROLE_LABEL[earned.role].split(' · ')[1]}</span>
                </li>
                <li>
                  <b>{riders}</b>
                  <span>riders hold it</span>
                </li>
              </ul>
              <p className={css.rare}>One night only. This badge can never be earned again.</p>
              <div className={css.actions}>
                <button className={css.primary} onClick={onPassport}>
                  View in passport
                </button>
                <button className={css.secondary} onClick={onClose}>
                  Nice!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={css.timer} aria-hidden>
          <motion.i initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: AUTO_CLOSE, ease: 'linear' }} />
        </div>

        {!done && (
          <button className={css.skip} onClick={() => setTier(earned.level)}>
            Skip
          </button>
        )}
      </div>
    </motion.div>,
    document.body,
  )
}
