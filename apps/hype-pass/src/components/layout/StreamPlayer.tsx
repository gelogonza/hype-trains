import { AnimatePresence, motion } from 'framer-motion'
import { themeOf } from '../../state/station'
import { useStation } from '../../state/useStation'
import css from './layout.module.css'

export function StreamPlayer() {
  const { state } = useStation()
  const showLevel = state.phase === 'running' && state.levelUpKey > 0

  return (
    <div className={css.player}>
      <div className={`${css.scene} ${state.game === 'fortnite' ? css.sceneBR : ''}`} aria-hidden>
        <div className={css.moon} />
        {state.game === 'fortnite' && <div className={css.storm} />}
        {state.game === 'fortnite' && <div className={css.bus} />}
        <div className={css.hills} />
        <div className={css.hero} />
      </div>
      <div className={css.cam} aria-hidden>
        <svg viewBox="0 0 80 60" width="100%" height="100%">
          <rect width="80" height="60" fill="#2b1d45" />
          <circle cx="40" cy="26" r="11" fill="#d9c4ff" />
          <path d="M18 60c2-14 11-20 22-20s20 6 22 20z" fill="#d9c4ff" />
          <rect x="27" y="17" width="26" height="6" rx="3" fill="#2b1d45" opacity=".55" />
        </svg>
      </div>
      <span className={css.live}>LIVE</span>
      <span className={css.viewers}>● 4,812</span>
      <AnimatePresence>
        {showLevel && (
          <motion.div
            key={state.levelUpKey}
            className={css.levelFlash}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.08, 1, 1] }}
            transition={{ duration: 2.2, times: [0, 0.15, 0.8, 1] }}
          >
            {themeOf(state).emoji} Hype Train Level {state.completed + 1}!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
