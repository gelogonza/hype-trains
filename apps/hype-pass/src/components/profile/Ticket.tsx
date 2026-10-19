import { BADGES, STREAMER } from '../../data/badges'
import type { ReactNode } from 'react'
import type { EarnedBadge, Role, Viewer } from '../../data/types'
import { Avatar } from '../ui/Avatar'
import { MAX_FEATURED } from '../../state/station'
import { ChatBadge, RIM_NAME } from '../ui/Stamp'
import { StampTip } from './StampTip'
import css from './profile.module.css'
import { stationCode, ticketNo } from './util'

const CARRIAGE = ['Free Rider', 'Tier 1', 'Tier 2', 'Tier 3']
const CLASS: Record<Role, string> = { rider: 'Rider', cheerer: 'Cheerer', subscriber: 'Passenger', conductor: 'Conductor' }
const RANK: Role[] = ['rider', 'cheerer', 'subscriber', 'conductor']
const HOLES = 12

function Barcode({ seed }: { seed: string }) {
  const bars = Array.from({ length: 30 }, (_, i) => ((seed.charCodeAt(i % seed.length) * (i + 3)) % 4) + 1)
  return (
    <div className={css.barcode} aria-hidden>
      {bars.map((w, i) => (
        <span key={i} style={{ width: w, marginRight: i % 3 === 0 ? 2 : 1 }} />
      ))}
    </div>
  )
}

/** Passport-style machine readable zone. */
function mrz(v: Viewer, stamps: number) {
  const pad = (s: string, n: number) => (s + '<'.repeat(n)).slice(0, n)
  const name = v.name.toUpperCase().replace(/[^A-Z0-9]/g, '<')
  const l1 = pad(`P<HYP${stationCode(STREAMER)}<<${name}<<`, 36)
  const l2 = pad(`${ticketNo(v.name).replace(' ', '')}<${String(stamps).padStart(2, '0')}STMP<${v.memberSince.replace(' ', '').toUpperCase()}`, 36)
  return [l1, l2]
}

/** Front of the Hype Pass: a holo boarding pass. */
export function Ticket({
  viewer,
  badges,
  featured,
  isMe,
  onFlip,
  onOpenStamp,
  actions,
}: {
  viewer: Viewer
  badges: EarnedBadge[]
  featured: EarnedBadge[]
  isMe?: boolean
  onFlip: () => void
  onOpenStamp?: (b: EarnedBadge) => void
  actions?: ReactNode
}) {
  const feat = featured[0]
  const featDef = feat && BADGES[feat.badgeId]
  const best = badges.reduce<Role | null>((r, b) => (!r || RANK.indexOf(b.role) > RANK.indexOf(r) ? b.role : r), null)
  const channels = new Set(badges.map((b) => BADGES[b.badgeId].streamer)).size
  const [l1, l2] = mrz(viewer, badges.length)

  return (
    <article className={css.ticket} style={{ ['--feat' as string]: featDef?.colors.bg ?? 'var(--violet-400)' }}>
      <div className={css.sheen} aria-hidden />

      <header className={css.ticketHead}>
        <span className={css.brand}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path fill="currentColor" d="M4 2h16v14l-4 4H4zm4 4v6h2V6zm5 0v6h2V6zM5 22l3-3h2l-3 3z" />
          </svg>
          <span>
            HYPE PASS
            <small>{best ? `${CLASS[best]} class` : 'New rider'}</small>
          </span>
        </span>
        <span className={css.admit}>
          <b>ADMIT ONE</b>
          <span className="mono">{ticketNo(viewer.name)}</span>
        </span>
      </header>

      <div className={css.ticketBody}>
        <div className={css.passenger}>
          <div className={css.photo}>
            <Avatar viewer={viewer} size={68} />
            {feat && (
              <span className={css.photoSeal}>
                <ChatBadge earned={feat} />
              </span>
            )}
          </div>
          <div className={css.who}>
            <small>PASSENGER</small>
            <strong>{viewer.name}</strong>
            <span>
              {CARRIAGE[viewer.subTier]} · since {viewer.memberSince}
            </span>
          </div>
        </div>

        <div className={css.route}>
          <div>
            <small>FROM</small>
            <b className="mono">{stationCode(viewer.homeChannel)}</b>
          </div>
          <div className={css.routeLine} aria-hidden>
            <i />
            <span>🚂</span>
            <i />
          </div>
          <div className={css.routeTo}>
            <small>TO</small>
            <b className="mono">{stationCode(STREAMER)}</b>
          </div>
        </div>

        <section className={css.showcase} aria-label="Featured stamps">
          <small>
            FEATURED · {featured.length}/{MAX_FEATURED}
          </small>
          <div className={css.showRow}>
            {featured.map((b) => (
              <StampTip key={b.badgeId} earned={b} size={50} onOpen={() => onOpenStamp?.(b)} />
            ))}
            {isMe && Array.from({ length: MAX_FEATURED - featured.length }, (_, i) => <span key={i} className={css.showEmpty} title="Feature a stamp from its details in your passport">+</span>)}
            {!featured.length && !isMe && <p className={css.showNone}>No stamps yet — ride a Hype Train to earn one.</p>}
          </div>
        </section>

        <div className={css.punch}>
          <small>RIDES</small>
          <div className={css.holes} aria-label={`${viewer.trainsRidden} trains ridden`}>
            {Array.from({ length: HOLES }, (_, i) => (
              <i key={i} className={i < viewer.trainsRidden ? css.punched : undefined} />
            ))}
          </div>
          <b>{viewer.trainsRidden > HOLES ? `+${viewer.trainsRidden - HOLES}` : viewer.trainsRidden}</b>
        </div>

        <dl className={css.facts}>
          <div>
            <dt>STAMPS</dt>
            <dd>{badges.length}</dd>
          </div>
          <div>
            <dt>CHANNELS</dt>
            <dd>{channels}</dd>
          </div>
          <div>
            <dt>BEST RIM</dt>
            <dd>{feat ? RIM_NAME[Math.max(...badges.map((b) => b.level))] : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className={css.perforation} aria-hidden />

      <footer className={css.stub}>
        <div className={css.mrz} aria-hidden>
          <span>{l1}</span>
          <span>{l2}</span>
        </div>
        {actions && <div className={css.cardActions}>{actions}</div>}
        <Barcode seed={viewer.name} />
        <button className={css.flipBtn} onClick={onFlip}>
          Open passport ↻
        </button>
      </footer>
    </article>
  )
}
