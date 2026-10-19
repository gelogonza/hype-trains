import {
  animate,
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion'
import { useEffect, useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import css from './profile.module.css'

const SPRING = { type: 'spring', stiffness: 90, damping: 16 } as const
const EDGES = [-1.5, -0.75, 0, 0.75, 1.5]

const isBack = (deg: number) => Math.abs(Math.round(deg / 180)) % 2 === 1

/**
 * A physical two-sided card, in the spirit of ramp.design: it floats and sways when idle,
 * spins with momentum when dragged (throw it past halfway to flip), and its glare follows the angle.
 */
export function HoloCard({
  flipped,
  onFlip,
  front,
  back,
  intro = true,
}: {
  intro?: boolean
  flipped: boolean
  onFlip: (back: boolean) => void
  front: ReactNode
  back: ReactNode
}) {
  const reduce = useReducedMotion()
  const spin = useMotionValue(flipped ? 180 : 0)
  const tilt = useMotionValue(0)
  const hoverX = useMotionValue(0)
  const hoverY = useMotionValue(0)
  const swayX = useMotionValue(0)
  const swayY = useMotionValue(0)
  const bob = useMotionValue(0)
  const target = useRef(flipped ? 180 : 0)
  const busy = useRef(false)
  const amp = useRef(0)
  const panStart = useRef(0)
  const dragged = useRef(false)

  // Dealt in with a spin.
  useEffect(() => {
    if (reduce || !intro) return
    spin.set(target.current - 360)
    const a = animate(spin, target.current, { type: 'spring', stiffness: 55, damping: 14 })
    return () => a.stop()
  }, [spin, reduce])

  // Button flips (or the parent opening on the passport) spin forward to the right face.
  useEffect(() => {
    if (isBack(target.current) === flipped) return
    target.current = Math.round(spin.get() / 180) * 180 + 180
    if (isBack(target.current) !== flipped) target.current += 180
    animate(spin, target.current, SPRING)
  }, [flipped, spin])

  // Idle float: fades out while someone is holding the card.
  useAnimationFrame((t) => {
    if (reduce) return
    amp.current += ((busy.current ? 0 : 1) - amp.current) * 0.04
    const k = amp.current
    swayY.set(Math.sin(t / 1700) * 9 * k)
    swayX.set(Math.sin(t / 2300 + 1) * 5 * k)
    bob.set(Math.sin(t / 1300) * 5 * k)
  })

  const rotateY = useTransform(() => spin.get() + swayY.get() + hoverY.get())
  const rotateX = useTransform(() => tilt.get() + swayX.get() + hoverX.get())
  // Glare position: where the "light" lands for the current angle.
  const gx = useTransform(() => {
    const local = ((((rotateY.get() + 90) % 180) + 180) % 180) - 90
    return `${Math.min(100, Math.max(0, 50 - local * 2.2))}%`
  })
  const gy = useTransform(() => `${Math.min(100, Math.max(0, 50 + rotateX.get() * 4))}%`)
  const sheen = useMotionTemplate`${gx} ${gy}`

  const onPanStart = () => {
    busy.current = true
    dragged.current = true
    spin.stop()
    panStart.current = spin.get()
  }
  const onPan = (_: unknown, info: PanInfo) => {
    spin.set(panStart.current + info.offset.x * 0.6)
    tilt.set(Math.max(-14, Math.min(14, -info.offset.y * 0.08)))
  }
  const onPanEnd = (_: unknown, info: PanInfo) => {
    busy.current = false
    const projected = spin.get() + info.velocity.x * 0.14
    target.current = Math.round(projected / 180) * 180
    animate(spin, target.current, { ...SPRING, velocity: info.velocity.x * 0.6 })
    animate(tilt, 0, SPRING)
    if (isBack(target.current) !== flipped) onFlip(isBack(target.current))
  }

  // A plain click/tap anywhere on the card (not on its buttons) flips it.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if ((e.target as HTMLElement).closest('button, a, input, select, [role="button"]')) return
    onFlip(!flipped)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || busy.current) return
    const r = e.currentTarget.getBoundingClientRect()
    hoverY.set(((e.clientX - r.left) / r.width - 0.5) * 14)
    hoverX.set((0.5 - (e.clientY - r.top) / r.height) * 10)
  }
  const onPointerLeave = () => {
    animate(hoverX, 0, SPRING)
    animate(hoverY, 0, SPRING)
  }

  return (
    <div className={css.flipScene}>
      <motion.div
        className={css.card3d}
        style={{ rotateX, rotateY, y: bob, ['--sheen' as string]: sheen }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={() => (dragged.current = false)}
        onClick={onClick}
      >
        {EDGES.map((z) => (
          <div key={z} className={css.edge} style={{ transform: `translateZ(${z}px)` }} aria-hidden />
        ))}
        <div className={css.face} aria-hidden={flipped} inert={flipped}>
          {front}
        </div>
        <div className={`${css.face} ${css.faceBack}`} aria-hidden={!flipped} inert={!flipped}>
          {back}
        </div>
      </motion.div>
    </div>
  )
}
