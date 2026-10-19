import { useId } from 'react'
import { BADGES } from '../../data/badges'
import type { BadgeDef, EarnedBadge } from '../../data/types'
import { Motif } from './Motif'
import { SHAPES, type ShapeGeo } from './stampShapes'
import css from './stamp.module.css'

export const RIM = ['var(--rim-1)', 'var(--rim-1)', 'var(--rim-2)', 'var(--rim-3)', 'var(--rim-4)', 'var(--rim-5)']
export const RIM_NAME = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Legend']

/** Level 5 rides earn a bigger stamp on the page. */
export function stampSpan(earned: EarnedBadge): [number, number] {
  const geo = SHAPES[BADGES[earned.badgeId].shape]
  if (earned.level >= 5 && geo.span[0] === 2 && geo.span[1] === 2) return [3, 3]
  return geo.span
}

export function stampAspect(badgeId: string) {
  const g = SHAPES[BADGES[badgeId].shape]
  return g.w / g.h
}

function motifAt(g: ShapeGeo, b: BadgeDef, cls?: string) {
  const { x, y, s } = g.motif
  return (
    <g className={cls}>
      <g transform={`translate(${x - 32 * s} ${y - 32 * s}) scale(${s})`}>
        <Motif name={b.motif} color={b.colors.ink} />
      </g>
    </g>
  )
}

function Pips({ x, y, level, ink }: { x: number; y: number; level: number; ink: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <circle key={n} cx={(n - 3) * 6} cy="0" r="2" fill={ink} opacity={n <= level ? 0.9 : 0.22} />
      ))}
    </g>
  )
}

/** Text that always fits its box. */
function Fit({ x, y, w, size, children, ink, weight = 800, anchor = 'middle' }: {
  x: number
  y: number
  w: number
  size: number
  children: string
  ink: string
  weight?: number
  anchor?: 'middle' | 'start'
}) {
  const natural = children.length * size * 0.62
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      fill={ink}
      textAnchor={anchor}
      letterSpacing="0.06em"
      fontFamily="var(--font)"
      {...(natural > w ? { textLength: w, lengthAdjust: 'spacingAndGlyphs' } : {})}
    >
      {children}
    </text>
  )
}

interface Props {
  earned: EarnedBadge
  /** Rendered height in px. Omit to fill the parent box. */
  size?: number
  /** Turn motion off (tiny previews, lists). */
  still?: boolean
}

