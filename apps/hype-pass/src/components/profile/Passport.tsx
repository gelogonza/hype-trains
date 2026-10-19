import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { BADGES, STREAMER } from '../../data/badges'
import type { EarnedBadge, Viewer } from '../../data/types'
import { ChatBadge, stampSpan } from '../ui/Stamp'
import { StampTip } from './StampTip'
import css from './profile.module.css'
import { stationCode, tilt } from './util'

interface Page {
  channel: string
  stamps: EarnedBadge[]
}

/** One visa page per channel; this channel first, Twitch-wide stamps last. */
function toPages(badges: EarnedBadge[]): Page[] {
  const by = new Map<string, EarnedBadge[]>()
  for (const b of badges) {
    const ch = BADGES[b.badgeId].streamer
    by.set(ch, [...(by.get(ch) ?? []), b])
  }
  const order = (ch: string) => (ch === STREAMER ? -1 : ch === 'twitch' ? 1 : 0)
  const pages = [...by.entries()].sort((a, b) => order(a[0]) - order(b[0])).map(([channel, stamps]) => ({ channel, stamps }))
  return pages.length ? pages : [{ channel: STREAMER, stamps: [] }]
}

/** Back of the Hype Pass: passport visa pages, a collage of stamps per channel. */
export function Passport({
  viewer,
  badges,
  onFlip,
  onOpen,
  highlight,
}: {
  viewer: Viewer
  badges: EarnedBadge[]
  onFlip: () => void
  onOpen: (b: EarnedBadge) => void
  highlight?: string
}) {
  const pages = useMemo(() => toPages(badges), [badges])
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const current = pages[Math.min(page, pages.length - 1)]
  const go = (p: number) => {
    if (p < 0 || p >= pages.length || p === page) return
    setDir(p > page ? 1 : -1)
    setPage(p)
  }

  return (
    <div className={css.passport} aria-label={`${viewer.name}’s passport`}>
      <div className={css.passportHead}>
        <span>PASSPORT · VISAS</span>
        <span className="mono">
          {page + 1}/{pages.length}
        </span>
      </div>

      <div className={css.book}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.section
            key={current.channel}
            className={css.page}
            custom={dir}
            variants={{
              enter: (d: number) => (d > 0 ? { rotateY: 0, opacity: 0, x: 24 } : { rotateY: -110, opacity: 1, x: 0 }),
              center: { rotateY: 0, opacity: 1, x: 0 },
              exit: (d: number) => (d > 0 ? { rotateY: -110, opacity: 1, zIndex: 2 } : { opacity: 0, x: 24, zIndex: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.3, 0.7, 0.2, 1] }}
            aria-label={`${current.channel} visa page`}
          >
            <div className={css.watermark} aria-hidden>
              {stationCode(current.channel)}
            </div>
            <header className={css.visa}>
              <b className="mono">{stationCode(current.channel)}</b>
              <div>
                <small>{current.channel === 'twitch' ? 'TWITCH-WIDE' : 'ENTRY VISA'}</small>
                <strong>{current.channel}</strong>
              </div>
              <span>
                {current.stamps.length} stamp{current.stamps.length === 1 ? '' : 's'}
              </span>
            </header>

            <div className={css.collage} style={{ ['--cols' as string]: current.stamps.length <= 4 ? 4 : 6 }}>
              {current.stamps.map((b, i) => {
                const [c, r] = stampSpan(b)
                const t = tilt(b.badgeId + i)
                const fresh = highlight === b.badgeId
                return (
                  <motion.div
                    key={b.badgeId}
                    className={css.slot}
                    style={{ gridColumn: `span ${c}`, gridRow: `span ${r}`, rotate: t }}
                    whileHover={{ scale: 1.06, rotate: 0, zIndex: 3 }}
                    whileTap={{ scale: 0.94 }}
                    initial={fresh ? { scale: 2.4, opacity: 0, rotate: t - 25 } : false}
                    animate={{ scale: 1, opacity: 1, rotate: t }}
                    transition={fresh ? { type: 'spring', stiffness: 520, damping: 17, delay: 0.5 } : undefined}
                  >
                    <StampTip earned={b} onOpen={() => onOpen(b)} place="below" className={css.slotTip} />
                  </motion.div>
                )
              })}
              {Array.from({ length: Math.max(1, 3 - current.stamps.length) }, (_, i) => (
                <div key={`e${i}`} className={css.slotEmpty}>
                  <span>next stop?</span>
                </div>
              ))}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <nav className={css.tabs} aria-label="Passport pages">
        {pages.map((p, i) => (
          <button key={p.channel} className={i === page ? css.tabOn : undefined} onClick={() => go(i)} aria-current={i === page}>
            {p.stamps[0] && <ChatBadge earned={p.stamps[0]} />}
            <span className="mono">{stationCode(p.channel)}</span>
          </button>
        ))}
        <button className={css.flipBack} onClick={onFlip}>
          ↻ Ticket
        </button>
      </nav>
    </div>
  )
}
