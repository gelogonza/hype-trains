import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { BADGES, LIVE_BADGE_ID } from '../../data/badges'
import { ME_ID } from '../../data/viewers'
import { resolveTheme } from '../../data/themes'
import { BOARDING_NEEDED, KIND_INFO, LEVEL_GOALS, stationName, themeOf } from '../../state/station'
import { setMuted, useMuted } from '../../state/feedback'
import { useStation } from '../../state/useStation'
import { Icon } from '../layout/Icons'
import { RIM_NAME, Stamp } from '../ui/Stamp'
import { fmt } from './DepartureBoard'
import { LevelBurst, Pips, StampRing, nudge, useCombo, useMyHype } from './HypeMeter'
import css from './ht.module.css'

const Train3D = lazy(() => import('./Train3D').then((m) => ({ default: m.Train3D })))

const kfmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n))

/** Horizontal carousel with a Twitch-style round "next" button. */
function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const track = useRef<HTMLDivElement>(null)
  return (
    <div className={css.carousel}>
      <div ref={track} className={css.track} role="list" aria-label={label}>
        {children}
      </div>
      <button className={css.next} aria-label={`More ${label.toLowerCase()}`} onClick={() => track.current?.scrollBy({ left: 220, behavior: 'smooth' })}>
        <Icon name="chevron" size={20} />
      </button>
    </div>
  )
}

/**
 * The Hype Train in chat, following Twitch's native pattern: a collapsed progress bar
 * (level · timer · %) that expands into what's left, unlockables, info, and a CTA.
 * Our twist: the bar rides on top of the always-running 3D train, and the unlockables are
 * the event stamp's rim upgrades.
 */
