import { useEffect, useState } from 'react'
import { STREAMER } from '../../data/badges'
import { GAMES } from '../../data/themes'
import { themeOf } from '../../state/station'
import { useStation } from '../../state/useStation'
import { Icon } from './Icons'
import css from './layout.module.css'

const STARTED = Date.now() - (8 * 3600 + 27 * 60 + 44) * 1000

function useUptime() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.floor((now - STARTED) / 1000)
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Channel info bar: compact row on phones, the full Twitch web header on desktop. */
export function ChannelHeader() {
  const { state } = useStation()
  const game = GAMES[state.game]
  const uptime = useUptime()
  const [following, setFollowing] = useState(false)

  return (
    <div className={css.channel}>
      <span className={css.channelAvatar} aria-hidden>
        P<b>LIVE</b>
      </span>
      <strong className={css.chName}>
        {STREAMER}
        <span className={css.verified}>
          <Icon name="verified" size={16} title="Verified" />
        </span>
      </strong>
      <span className={css.mobileMeta}>
        {game.name} · {themeOf(state).stamp.eventName} {themeOf(state).emoji}
      </span>
      <div className={css.btnRow}>
        <button className={`${css.follow} ${following ? css.following : ''}`} onClick={() => setFollowing((f) => !f)}>
          <Icon name="heart" size={18} /> <span>{following ? 'Following' : 'Follow'}</span>
        </button>
        <button className={css.ghostBtn}>
          <Icon name="gift" size={18} /> Gift a Sub <Icon name="chevron" size={16} />
        </button>
        <button className={css.ghostBtn}>
          <Icon name="star" size={18} /> Subscribe <Icon name="chevron" size={16} />
        </button>
      </div>
      <p className={css.title}>{game.title}</p>
      <div className={css.statsRow}>
        <span className={css.viewerCount}>
          <Icon name="person" size={18} /> 4,812
        </span>
        <span className={css.uptime}>{uptime}</span>
        <button className={css.iconBtnSm} aria-label="Share">
          <Icon name="share" size={18} />
        </button>
        <button className={css.iconBtnSm} aria-label="More options">
          <Icon name="dots" size={18} />
        </button>
      </div>
      <div className={css.meta}>
        <a className={css.category}>{game.name}</a>
        <span className={css.tag}>English</span>
        <span className={css.tag}>HypeTrain</span>
      </div>
    </div>
  )
}

/** "About" panel under the player. Desktop only. */
export function About() {
  return (
    <section className={css.about} aria-label={`About ${STREAMER}`}>
      <h2>
        About {STREAMER}
        <span className={css.verified}>
          <Icon name="verified" size={18} />
        </span>
      </h2>
      <div className={css.aboutCard}>
        <p className={css.followers}>
          <b>312K</b> followers
        </p>
        <p>
          Cozy-chaotic horror + battle royale streams. Every Hype Train is its own one-night event with a stamp you
          can only get by riding it. Tap a name in chat to see their Hype Pass.
        </p>
        <div className={css.socials}>
          <a>𝕏 @pixelpilot</a>
          <a>◎ @pixelpilot</a>
          <a>♪ @pixelpilot.tv</a>
          <a>▶ /pixelpilot</a>
          <a>
            <Icon name="link" size={16} /> pixelpilot.gg
          </a>
        </div>
      </div>
    </section>
  )
}
