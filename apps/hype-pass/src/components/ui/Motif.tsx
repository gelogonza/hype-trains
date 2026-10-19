import type { Motif as MotifName } from '../../data/types'

/** Simple glyphs drawn into a 64×64 box, centered at 32,32. */
export function Motif({ name, color }: { name: MotifName; color: string }) {
  const s = { fill: color, stroke: color }
  switch (name) {
    case 'pumpkin':
      return (
        <g>
          <path d="M32 18c2-6 6-8 9-8" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="22" cy="36" rx="11" ry="15" {...s} />
          <ellipse cx="42" cy="36" rx="11" ry="15" {...s} />
          <ellipse cx="32" cy="36" rx="11" ry="16" {...s} />
          <path d="M23 31l5 5h-8zM41 31l5 5h-8z" fill="#fff8" />
          <path d="M22 42q10 7 20 0l-3 4-3-2-4 3-3-3-3 2z" fill="#fff8" />
        </g>
      )
    case 'snowflake':
      return (
        <g stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none">
          {[0, 60, 120].map((r) => (
            <g key={r} transform={`rotate(${r} 32 32)`}>
              <path d="M32 10v44M32 16l-6-6M32 16l6-6M32 48l-6 6M32 48l6 6" />
            </g>
          ))}
        </g>
      )
    case 'heart':
      return <path d="M32 52S12 39 12 25a10 10 0 0 1 20-3 10 10 0 0 1 20 3c0 14-20 27-20 27z" {...s} />
    case 'rocket':
      return (
        <g>
          <path d="M32 8c9 8 12 18 10 32H22C20 26 23 16 32 8z" {...s} />
          <path d="M22 32l-8 10 8 2zM42 32l8 10-8 2z" {...s} />
          <path d="M27 44h10l-5 12z" fill="#fff9" />
          <circle cx="32" cy="24" r="4.5" fill="#fff9" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M12 46l-2-24 12 10 10-16 10 16 12-10-2 24z" {...s} strokeLinejoin="round" />
          <rect x="12" y="48" width="40" height="6" rx="2" {...s} />
        </g>
      )
    case 'controller':
      return (
        <g>
          <path d="M18 22h28c8 0 12 8 12 18 0 8-6 10-10 6l-6-6H22l-6 6c-4 4-10 2-10-6 0-10 4-18 12-18z" {...s} />
          <path d="M20 30v8M16 34h8" stroke="#fff9" strokeWidth="3" strokeLinecap="round" />
          <circle cx="42" cy="31" r="2.5" fill="#fff9" />
          <circle cx="47" cy="36" r="2.5" fill="#fff9" />
        </g>
      )
    case 'flame':
      return (
        <g>
          <path d="M32 8c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 4-12 8-16 0 6 2 9 5 10-2-10 1-17 3-24z" {...s} />
          <path d="M32 34c3 4 7 6 7 11a7 7 0 0 1-14 0c0-4 4-6 7-11z" fill="#fff9" />
        </g>
      )
    case 'star':
      return <path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2z" {...s} strokeLinejoin="round" />
    case 'train':
      return (
        <g>
          <rect x="16" y="10" width="32" height="36" rx="8" {...s} />
          <rect x="21" y="16" width="22" height="12" rx="3" fill="#fff9" />
          <circle cx="23" cy="37" r="3" fill="#fff9" />
          <circle cx="41" cy="37" r="3" fill="#fff9" />
          <path d="M20 46l-6 10M44 46l6 10" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </g>
      )
    case 'bus':
      return (
        <g>
          <ellipse cx="32" cy="17" rx="15" ry="13" {...s} />
          <path d="M22 26l-4 10M42 26l4 10" stroke={color} strokeWidth="2.5" />
          <rect x="10" y="34" width="44" height="20" rx="4" {...s} />
          <rect x="14" y="38" width="30" height="7" rx="2" fill="#fff9" />
          <circle cx="20" cy="56" r="4" fill="#fff9" />
          <circle cx="44" cy="56" r="4" fill="#fff9" />
          <path d="M20 12q12-6 24 0" fill="none" stroke="#fff9" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )
    case 'clover':
      return (
        <g>
          <circle cx="32" cy="20" r="9" {...s} />
          <circle cx="21" cy="34" r="9" {...s} />
          <circle cx="43" cy="34" r="9" {...s} />
          <path d="M32 32q2 14 10 22" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </g>
      )
  }
}
