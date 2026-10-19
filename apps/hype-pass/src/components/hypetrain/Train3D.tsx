import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { resolveTheme, type ThemeId } from '../../data/themes'
import type { StationState } from '../../state/station'
import { Backdrop2D, type RunnerSim } from './scene/Backdrop2D'
import { CALM, Smoke, buildCars, targetSpeed, tierOf, type Car } from './scene/core'
import { BUS, Dirt, LOCO, Upgrades, thrusterGap } from './scene/Upgrades'
import { BattleBus, Carriage, Engine, Glider } from './scene/vehicles'

/*
 * Geometry Dash-style runner: a flat 2D world scrolls past, and the only 3D thing is the
 * train, seen side-on. It stays put while the world rushes by; each cleared level makes
 * it faster, dirtier and bolts on another upgrade.
 */

const CAM = {
  // Strip: ground near the bottom edge so the train runs below the status HUD along the top.
  strip: { spooky: { pos: [-1.6, 2.2, 10.5], look: [-1.6, 2.0, 0], fov: 28 }, battle: { pos: [-1.6, 2.7, 12], look: [-1.6, 2.45, 0], fov: 30 } },
  hero: { spooky: { pos: [-1.2, 1.6, 11], look: [-1.2, 1.1, 0], fov: 30 }, battle: { pos: [-1.2, 2.6, 12.5], look: [-1.2, 2.3, 0], fov: 32 } },
} as const

/** Places the side-on camera and tells the 2D backdrop where the ground line and scale are. */
function Rig({ view, theme, sim }: { view: 'strip' | 'hero'; theme: ThemeId; sim: RunnerSim }) {
  const { camera, size } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  useFrame((s) => {
    const c = CAM[view][theme]
    const shake = CALM ? 0 : Math.max(0, sim.speed - 10) * 0.004
    const t = s.clock.elapsedTime
    camera.position.set(c.pos[0] + Math.sin(t * 37) * shake, c.pos[1] + Math.sin(t * 53) * shake, c.pos[2])
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== c.fov) {
      cam.fov = c.fov
      cam.updateProjectionMatrix()
    }
    look.set(c.look[0], c.look[1], c.look[2])
    camera.lookAt(look)
    camera.updateMatrixWorld()
    a.set(0, 0, 0).project(camera)
    b.set(1, 0, 0).project(camera)
    sim.groundY = ((1 - a.y) / 2) * size.height
    sim.ppu = ((b.x - a.x) / 2) * size.width
  })
  return null
}

/** A Geometry Dash hop on every level clear. */
function useHop(levelUpKey: number) {
  const y = useRef(0)
  const vy = useRef(0)
  useEffect(() => {
    if (levelUpKey && !CALM) vy.current = 7
  }, [levelUpKey])
  return (dt: number) => {
    vy.current -= 28 * dt
    y.current = Math.max(0, y.current + vy.current * dt)
    if (y.current === 0) vy.current = Math.max(0, vy.current)
    return y.current
  }
}

function useRunRefs(state: StationState, sim: RunnerSim) {
  const spin = useRef(0)
  const speed = useRef(0)
  const flash = useRef(0)
  const hop = useHop(state.levelUpKey)
  useEffect(() => {
    if (state.levelUpKey) flash.current = 1
  }, [state.levelUpKey])
  const step = (raw: number) => {
    const dt = Math.min(raw, 0.05)
    speed.current = sim.speed
    spin.current += sim.speed * dt
    flash.current = Math.max(0, flash.current - dt * 1.5)
    return { dt, h: hop(dt) }
  }
  return { spin, speed, flash, step }
}

/** A carriage slot that eases back when the train lengthens (thruster fitted). */
function CarSlot({ x, children }: { x: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (g.current) g.current.position.x += (x - g.current.position.x) * Math.min(1, dt * 4)
  })
  return (
    <group ref={g} position={[x, 0, 0]}>
      {children}
    </group>
  )
}

function LocoRun({ state, cars, sim }: { state: StationState; cars: Car[]; sim: RunnerSim }) {
  const tier = tierOf(state)
  const dirt = state.phase === 'arrived' ? 0 : state.completed / 4
  const lead = useRef<THREE.Group>(null)
  const train = useRef<THREE.Group>(null)
  const { spin, speed, flash, step } = useRunRefs(state, sim)
  useFrame((s, raw) => {
    const { h } = step(raw)
    const rattle = CALM ? 0 : Math.abs(Math.sin(s.clock.elapsedTime * (6 + sim.speed))) * 0.02 * Math.min(1, sim.speed / 6)
    if (train.current) train.current.position.y = h + rattle
  })
  return (
    <group ref={train}>
      <group ref={lead}>
        <Engine gold={tier >= 5} spin={spin} flash={flash} />
        <Upgrades tier={tier} m={LOCO} speed={speed} />
        <Dirt amount={dirt} len={2.4} y0={0.35} y1={1.5} halfW={0.5} seed={3} />
      </group>
      {cars.map((c, i) => (
        <CarSlot key={c.key} x={-2.9 - thrusterGap(tier) - i * 2.35}>
          <Carriage car={c} spin={spin} flash={flash} />
          <Dirt amount={dirt * 0.8} len={1.8} y0={0.45} y1={1.15} halfW={0.475} seed={i + 5} />
        </CarSlot>
      ))}
      <Smoke source={lead} speed={speed} at={[1.3, 1.9, 0]} color={dirt > 0.5 ? '#6b6470' : '#e6dff0'} />
    </group>
  )
}

