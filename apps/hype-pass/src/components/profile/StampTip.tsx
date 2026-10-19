import type { CSSProperties } from 'react'
import { BADGES, ROLE_LABEL } from '../../data/badges'
import type { EarnedBadge } from '../../data/types'
import { RIM_NAME, Stamp } from '../ui/Stamp'
import css from './profile.module.css'

/** A stamp shown bare; its name, date and tier only appear on hover or keyboard focus. */
export function StampTip({
  earned,
  size,
  onOpen,
  place = 'above',
  className,
  style,
}: {
  earned: EarnedBadge
  size?: number
  onOpen?: () => void
  place?: 'above' | 'below'
  className?: string
  style?: CSSProperties
}) {
  const b = BADGES[earned.badgeId]
  return (
    <button
      className={`${css.tipWrap} ${className ?? ''}`}
      style={style}
      onClick={onOpen}
      aria-label={`${b.eventName}, ${RIM_NAME[earned.level]} tier. Open details`}
    >
      <Stamp earned={earned} size={size} />
      <span className={`${css.tip} ${place === 'below' ? css.tipBelow : ''}`} role="tooltip">
        <strong>{b.eventName}</strong>
        <span>
          {b.streamer} · {b.date}
        </span>
        <em>
          {RIM_NAME[earned.level]} · {ROLE_LABEL[earned.role].split(' · ')[0]}
        </em>
      </span>
    </button>
  )
}
