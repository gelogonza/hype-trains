import type { StampShape } from '../../data/types'

export type LabelStyle = 'arc' | 'ribbon' | 'postage' | 'ticket' | 'poster'

export interface ShapeGeo {
  w: number
  h: number
  /** Outline path in the shape's own viewBox. */
  d: string
  label: LabelStyle
  /** Motif center + scale (the motif is drawn in a 64×64 box). */
  motif: { x: number; y: number; s: number }
  /** Where the ribbon label sits, for ribbon shapes. */
  ribbon?: { y: number; w: number }
  /** Grid footprint on a passport page (columns × rows of a 6-column grid). */
  span: [number, number]
}

function polygon(cx: number, cy: number, radii: number[], count: number, rot = -Math.PI / 2) {
  const pts = Array.from({ length: count }, (_, i) => {
    const a = rot + (i / count) * Math.PI * 2
    const r = radii[i % radii.length]
    return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
  })
  return `M${pts.join('L')}Z`
}

function scallop(cx: number, cy: number, r: number, bumps: number) {
  const pts = Array.from({ length: bumps }, (_, i) => {
    const a = (i / bumps) * Math.PI * 2
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  })
  const bump = r * Math.sin(Math.PI / bumps) * 1.08
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = pts[i % bumps]
    d += `A${bump.toFixed(1)} ${bump.toFixed(1)} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d + 'Z'
}

export const SHAPES: Record<StampShape, ShapeGeo> = {
  circle: {
    w: 120,
    h: 120,
    d: 'M60 3a57 57 0 1 1 0 114a57 57 0 1 1 0-114z',
    label: 'arc',
    motif: { x: 60, y: 60, s: 0.72 },
    span: [2, 2],
  },
  hex: {
    w: 120,
    h: 120,
    d: polygon(60, 60, [57], 6, 0),
    label: 'ribbon',
    motif: { x: 60, y: 52, s: 0.66 },
    ribbon: { y: 86, w: 78 },
    span: [2, 2],
  },
  scallop: {
    w: 120,
    h: 120,
    d: scallop(60, 60, 49, 14),
    label: 'ribbon',
    motif: { x: 60, y: 52, s: 0.68 },
    ribbon: { y: 86, w: 84 },
    span: [2, 2],
  },
  burst: {
    w: 120,
    h: 120,
    d: polygon(60, 60, [58, 47], 32),
    label: 'ribbon',
    motif: { x: 60, y: 54, s: 0.62 },
    ribbon: { y: 84, w: 76 },
    span: [2, 2],
  },
  pennant: {
    w: 120,
    h: 112,
    d: 'M60 5Q64 5 66 9L115 99Q117 106 109 106H11Q3 106 5 99L54 9Q56 5 60 5Z',
    label: 'ribbon',
    motif: { x: 60, y: 66, s: 0.5 },
    ribbon: { y: 92, w: 74 },
    span: [2, 2],
  },
  shield: {
    w: 110,
    h: 128,
    d: 'M55 4L104 18V62C104 94 82 114 55 124C28 114 6 94 6 62V18Z',
    label: 'ribbon',
    motif: { x: 55, y: 54, s: 0.66 },
    ribbon: { y: 88, w: 80 },
    span: [2, 2],
  },
  postage: {
    w: 104,
    h: 128,
    d: 'M2 2H102V126H2Z',
    label: 'postage',
    motif: { x: 52, y: 54, s: 0.76 },
    span: [2, 3],
  },
  poster: {
    w: 110,
    h: 170,
    d: 'M8 52A47 47 0 0 1 102 52V160A8 8 0 0 1 94 168H16A8 8 0 0 1 8 160Z',
    label: 'poster',
    motif: { x: 55, y: 66, s: 0.86 },
    span: [2, 3],
  },
  ticket: {
    w: 220,
    h: 112,
    d: 'M12 2H208A10 10 0 0 1 218 12V44A12 12 0 0 0 218 68V100A10 10 0 0 1 208 110H12A10 10 0 0 1 2 100V68A12 12 0 0 0 2 44V12A10 10 0 0 1 12 2Z',
    label: 'ticket',
    motif: { x: 54, y: 56, s: 0.9 },
    span: [4, 2],
  },
}