function BusRun({ state, cars, sim }: { state: StationState; cars: Car[]; sim: RunnerSim }) {
  const tier = tierOf(state)
  const dirt = state.phase === 'arrived' ? 0 : state.completed / 4
  const lead = useRef<THREE.Group>(null)
  const gliders = useRef<THREE.Group[]>([])
  const { spin, speed, flash, step } = useRunRefs(state, sim)
  useFrame((s, raw) => {
    const { h } = step(raw)
    const t = s.clock.elapsedTime
    const sway = CALM ? 0 : 1
    if (lead.current) {
      lead.current.position.y = 1.3 + h + Math.sin(t * 1.4) * 0.12 * sway
      lead.current.rotation.z = Math.sin(t * 1.1) * 0.03 * sway - Math.min(0.12, sim.speed * 0.004)
    }
    gliders.current.forEach((g, i) => {
      if (!g) return
      g.position.y = 1.15 + Math.sin(t * 1.7 + i * 0.8) * 0.2 * sway
      g.rotation.z = Math.sin(t * 1.3 + i) * 0.06 * sway
    })
  })
  return (
    <group>
      <group ref={lead}>
        <BattleBus gold={tier >= 5} spin={spin} flash={flash} />
        <Upgrades tier={tier} m={BUS} speed={speed} />
        <Dirt amount={dirt} len={2.3} y0={-0.4} y1={0.35} halfW={0.5} seed={7} />
      </group>
      {cars.map((c, i) => (
        <group key={c.key} ref={(g) => void (g && (gliders.current[i] = g))} position={[-3.2 - thrusterGap(tier) - i * 2.1, 1.15, 0]}>
          <Glider car={c} flash={flash} />
        </group>
      ))}
      <Smoke source={lead} speed={speed} at={[-1.5, 0.1, 0]} color="#ffffff" />
    </group>
  )
}

function Lights({ theme }: { theme: ThemeId }) {
  return theme === 'battle' ? (
    <>
      <hemisphereLight args={['#ffffff', '#4cb437', 1.3]} />
      <directionalLight position={[4, 8, 10]} intensity={2.2} color="#fff4dc" />
    </>
  ) : (
    <>
      <hemisphereLight args={['#c9b6ff', '#2a1a4a', 1.4]} />
      <directionalLight position={[3, 6, 10]} intensity={1.6} color="#ffe2c4" />
      <pointLight position={[2.5, 1.5, 2]} color="#ff9f1a" intensity={6} distance={8} />
    </>
  )
}

export function Train3D({ state, view, paused }: { state: StationState; view: 'strip' | 'hero'; paused?: boolean }) {
  const theme = resolveTheme(state.game, state.themeChoice)
  const cars = useMemo(() => buildCars(state), [state])
  const sim = useRef<RunnerSim>({ speed: 0, target: 0, groundY: 0, ppu: 40, flash: 0, tier: 0, completed: 0, theme, img: null, calm: CALM }).current

  // R3F measures its box once on mount; when that happens inside a lazy/Suspense reveal the box
  // can still be 0×0, and it only re-measures on resize. Nudge it once laid out.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 80)
    return () => clearTimeout(t)
  }, [])

  // Feed the latest state to the animation loops.
  useEffect(() => {
    sim.target = targetSpeed(state) * (CALM ? 0.35 : 1)
    sim.tier = tierOf(state)
    sim.completed = state.completed
    sim.theme = theme
  }, [state, theme, sim])
  useEffect(() => {
    if (state.levelUpKey) sim.flash = 1
  }, [state.levelUpKey, sim])
  useEffect(() => {
    if (!state.backdrop) {
      sim.img = null
      return
    }
    const img = new Image()
    img.src = state.backdrop
    sim.img = img
  }, [state.backdrop, sim])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop2D sim={sim} paused={paused} />
      <Canvas
        frameloop={paused ? 'never' : 'always'}
        dpr={[1, 1.75]}
        camera={{ fov: 26, near: 0.1, far: 80, position: [0, 1.5, 10] }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <Rig view={view} theme={theme} sim={sim} />
        <Lights theme={theme} />
        {theme === 'battle' ? <BusRun state={state} cars={cars} sim={sim} /> : <LocoRun state={state} cars={cars} sim={sim} />}
      </Canvas>
    </div>
  )
}
