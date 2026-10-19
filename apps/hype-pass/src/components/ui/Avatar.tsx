import type { Viewer } from '../../data/types'

export function Avatar({ viewer, size = 40 }: { viewer: Viewer; size?: number }) {
  const h = viewer.avatarHue
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flex: 'none',
        aspectRatio: '1',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: size * 0.42,
        color: `hsl(${h} 90% 12%)`,
        background: `radial-gradient(circle at 30% 25%, hsl(${h} 95% 80%), hsl(${h} 80% 55%) 60%, hsl(${(h + 40) % 360} 70% 40%))`,
        boxShadow: 'inset 0 0 0 2px #fff3',
      }}
    >
      {viewer.name[0].toUpperCase()}
    </span>
  )
}
