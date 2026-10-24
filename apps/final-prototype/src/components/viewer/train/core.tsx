import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

/*
 * Runner scene ported from Angelo Gonzalez's Hype Train Station prototype (apps/hype-pass in the
 * team repo). Carriages, speed and upgrade tier now come from the Challenge Train state (see Train3D).
 */

/** Carriage colors follow how the rider supported: gift subs, subs, Bits. */
type Role = 'conductor' | 'subscriber' | 'cheerer' | 'rider'

/** Carriages trailing the engine (newest riders first). */
export const RIDER_CARS = 5

/** Respect reduced motion: the loop keeps going, but slowly, and the camera holds still. */
export const CALM = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------------- Shared geometry ---------------- */

export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
  wheel: new THREE.CylinderGeometry(1, 1, 1, 16).rotateX(Math.PI / 2),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  cone3: new THREE.ConeGeometry(1, 1, 3),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  roof: new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4),
  cone: new THREE.ConeGeometry(1, 1, 8),
  plane: new THREE.PlaneGeometry(1, 1),
  octa: new THREE.OctahedronGeometry(1),
  /** Cone pointing backwards (−x), length 1 along x. */
  flame: new THREE.ConeGeometry(1, 1, 12).rotateZ(Math.PI / 2),
  disc: new THREE.CircleGeometry(1, 14),
}

export const ROLE_COLOR: Record<Role | 'crowd' | 'open', string> = {
  conductor: '#e8b83d',
  subscriber: '#9147ff',
  cheerer: '#00c2a8',
  rider: '#ff9f1a',
  crowd: '#6a5f86',
  open: '#4a4062',
}
export const ROLE_ICON: Record<Role | 'crowd' | 'open', string> = {
  conductor: '👑',
  subscriber: '★',
  cheerer: '◆',
  rider: '💬',
  crowd: '💬',
  open: '',
}

export interface Car {
  key: string
  label: string
  role: Role | 'crowd' | 'open'
  me: boolean
}

export function makeLabel(text: string, color: string, me: boolean) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = me ? '#2e0b68' : '#0e0e10'
  g.beginPath()
  g.roundRect(6, 6, 500, 116, 26)
  g.fill()
  g.lineWidth = 10
  g.strokeStyle = me ? '#ffffff' : color
  g.stroke()
  g.fillStyle = '#ffffff'
  g.font = '800 58px Inter, system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 256, 68, 460)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function useLabel(text: string, color: string, me = false) {
  const tex = useMemo(() => makeLabel(text, color, me), [text, color, me])
  useEffect(() => () => tex.dispose(), [tex])
  return tex
}


/** Exhaust puffs that drift back as the world scrolls past. */
export function Smoke({ source, speed, at: local, color = '#e6dff0' }: { source: RefObject<THREE.Group | null>; speed: RefObject<number>; at: [number, number, number]; color?: string }) {
  const N = 14
  const puffs = useRef<THREE.Mesh[]>([])
  const life = useRef(Array.from({ length: N }, (_, i) => i / N))
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const col = useMemo(() => new THREE.Color(color), [color])
  useEffect(() => {
    puffs.current.forEach((m) => (m.material as THREE.MeshStandardMaterial).color.copy(col))
  }, [col])
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    const e = source.current
    if (!e) return
    const rate = 0.6 + speed.current * 0.08
    puffs.current.forEach((m, i) => {
      if (!m) return
      life.current[i] += dt * rate
      if (life.current[i] >= 1) {
        life.current[i] -= 1
        e.localToWorld(tmp.set(...local))
        m.position.copy(tmp)
      }
      const t = life.current[i]
      m.position.y += dt * 0.8
      m.position.x -= dt * (0.6 + speed.current * 0.55)
      m.scale.setScalar(0.12 + t * 0.45)
      ;(m.material as THREE.MeshStandardMaterial).opacity = (1 - t) * 0.5
    })
  })
  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(m) => void (m && (puffs.current[i] = m))} geometry={G.sphere} position={[0, -50, 0]}>
          <meshStandardMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}
