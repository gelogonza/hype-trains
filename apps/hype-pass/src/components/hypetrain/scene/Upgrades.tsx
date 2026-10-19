import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { CALM, G } from './core'

/** Where things bolt on, per vehicle (local space, +x forward). */
export interface Mounts {
  rear: number
  mid: number
  roofX: number
  roof: number
  under: number
  halfW: number
}

export const LOCO: Mounts = { rear: -1.4, mid: 0.8, roofX: -1.25, roof: 1.76, under: 0.2, halfW: 0.5 }
export const BUS: Mounts = { rear: -1.3, mid: 0, roofX: -0.95, roof: 0.56, under: -0.56, halfW: 0.5 }

/** A flickering exhaust flame pointing backwards (−x). */
function Flame({ at, r, len, hot, speed }: { at: [number, number, number]; r: number; len: number; hot: boolean; speed: RefObject<number> }) {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const k = (0.55 + Math.min(1, speed.current / 18) * 0.9) * (CALM ? 1 : 0.85 + Math.random() * 0.3)
    outer.current?.scale.set(len * k, r, r)
    inner.current?.scale.set(len * k * 0.6, r * 0.5, r * 0.5)
    if (outer.current) outer.current.position.x = at[0] - (len * k) / 2
    if (inner.current) inner.current.position.x = at[0] - (len * k * 0.6) / 2
  })
  return (
    <group position={[0, at[1], at[2]]}>
      <mesh ref={outer} geometry={G.flame}>
        <meshBasicMaterial color={hot ? '#57c8ff' : '#ff8a1a'} transparent opacity={0.85} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={inner} geometry={G.flame}>
        <meshBasicMaterial color={hot ? '#ffffff' : '#ffe08a'} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * Bolt-ons earned by clearing levels:
 * 1 spoiler · 2 side boosters · 3 rocket thruster · 4 wings + neon underglow · 5 everything gold, blue afterburners.
 */
export function Upgrades({ tier, m, speed }: { tier: number; m: Mounts; speed: RefObject<number> }) {
  const gold = tier >= 5
  const metal = gold ? '#e8b83d' : '#3b3b44'
  const trim = gold ? '#fff2b0' : '#ff9f1a'
  return (
    <group>
      {tier >= 1 && (
        <group position={[m.roofX, m.roof, 0]}>
          {[0.32, -0.32].map((z) => (
            <mesh key={z} geometry={G.box} position={[0, 0.1, z]} scale={[0.05, 0.2, 0.05]}>
              <meshStandardMaterial color={metal} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          <mesh geometry={G.box} position={[-0.05, 0.22, 0]} rotation={[0, 0, 0.18]} scale={[0.5, 0.05, 1.15]} castShadow>
            <meshStandardMaterial color={metal} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh geometry={G.box} position={[0.18, 0.26, 0]} rotation={[0, 0, 0.18]} scale={[0.06, 0.055, 1.16]}>
            <meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {tier >= 2 &&
        [1, -1].map((s) => (
          <group key={s}>
            <mesh geometry={G.cyl} position={[m.rear + 0.75, m.mid - 0.05, s * (m.halfW + 0.16)]} rotation={[0, 0, Math.PI / 2]} scale={[0.15, 1.1, 0.15]} castShadow>
              <meshStandardMaterial color={metal} metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh geometry={G.cyl} position={[m.rear + 0.2, m.mid - 0.05, s * (m.halfW + 0.16)]} rotation={[0, 0, Math.PI / 2]} scale={[0.17, 0.12, 0.17]}>
              <meshStandardMaterial color={trim} emissive={trim} emissiveIntensity={0.4} />
            </mesh>
            <Flame at={[m.rear + 0.14, m.mid - 0.05, s * (m.halfW + 0.16)]} r={0.12} len={0.7} hot={gold} speed={speed} />
          </group>
        ))}

      {tier >= 3 && (
        <group>
          <mesh geometry={G.cyl} position={[m.rear - 0.2, m.mid + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.32, 0.55, 0.32]} castShadow>
            <meshStandardMaterial color={metal} metalness={0.75} roughness={0.2} />
          </mesh>
          <mesh geometry={G.cyl} position={[m.rear - 0.5, m.mid + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.36, 0.1, 0.36]}>
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <Flame at={[m.rear - 0.55, m.mid + 0.15, 0]} r={0.28} len={1.6} hot={gold} speed={speed} />
          <pointLight position={[m.rear - 1.2, m.mid + 0.15, 0.6]} color={gold ? '#57c8ff' : '#ff8a1a'} intensity={8} distance={5} />
        </group>
      )}

      {tier >= 4 && (
        <group>
          {/* swept wings, tipped down so they read from the side */}
          {[1, -1].map((s) => (
            <mesh key={s} geometry={G.box} position={[-0.2, m.mid - 0.3, s * (m.halfW + 0.3)]} rotation={[s * 0.75, s * 0.35, 0]} scale={[1.1, 0.06, 0.6]} castShadow>
              <meshStandardMaterial color={metal} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {/* tail fin */}
          <mesh geometry={G.box} position={[m.roofX - 0.15, m.roof + 0.45, 0]} rotation={[0, 0, 0.55]} scale={[0.75, 0.5, 0.05]} castShadow>
            <meshStandardMaterial color={metal} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh geometry={G.box} position={[m.roofX - 0.05, m.roof + 0.5, 0]} rotation={[0, 0, 0.55]} scale={[0.6, 0.08, 0.06]}>
            <meshBasicMaterial color={gold ? '#fff2b0' : '#00e6cb'} toneMapped={false} />
          </mesh>
          <mesh geometry={G.box} position={[0, m.under, 0]} scale={[2.6, 0.04, 0.9]}>
            <meshBasicMaterial color={gold ? '#fff2b0' : '#00e6cb'} toneMapped={false} />
          </mesh>
          <pointLight position={[0, m.under - 0.2, 0.8]} color={gold ? '#ffe08a' : '#00e6cb'} intensity={5} distance={3} />
        </group>
      )}
    </group>
  )
}

/** Mud splats that build up on the sides as the run gets wilder. */
export function Dirt({ amount, len, y0, y1, halfW, seed = 1 }: { amount: number; len: number; y0: number; y1: number; halfW: number; seed?: number }) {
  const splats = useMemo(() => {
    const out: [number, number, number][] = []
    let s = seed * 97
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 12; i++) out.push([(rnd() - 0.5) * len, y0 + rnd() * (y1 - y0), 0.04 + rnd() * 0.1])
    return out
  }, [len, y0, y1, seed])
  const n = Math.round(Math.min(1, amount) * splats.length)
  if (!n) return null
  return (
    <group>
      {splats.slice(0, n).flatMap(([x, y, r], i) =>
        [1, -1].map((s) => (
          <mesh key={`${i}${s}`} geometry={G.disc} position={[x, y, s * (halfW + 0.012)]} rotation={[0, s < 0 ? Math.PI : 0, 0]} scale={[r * 1.3, r, 1]}>
            <meshStandardMaterial color={i % 3 ? '#3b2a1a' : '#24170c'} roughness={1} transparent opacity={0.85} />
          </mesh>
        )),
      )}
    </group>
  )
}

/** Extra room behind the lead once the big thruster is fitted. */
export const thrusterGap = (tier: number) => (tier >= 3 ? 1.5 : 0)
