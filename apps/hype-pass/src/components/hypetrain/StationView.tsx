import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { BADGES, LIVE_BADGE_ID, ROLE_LABEL } from '../../data/badges'
import { THEMES, resolveTheme } from '../../data/themes'
import { ME_ID, VIEWER_BY_ID } from '../../data/viewers'
import { BOARDING_NEEDED, FREE_CAP, KIND_INFO, LEVEL_GOALS, rewardFor, stationName, themeOf, type Kind } from '../../state/station'
import { useStation } from '../../state/useStation'
import { Avatar } from '../ui/Avatar'
import { Sheet } from '../ui/Sheet'
import { Stamp } from '../ui/Stamp'
import { DepartureBoard, fmt } from './DepartureBoard'
import { Finale } from './Finale'
import css from './hypetrain.module.css'

const Train3D = lazy(() => import('./Train3D').then((m) => ({ default: m.Train3D })))

const TICKETS: { kind: Kind; title: string; price: string; tag?: string }[] = [
  { kind: 'chat', title: 'All aboard', price: 'Free · chat' },
  { kind: 'bits100', title: '100 Bits', price: '$1.40' },
  { kind: 'bits500', title: '500 Bits', price: '$7.00' },
  { kind: 'sub', title: 'Subscribe', price: '$5.99' },
  { kind: 'gift5', title: 'Gift 5 Subs', price: '$29.95', tag: 'Conductor' },
]