/** A collectible event stamp: its own silhouette, colors, motif and (optionally) motion. */
export function Stamp({ earned, size, still }: Props) {
  const b = BADGES[earned.badgeId]
  const g = SHAPES[b.shape]
  const uid = useId().replace(/:/g, '')
  const rim = RIM[earned.level]
  const anim = still ? 'none' : b.anim
  const foil = !still && earned.level >= 4
  const ink = b.colors.ink
  const cx = g.w / 2
  const cy = g.h / 2
  const name = b.eventName.toUpperCase()
  const clip = `clip-${uid}`

  return (
    <svg
      viewBox={`-4 -4 ${g.w + 8} ${g.h + 8}`}
      width={size ? (size * (g.w + 8)) / (g.h + 8) : '100%'}
      height={size ?? '100%'}
      role="img"
      aria-label={`${b.eventName} stamp, ${RIM_NAME[earned.level]}${anim !== 'none' ? ', animated' : ''}`}
      className={`${css.stamp} ${css[`anim_${anim}`] ?? ''}`}
      overflow="visible"
    >
      <defs>
        <clipPath id={clip}>
          <path d={g.d} />
        </clipPath>
        {b.shape === 'postage' && (
          <mask id={`perf-${uid}`}>
            <rect x="-4" y="-4" width={g.w + 8} height={g.h + 8} fill="#fff" />
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i} fill="#000">
                <circle cx={2 + i * 10} cy="2" r="3.4" />
                <circle cx={2 + i * 10} cy="126" r="3.4" />
              </g>
            ))}
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i} fill="#000">
                <circle cx="2" cy={2 + i * 10.3} r="3.4" />
                <circle cx="102" cy={2 + i * 10.3} r="3.4" />
              </g>
            ))}
          </mask>
        )}
        <linearGradient id={`foil-${uid}`} x1="0" x2="1" y1="0" y2="0.3">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#ffd6ff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#c6fff6" stopOpacity="0.8" />
          <stop offset="0.55" stopColor="#fff2b0" stopOpacity="0.55" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`}>
          <stop offset="0" stopColor="#fff6c0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6c0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g mask={b.shape === 'postage' ? `url(#perf-${uid})` : undefined}>
        {/* drop shadow + body */}
        <path d={g.d} fill="#0003" transform="translate(1.5 3)" />
        <g className={b.shape === 'burst' ? css.spinTarget : undefined}>
          <path d={g.d} fill={b.colors.bg} stroke={rim} strokeWidth="5" strokeLinejoin="round" />
        </g>

        <g clipPath={`url(#${clip})`}>
          {/* paper grain */}
          <path d={g.d} fill="none" stroke={ink} strokeOpacity=".22" strokeWidth="1.6" strokeDasharray="3 3" transform={`translate(${cx} ${cy}) scale(.86) translate(${-cx} ${-cy})`} />
          {anim === 'flicker' && <circle className={css.glow} cx={g.motif.x} cy={g.motif.y} r={30} fill={`url(#glow-${uid})`} />}
          {anim === 'snow' &&
            Array.from({ length: 12 }, (_, i) => (
              <circle
                key={i}
                className={css.flake}
                cx={(i * 37) % g.w}
                cy={-6}
                r={1.4 + (i % 3)}
                fill="#fff"
                style={{ animationDelay: `${(i * 0.37) % 3}s`, animationDuration: `${2.6 + (i % 4) * 0.5}s`, ['--fall' as string]: `${g.h + 12}px` }}
              />
            ))}
        </g>

        {/* motif */}
        {motifAt(g, b, anim === 'float' ? css.float : anim === 'pulse' ? css.pulse : anim === 'flicker' ? css.flicker : undefined)}

        {anim === 'twinkle' &&
          [
            [22, 30, 0],
            [g.w - 24, 36, 0.6],
            [g.w - 30, g.h - 50, 1.2],
            [28, g.h - 56, 1.8],
          ].map(([x, y, d], i) => (
            <path
              key={i}
              className={css.sparkle}
              style={{ animationDelay: `${d}s` }}
              d={`M${x} ${y - 7}Q${x} ${y} ${x + 7} ${y}Q${x} ${y} ${x} ${y + 7}Q${x} ${y} ${x - 7} ${y}Q${x} ${y} ${x} ${y - 7}Z`}
              fill="#fff"
            />
          ))}

        {/* labels */}
        {g.label === 'arc' && (
          <g className={anim === 'spin' ? css.spinTarget : undefined}>
            <path id={`arc-${uid}`} d={`M${cx} ${cy}m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0`} fill="none" />
            <text fontSize="9" fontWeight="800" letterSpacing="1.2" fill={ink} fontFamily="var(--font)">
              <textPath href={`#arc-${uid}`}>{`${name} · ${b.streamer.toUpperCase()} · ${b.date.toUpperCase()} ·`}</textPath>
            </text>
          </g>
        )}
        {g.label === 'arc' && <Pips x={cx} y={cy + 30} level={earned.level} ink={ink} />}

        {g.label === 'ribbon' && g.ribbon && (
          <g>
            <rect x={cx - g.ribbon.w / 2} y={g.ribbon.y - 9} width={g.ribbon.w} height="15" rx="3" fill={ink} />
            <Fit x={cx} y={g.ribbon.y + 2} w={g.ribbon.w - 10} size={8.5} ink={b.colors.bg}>
              {name}
            </Fit>
            <Pips x={cx} y={g.ribbon.y + 15} level={earned.level} ink={ink} />
          </g>
        )}

        {g.label === 'postage' && (
          <g>
            <rect x="10" y="10" width="84" height="88" rx="2" fill="none" stroke={ink} strokeOpacity=".35" />
            <text x="88" y="24" fontSize="11" fontWeight="900" textAnchor="end" fill={ink} fontFamily="var(--mono)">
              L{earned.level}
            </text>
            <Fit x={52} y={110} w={84} size={9} ink={ink}>
              {name}
            </Fit>
            <Fit x={52} y={120} w={84} size={7} ink={ink} weight={600}>
              {`${b.streamer} · ${b.date}`}
            </Fit>
          </g>
        )}

        {g.label === 'poster' && (
          <g>
            <Fit x={55} y={124} w={84} size={12} ink={ink} weight={900}>
              {name}
            </Fit>
            <Fit x={55} y={138} w={80} size={7.5} ink={ink} weight={600}>
              {`${b.streamer} · ${b.date}`.toUpperCase()}
            </Fit>
            <Pips x={55} y={152} level={earned.level} ink={ink} />
          </g>
        )}

        {g.label === 'ticket' && (
          <g>
            <line x1="100" y1="14" x2="100" y2="98" stroke={ink} strokeOpacity=".35" strokeDasharray="4 3" />
            <Fit x={112} y={42} w={96} size={14} ink={ink} weight={900} anchor="start">
              {name}
            </Fit>
            <Fit x={112} y={58} w={96} size={8} ink={ink} weight={600} anchor="start">
              {`${b.streamer} · ${b.date}`.toUpperCase()}
            </Fit>
            <text x="112" y="80" fontSize="8" fontWeight="900" fill={ink} fontFamily="var(--mono)" letterSpacing="1">
              ADMIT ONE · LV {earned.level}
            </text>
            <Pips x={130} y={93} level={earned.level} ink={ink} />
          </g>
        )}

        {/* foil sheen on high-level stamps */}
        {foil && (
          <g clipPath={`url(#${clip})`} style={{ mixBlendMode: 'screen' }}>
            <rect className={css.foil} x={-g.w} y="-10" width={g.w * 2} height={g.h + 20} fill={`url(#foil-${uid})`} />
          </g>
        )}
      </g>
    </svg>
  )
}

/** Tiny chat-badge version: silhouette + motif, no text, no motion. */
export function ChatBadge({ earned }: { earned: EarnedBadge }) {
  const b = BADGES[earned.badgeId]
  const g = SHAPES[b.shape]
  const s = Math.min(g.w, g.h) / 64
  return (
    <svg viewBox={`-4 -4 ${g.w + 8} ${g.h + 8}`} height="18" width={(18 * (g.w + 8)) / (g.h + 8)} aria-label={`${b.eventName} badge`} role="img">
      <path d={g.d} fill={b.colors.bg} stroke={RIM[earned.level]} strokeWidth="9" strokeLinejoin="round" />
      <g transform={`translate(${g.w / 2 - 32 * s * 0.7} ${g.h / 2 - 32 * s * 0.7}) scale(${s * 0.7})`}>
        <Motif name={b.motif} color={b.colors.ink} />
      </g>
    </svg>
  )
}
