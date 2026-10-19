import { motion } from 'framer-motion'
import { useState } from 'react'
import { BADGES, ROLE_LABEL } from '../../data/badges'
import type { Clip, EarnedBadge } from '../../data/types'
import { useStation } from '../../state/useStation'
import { RIM, RIM_NAME, Stamp } from '../ui/Stamp'
import css from './profile.module.css'

const LIVE_CLIPS: Clip[] = [
  { id: 'live-1', title: 'The whistle blows — train departs', duration: '0:24', views: 'just now', hue: 30 },
  { id: 'live-2', title: 'Chat floods ALL ABOARD', duration: '0:31', views: 'just now', hue: 280 },
  { id: 'live-3', title: 'Final station reaction', duration: '0:42', views: 'just now', hue: 200 },
]

export function BadgeDetail({
  earned,
  ownerName,
  onBack,
  feature,
}: {
  earned: EarnedBadge
  ownerName: string
  onBack: () => void
  /** Only on your own pass: pin this stamp to the front (max 5). */
  feature?: { on: boolean; full: boolean; toggle: () => void }
}) {
  const b = BADGES[earned.badgeId]
  const { state } = useStation()
  const ended = state.phase === 'arrived' || state.phase === 'delayed'
  const clips = b.live ? (ended ? LIVE_CLIPS : []) : b.clips
  const holders = b.live ? Object.keys(state.riders).length : b.holders
  const [playing, setPlaying] = useState<Clip | null>(null)

  return (
    <div className={css.detail}>
      <button className={css.back} onClick={onBack}>
        ‹ Passport
      </button>

      <div className={css.detailHero} style={{ ['--glow' as string]: b.colors.bg }}>
        <motion.div
          initial={{ scale: 1.6, opacity: 0, rotate: -18 }}
          animate={{ scale: 1, opacity: 1, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
        >
          <Stamp earned={earned} size={168} />
        </motion.div>
      </div>

      <h2 className={css.detailTitle}>{b.eventName}</h2>
      <p className={css.detailMeta}>
        {b.streamer} · {b.date}
      </p>

      <div className={css.chips}>
        <span className={css.chip} style={{ borderColor: RIM[earned.level] }}>
          {RIM_NAME[earned.level]} rim · reached Lv {earned.level}
        </span>
        <span className={css.chip}>{ROLE_LABEL[earned.role]}</span>
        {b.live ? (
          <span className={`${css.chip} ${css.chipLive}`}>● {ended ? 'Just earned' : 'Live now · still earnable'}</span>
        ) : (
          <span className={css.chip}>Retired · can’t be earned again</span>
        )}
      </div>

      {feature && (
        <button
          className={`${css.featureBtn} ${feature.on ? css.featureOn : ''}`}
          onClick={feature.toggle}
          disabled={!feature.on && feature.full}
          aria-pressed={feature.on}
        >
          {feature.on ? '★ Featured on your Hype Pass · remove' : feature.full ? 'Hype Pass is full (5/5) — remove one first' : '☆ Feature on Hype Pass'}
        </button>
      )}

      <p className={css.blurb}>{b.blurb}</p>
      <p className={css.holders}>
        <strong>{holders.toLocaleString()}</strong> riders hold this stamp — {ownerName} is one of them.
      </p>

      <h3 className={css.clipsHead}>Clips from this train</h3>
      {playing && (
        <div className={css.player} style={{ ['--h' as string]: playing.hue }}>
          <span className={css.playerTitle}>{playing.title}</span>
          <motion.span
            key={playing.id}
            className={css.playerBar}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 8, ease: 'linear' }}
          />
        </div>
      )}
      {clips.length ? (
        <div className={css.clips}>
          {clips.map((c) => (
            <button key={c.id} className={css.clip} onClick={() => setPlaying(c)} aria-label={`Play clip: ${c.title}`}>
              <span className={css.thumb} style={{ ['--h' as string]: c.hue }}>
                <span className={css.play}>▶</span>
                <span className={css.dur}>{c.duration}</span>
              </span>
              <span className={css.clipTitle}>{c.title}</span>
              <span className={css.clipViews}>{c.views} views</span>
            </button>
          ))}
        </div>
      ) : (
        <p className={css.noClips}>Clips show up here once this train reaches its final station.</p>
      )}
    </div>
  )
}