export function StationView({ open, onClose, onOpenPassport }: { open: boolean; onClose: () => void; onOpenPassport: () => void }) {
  const { state, contribute, sendChat, dispatch } = useStation()
  const { phase } = state
  const myRole = state.riders[ME_ID]
  const goal = LEVEL_GOALS[state.level - 1]
  const paidPct = Math.min(100, ((state.points - state.freePoints) / goal) * 100)
  const freePct = Math.min(100 - paidPct, (state.freePoints / goal) * 100)
  const riders = Object.keys(state.riders).length + state.contribs * 3
  const ended = phase === 'arrived' || phase === 'delayed'

  const rows =
    phase === 'running'
      ? [
          { label: 'NOW', value: `Lv ${state.level} ${stationName(state, state.level - 1)}`, time: fmt(state.timeLeft) },
          { label: 'UNLOCK', value: rewardFor(state, state.level - 1) },
        ]
      : phase === 'boarding'
        ? [
            { label: 'BOARDING', value: `${state.boarded}/${BOARDING_NEEDED} supporters`, time: fmt(state.timeLeft) },
            { label: 'DEST', value: stationName(state, 4) },
          ]
        : phase === 'idle'
          ? [
              { label: 'PLATFORM', value: themeOf(state).stamp.eventName, time: '--:--' },
              { label: 'STATUS', value: 'Awaiting supporters' },
            ]
          : [
              { label: phase === 'arrived' ? 'ARRIVED' : 'DELAYED', value: stationName(state, Math.max(0, state.completed - 1)) },
              { label: 'NEXT', value: 'Winter Express · Dec 24' },
            ]

  const send = (k: Kind) => (k === 'chat' ? sendChat('ALL ABOARD 🚂') : contribute(k))

  return (
    <Sheet open={open} onClose={onClose} label="Hype Train Station" tone="station" tall>
      <div className={css.station}>
        <header className={css.stationHead}>
          <span className={css.stationKicker}>
            {themeOf(state).emoji} {themeOf(state).vehicle} · {themeOf(state).label} scene
            {state.themeChoice !== 'auto' || state.backdrop ? ' · set by pixelpilot' : ' · matches the game'}
          </span>
          <h2>
            {themeOf(state).stamp.eventName} <span className={css.headLv}>{ended ? 'Final' : `Lv ${state.level}`}</span>
          </h2>
          <div className={css.scenePick} role="radiogroup" aria-label="Scene (set by the streamer — preview)">
            <span>Scene · streamer’s pick (preview)</span>
            {(['spooky', 'battle'] as const).map((id) => (
              <button
                key={id}
                role="radio"
                aria-checked={resolveTheme(state.game, state.themeChoice) === id}
                className={resolveTheme(state.game, state.themeChoice) === id ? css.sceneOn : undefined}
                onClick={() => dispatch({ type: 'setChannel', themeChoice: id, game: id === 'battle' ? 'fortnite' : 'hollow' })}
              >
                {THEMES[id].emoji} {THEMES[id].label}
              </button>
            ))}
          </div>
        </header>

        <div className={css.hero} aria-label="3D view of the Hype Train looping the station">
          <Suspense fallback={null}>{open && <Train3D state={state} view="hero" />}</Suspense>
        </div>
        <DepartureBoard rows={rows} />

        {phase === 'running' && (
          <div className={css.meter} aria-label={`Level ${state.level} progress`}>
            <div className={css.meterBar}>
              <motion.span className={css.meterPaid} animate={{ width: `${paidPct}%` }} />
              <motion.span className={css.meterFree} animate={{ width: `${freePct}%` }} />
              <span className={css.meterCap} style={{ left: `${FREE_CAP * 100}%` }} title="Free hype can fill up to here" />
            </div>
            <div className={css.meterLegend}>
              <span>
                <i className={css.dotPaid} /> Bits & subs
              </span>
              <span>
                <i className={css.dotFree} /> Free chat hype
              </span>
              <span className="mono">
                {Math.floor(state.points)}/{goal}
              </span>
            </div>
          </div>
        )}

        {ended ? (
          <Finale onOpenPassport={onOpenPassport} />
        ) : (
          <>
            <div className={css.aboard}>
              <div className={css.prize}>
                <Stamp earned={{ badgeId: LIVE_BADGE_ID, level: Math.max(1, state.completed), role: myRole ?? 'rider' }} size={64} />
                <div>
                  <strong>{myRole ? 'You’re aboard ✓' : 'Ride to earn this stamp'}</strong>
                  <span>
                    {myRole
                      ? `${ROLE_LABEL[myRole]}. Your rim upgrades with every station.`
                      : `${BADGES[LIVE_BADGE_ID].eventName} is a one-night stamp. Chatting counts.`}
                  </span>
                </div>
              </div>
              <span className={css.riders}>
                <b>{riders}</b> riders
              </span>
            </div>

            <div className={css.tickets}>
              {TICKETS.map((t) => (
                <motion.button
                  key={t.kind}
                  className={`${css.ticketBtn} ${t.kind === 'chat' ? css.ticketFree : ''} ${t.tag ? css.ticketHero : ''}`}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => send(t.kind)}
                >
                  {t.tag && <span className={css.ticketTag}>{t.tag}</span>}
                  <strong>{t.title}</strong>
                  <span>{t.price}</span>
                  <em>+{KIND_INFO[t.kind].points} hype</em>
                </motion.button>
              ))}
            </div>
            <p className={css.fine}>
              {phase === 'idle' || phase === 'boarding'
                ? `The train departs when ${BOARDING_NEEDED} people support. Free chat hype counts you aboard but can’t fill a level on its own.`
                : 'Prototype: no real purchases are made.'}
            </p>
          </>
        )}

        {state.feed.length > 0 && (
          <ul className={css.feed} aria-label="Recent contributions">
            <AnimatePresence initial={false} mode="popLayout">
              {state.feed.slice(0, 6).map((c) => {
                const v = VIEWER_BY_ID[c.viewerId]
                return (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={c.viewerId === ME_ID ? css.feedMe : undefined}
                  >
                    <Avatar viewer={v} size={22} />
                    <span className={css.feedText}>
                      <b style={{ color: v.color }}>{v.name}</b> {KIND_INFO[c.kind].verb}
                    </span>
                    <em>+{c.points}</em>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Sheet>
  )
}
