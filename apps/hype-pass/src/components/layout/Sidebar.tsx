import { Icon } from './Icons'
import css from './desktop.module.css'

interface Ch {
  name: string
  game: string
  viewers?: string
  hue: number
}

const FOLLOWED: Ch[] = [
  { name: 'nova_ttv', game: 'Fortnite', viewers: '12.4K', hue: 0 },
  { name: 'cozycait', game: 'Stardew Valley', viewers: '2.1K', hue: 140 },
  { name: 'retrorik', game: 'Retro', viewers: '860', hue: 175 },
  { name: 'LagSwitchLarry', game: 'Just Chatting', viewers: '805', hue: 172 },
  { name: 'mochi_mage', game: 'Dead by Daylight', viewers: '62', hue: 335 },
  { name: 'ByteSizedBea', game: 'Marvel Rivals', hue: 280 },
  { name: 'Gr8Bait', game: 'Minecraft', hue: 44 },
]

const LIVE: Ch[] = [
  { name: 'FrostyFlame', game: 'Rocket League', viewers: '52.4K', hue: 15 },
  { name: 'ChillMaster', game: 'PUBG: BATTLEGROUNDS', viewers: '2.5K', hue: 230 },
  { name: 'SnowyKnight', game: 'Overwatch 2', viewers: '1.6K', hue: 200 },
  { name: 'IceQueen', game: 'Overwatch 2', viewers: '720', hue: 190 },
  { name: 'BlizzardBeast', game: 'Just Chatting', viewers: '140', hue: 160 },
  { name: 'WinterWarrior', game: 'Marvel Rivals', viewers: '352', hue: 300 },
]

function Row({ c }: { c: Ch }) {
  return (
    <li className={css.sideRow}>
      <span
        className={`${css.sideAvatar} ${c.viewers ? '' : css.offline}`}
        style={{ background: `radial-gradient(circle at 30% 25%, hsl(${c.hue} 90% 75%), hsl(${c.hue} 70% 45%))` }}
        aria-hidden
      >
        {c.name[0].toUpperCase()}
      </span>
      <span className={css.sideText}>
        <strong>{c.name}</strong>
        {c.viewers && <span>{c.game}</span>}
      </span>
      {c.viewers ? (
        <span className={css.sideLive}>
          <i /> {c.viewers}
        </span>
      ) : (
        <span className={css.sideOff}>Offline</span>
      )}
    </li>
  )
}

/** Twitch web left rail: followed + recommended live channels. */
export function Sidebar() {
  return (
    <nav className={css.sidebar} aria-label="Channels">
      <div className={css.sideHead}>
        <h2>For You</h2>
        <button className={css.iconBtn} aria-label="Collapse">
          <Icon name="collapseR" />
        </button>
      </div>
      <div className={css.sideSection}>
        <h3>
          Followed Channels
          <Icon name="sort" size={16} />
        </h3>
        <ul>
          {FOLLOWED.map((c) => (
            <Row key={c.name} c={c} />
          ))}
        </ul>
        <a className={css.showMore}>Show More</a>
      </div>
      <div className={css.sideSection}>
        <h3>Live Channels</h3>
        <ul>
          {LIVE.map((c) => (
            <Row key={c.name} c={c} />
          ))}
        </ul>
        <a className={css.showMore}>Show More</a>
      </div>
    </nav>
  )
}