export function HypeTrainBanner({ onOpen, onPassport, paused }: { onOpen: () => void; onPassport: () => void; paused?: boolean }) {
  const { state, contribute, sendChat } = useStation()
  const [open, setOpen] = useState(false)
  // The dropdown fills the space under the bar, so the CTA is always on screen.
  const [room, setRoom] = useState(520)
  // One surface, two gestures: tap the train for the support dropdown, double-tap for the full view.
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onTap = (e: MouseEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.getBoundingClientRect().bottom
    if (tapTimer.current) {
      clearTimeout(tapTimer.current)
      tapTimer.current = undefined
      setOpen(false)
      onOpen()
      return
    }
    tapTimer.current = setTimeout(() => {
      tapTimer.current = undefined
      setRoom(Math.max(260, window.innerHeight - bottom - 12))
      setOpen((o) => !o)
    }, 230)
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setRoom(Math.max(260, window.innerHeight - e.currentTarget.getBoundingClientRect().bottom - 12))
      setOpen((o) => !o)
    }
  }
  const { phase } = state
  const th = themeOf(state)
  const myRole = state.riders[ME_ID]
  const goal = LEVEL_GOALS[state.level - 1]
  const ended = phase === 'arrived' || phase === 'delayed'
  const reached = phase === 'arrived' ? 5 : state.completed
  const mine = state.myBadges.find((b) => b.badgeId === LIVE_BADGE_ID)

  const left = phase === 'running' ? `Lvl ${state.level}` : phase === 'boarding' ? 'Boarding' : ended ? (phase === 'arrived' ? 'Complete' : `Lvl ${reached}`) : ''
  const right = phase === 'running' || phase === 'boarding' ? fmt(state.timeLeft) : null
  const combo = useCombo(state)
  const { pop, total } = useMyHype(state)
  const line = nudge(state, !!myRole, pop, total)
  const hot = phase === 'running' && state.points / goal >= 0.85
  const muted = useMuted()

  const remaining = Math.max(0, goal - state.points)
  const bits = Math.ceil(remaining / KIND_INFO.bits100.points) * 100
  const subs = Math.ceil(remaining / KIND_INFO.sub.points)

  return (
    <div className={`${css.ht} ${css[`t_${phase}`]} ${css[`th_${resolveTheme(state.game, state.themeChoice)}`]} ${open ? css.isOpen : ''}`}>
      <div
        className={`${css.scene} ${hot ? css.hot : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls="ht-drop"
        aria-label={`${th.vehicle} ${left}. ${line}. Tap to support, double-tap for the full view.`}
        onClick={onTap}
        onKeyDown={onKey}
      >
        <Suspense fallback={null}>
          <Train3D state={state} view="strip" paused={paused} />
        </Suspense>

        <div className={css.hud} aria-hidden>
          <StampRing state={state} role={myRole} poke={pop ? Number(pop.key.slice(1)) : 0} />
          <span className={css.barMid}>
            <b>
              {th.emoji} {th.vehicle} <em>{left}</em>
            </b>
            <Pips state={state} />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={line}
                className={`${css.nudge} ${pop ? css.nudgeMe : ''}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {line}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className={css.barRight}>
            {right && <b>{right}</b>}
            <AnimatePresence>
              {combo >= 3 && (
                <motion.span
                  key="combo"
                  className={css.combo}
                  initial={{ scale: 0 }}
                  animate={{ scale: [1.3, 1] }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  🔥 x{combo}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className={css.chev}>
            <Icon name="chevron" size={20} />
          </span>
          <AnimatePresence>
            {pop && (
              <motion.span
                key={pop.key}
                className={css.pop}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: -30, scale: 1 }}
                transition={{ duration: 1.4, times: [0, 0.15, 0.7, 1] }}
              >
                +{pop.points}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <LevelBurst state={state} aboard={!!myRole} />

      <AnimatePresence>
        {open && (
          <motion.div
            id="ht-drop"
            className={css.drop}
            style={{ maxHeight: room }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <div className={css.dropBody}>
              <div className={css.remaining}>
                {phase === 'running' ? (
                  <>
                    <p>
                      <Icon name="bits" size={18} /> {kfmt(bits)} Bits or <Icon name="gift" size={18} /> {subs} Sub{subs === 1 ? '' : 's'}
                    </p>
                    <span>
                      remaining to complete level {state.level} · {stationName(state, state.level - 1)}
                    </span>
                  </>
                ) : phase === 'boarding' ? (
                  <>
                    <p>
                      {BOARDING_NEEDED - state.boarded} more supporter{BOARDING_NEEDED - state.boarded === 1 ? '' : 's'} to depart
                    </p>
                    <span>Sub, gift or cheer to get the {th.vehicle} moving</span>
                  </>
                ) : ended ? (
                  <>
                    <p>{phase === 'arrived' ? `Arrived at ${stationName(state, 4)} 🏁` : `Stopped at ${reached ? stationName(state, reached - 1) : 'the platform'}`}</p>
                    <span>Next departure: Winter Express · Dec 24</span>
                  </>
                ) : (
                  <>
                    <p>The {th.vehicle} is at the station</p>
                    <span>It departs when {BOARDING_NEEDED} people sub, gift or cheer</span>
                  </>
                )}
              </div>

              <h3 className={css.h}>Unlockable Rewards</h3>
              <Carousel label="Rewards">
                {th.rewards.map((reward, i) => {
                  const n = i + 1
                  const done = reached >= n
                  const now = phase === 'running' && state.level === n
                  return (
                    <div key={n} className={`${css.card} ${done ? css.cardDone : now ? css.cardNow : ''}`} role="listitem">
                      <div className={css.cardArt}>
                        {n === 1 ? (
                          <span className={css.emote}>{reward.split(' ')[0]}</span>
                        ) : (
                          <Stamp earned={{ badgeId: LIVE_BADGE_ID, level: n, role: 'rider' }} size={60} still={!done} />
                        )}
                      </div>
                      <span className={css.cardLabel}>{n === 1 ? reward.split(' ').slice(1).join(' ') : n >= 4 ? reward : `${RIM_NAME[n]} rim · ${reward}`}</span>
                      <span className={css.cardStatus}>{done ? '✓ Unlocked' : now ? '✓ Unlock now' : `🔒 Level ${n}`}</span>
                    </div>
                  )
                })}
              </Carousel>

              <h3 className={css.h}>Info</h3>
              <Carousel label="Info">
                {[
                  ['💬', 'Chatting counts. Anyone who chats during the train rides free.'],
                  [th.emoji, `Every rider gets the one-night ${BADGES[LIVE_BADGE_ID].eventName} stamp.`],
                  ['🎁', 'Top gifter gets a Conductor badge on their Hype Pass!'],
                  ['⭐', 'The higher chat climbs, the rarer your stamp’s rim.'],
                ].map(([icon, text]) => (
                  <div key={text} className={css.info} role="listitem">
                    <span>{icon}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </Carousel>

              <button className={css.soundToggle} onClick={() => setMuted(!muted)} aria-pressed={!muted}>
                {muted ? '🔇 Hype sounds off' : '🔊 Hype sounds on'}
              </button>
              <button className={css.stationLink} onClick={onOpen}>
                ⤢ Full {th.vehicle} view · or double-tap the train
              </button>
            </div>

            <footer className={css.foot}>
              {ended ? (
                <div className={css.footRow}>
                  <div className={css.footText}>
                    <strong>{mine ? 'Stamped into your Hype Pass' : 'You missed this one'}</strong>
                    <span>{mine ? `${RIM_NAME[mine.level]} rim · Level ${mine.level}` : 'Catch the next train to earn a stamp'}</span>
                  </div>
                  {mine && <Stamp earned={mine} size={48} />}
                </div>
              ) : (
                <div className={css.footRow}>
                  <div className={css.footText}>
                    <strong>{myRole ? 'You’re aboard ✓' : 'Ride to earn the stamp'}</strong>
                    <span>{myRole ? 'Gift or cheer to push chat to a rarer rim' : 'Chat, Sub, Gift, or Cheer to ride'}</span>
                  </div>
                  <Stamp earned={{ badgeId: LIVE_BADGE_ID, level: Math.max(1, reached), role: myRole ?? 'rider' }} size={48} />
                </div>
              )}
              {ended ? (
                mine && (
                  <button className={css.cta} onClick={onPassport}>
                    View in passport
                  </button>
                )
              ) : (
                <>
                  <button className={css.cta} onClick={() => contribute('gift1')}>
                    <Icon name="gift" size={18} /> Gift 1 sub
                  </button>
                  {!myRole && (
                    <button className={css.ctaGhost} onClick={() => sendChat('ALL ABOARD 🚂')}>
                      💬 Ride free — say “All aboard”
                    </button>
                  )}
                </>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
