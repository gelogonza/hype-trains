import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { G, ROLE_COLOR, ROLE_ICON, useLabel, type Car } from './core'

/*
 * The 3D models. Everything faces +x and is built to read well from the side:
 * a 4-4-0 style locomotive with working rods, passenger carriages on bogies,
 * and the Battle Bus under a gored balloon with gliders.
 */

/* ---------------- Shape helpers ---------------- */

/** Box with rounded side profile and bevelled edges, centered on the origin. */
function roundedBox(w: number, h: number, d: number, r: number) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  const b = Math.min(0.04, d * 0.1)
  const g = new THREE.ExtrudeGeometry(s, { depth: d - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 })
  g.center()
  return g
}

/** Build a geometry once per mounted model. */
function useGeo<T>(make: () => T) {
  const ref = useRef<T | null>(null)
  if (ref.current === null) ref.current = make()
  return ref.current
}

const M = {
  steel: { color: '#2a2a30', metalness: 0.8, roughness: 0.35 },
  dark: { color: '#18181b', metalness: 0.4, roughness: 0.6 },
  brass: { color: '#ffca5f', metalness: 0.9, roughness: 0.25 },
  red: { color: '#c8323a', metalness: 0.2, roughness: 0.5 },
  glass: { color: '#1b1430', metalness: 0.2, roughness: 0.15 },
}

/* ---------------- Wheels ---------------- */

/** Spoked wheel with tyre, rim, hub and optional counterweight. Spins with distance travelled. */
function Wheel({ r, x, y = r, z, spin, rim = '#ffca5f', spokes = 8, counter = false }: { r: number; x: number; y?: number; z: number; spin: RefObject<number>; rim?: string; spokes?: number; counter?: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.rotation.z = -spin.current / r
  })
  const t = 0.09
  return (
    <group position={[x, y, z]}>
      <group ref={g}>
        <mesh geometry={G.wheel} scale={[r, r, t]} castShadow>
          <meshStandardMaterial {...M.steel} />
        </mesh>
        <mesh geometry={G.wheel} position={[0, 0, Math.sign(z) * 0.006]} scale={[r * 0.84, r * 0.84, t + 0.01]}>
          <meshStandardMaterial color={rim} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh geometry={G.wheel} position={[0, 0, Math.sign(z) * 0.012]} scale={[r * 0.7, r * 0.7, t + 0.02]}>
          <meshStandardMaterial {...M.dark} />
        </mesh>
        {Array.from({ length: spokes }, (_, i) => (
          <mesh key={i} geometry={G.box} rotation={[0, 0, (i / spokes) * Math.PI]} position={[0, 0, Math.sign(z) * 0.03]} scale={[r * 1.36, r * 0.09, 0.04]}>
            <meshStandardMaterial color={rim} metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        {counter && (
          <mesh geometry={G.box} position={[0, -r * 0.42, Math.sign(z) * 0.04]} scale={[r * 0.9, r * 0.32, 0.05]}>
            <meshStandardMaterial {...M.dark} />
          </mesh>
        )}
        <mesh geometry={G.wheel} position={[0, 0, Math.sign(z) * 0.05]} scale={[r * 0.18, r * 0.18, 0.04]}>
          <meshStandardMaterial {...M.brass} />
        </mesh>
      </group>
    </group>
  )
}

/** Side rods coupling the drivers, and the main rod back to the piston: they move with the wheels. */
function Rods({ spin, z, drivers, r, crank, pistonX, y }: { spin: RefObject<number>; z: number; drivers: number[]; r: number; crank: number; pistonX: number; y: number }) {
  const side = useRef<THREE.Mesh>(null)
  const main = useRef<THREE.Mesh>(null)
  const cross = useRef<THREE.Mesh>(null)
  const len = drivers[drivers.length - 1] - drivers[0]
  useFrame(() => {
    const a = -spin.current / r
    const px = Math.cos(a) * crank
    const py = Math.sin(a) * crank
    side.current?.position.set((drivers[0] + drivers[drivers.length - 1]) / 2 + px, y + py, z)
    // main rod from the front driver's crank pin to the crosshead
    const fx = drivers[drivers.length - 1] + px
    const fy = y + py
    const hx = pistonX
    const hy = y
    const dx = hx - fx
    const dy = hy - fy
    if (main.current) {
      main.current.position.set((fx + hx) / 2, (fy + hy) / 2, z * 1.06)
      main.current.rotation.z = Math.atan2(dy, dx)
      main.current.scale.x = Math.hypot(dx, dy)
    }
    cross.current?.position.set(hx, hy, z * 1.06)
  })
  return (
    <group>
      <mesh ref={side} geometry={G.box} scale={[len + 0.08, 0.05, 0.03]}>
        <meshStandardMaterial {...M.steel} />
      </mesh>
      <mesh ref={main} geometry={G.box} scale={[1, 0.045, 0.03]}>
        <meshStandardMaterial color="#c9c3d6" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={cross} geometry={G.box} scale={[0.1, 0.08, 0.04]}>
        <meshStandardMaterial {...M.steel} />
      </mesh>
    </group>
  )
}

/* ---------------- Locomotive ---------------- */

export function Engine({ gold, spin, flash }: { gold: boolean; spin: RefObject<number>; flash: RefObject<number> }) {
  const lamp = useRef<THREE.MeshStandardMaterial>(null)
  const paint = useRef<THREE.MeshPhysicalMaterial>(null)
  const cabPaint = useRef<THREE.MeshPhysicalMaterial>(null)
  const goldC = useMemo(() => new THREE.Color('#e8b83d'), [])
  const violet = useMemo(() => new THREE.Color('#6a24d6'), [])
  const violet2 = useMemo(() => new THREE.Color('#9147ff'), [])
  useFrame((_, dt) => {
    if (lamp.current) lamp.current.emissiveIntensity = 3 + flash.current * 8
    const k = Math.min(1, dt * 2)
    paint.current?.color.lerp(gold ? goldC : violet, k)
    cabPaint.current?.color.lerp(gold ? goldC : violet2, k)
  })

  const boiler = useGeo(() => new THREE.CylinderGeometry(0.36, 0.36, 1.55, 32).rotateZ(Math.PI / 2))
  const smokebox = useGeo(() => new THREE.CylinderGeometry(0.38, 0.38, 0.36, 32).rotateZ(Math.PI / 2))
  const band = useGeo(() => new THREE.CylinderGeometry(0.372, 0.372, 0.035, 32).rotateZ(Math.PI / 2))
  const chimney = useGeo(() =>
    new THREE.LatheGeometry(
      [
        [0.11, 0],
        [0.1, 0.25],
        [0.13, 0.38],
        [0.2, 0.46],
        [0.21, 0.52],
        [0.12, 0.53],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      24,
    ),
  )
  const dome = useGeo(() => new THREE.SphereGeometry(0.16, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2))
  const cab = useGeo(() => roundedBox(1.05, 0.95, 0.96, 0.06))
  // half-cylinder arched over the cab, axis across the train
  const roof = useGeo(() => new THREE.CylinderGeometry(0.6, 0.6, 1.12, 32, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2))
  const cowcatcher = useGeo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.42)
    s.lineTo(0, 0.04)
    s.lineTo(0.42, 0.04)
    s.lineTo(0, 0.42)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.86, bevelEnabled: false })
    g.translate(0, 0, -0.43)
    return g
  })
  const buffer = useGeo(() => new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12).rotateZ(Math.PI / 2))

  return (
    <group>
      {/* frame, running board, valance */}
      <mesh geometry={G.box} position={[0.05, 0.42, 0]} scale={[2.95, 0.16, 0.74]} castShadow>
        <meshStandardMaterial {...M.dark} />
      </mesh>
      <mesh geometry={G.box} position={[0.05, 0.62, 0]} scale={[2.95, 0.05, 1.0]} castShadow>
        <meshStandardMaterial {...M.steel} />
      </mesh>
      <mesh geometry={G.box} position={[0.1, 0.53, 0]} scale={[2.6, 0.12, 1.01]}>
        <meshStandardMaterial {...M.red} />
      </mesh>

      {/* boiler, bands, smokebox */}
      <mesh geometry={boiler} position={[0.42, 0.99, 0]} castShadow>
        <meshPhysicalMaterial ref={paint} color="#6a24d6" roughness={0.35} metalness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      {[-0.2, 0.35, 0.9].map((x) => (
        <mesh key={x} geometry={band} position={[x, 0.99, 0]}>
          <meshStandardMaterial {...M.brass} />
        </mesh>
      ))}
      <mesh geometry={smokebox} position={[1.33, 0.99, 0]} castShadow>
        <meshStandardMaterial {...M.steel} />
      </mesh>
      <mesh geometry={G.wheel} position={[1.52, 0.99, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.34, 0.34, 0.03]}>
        <meshStandardMaterial {...M.dark} />
      </mesh>
      <mesh geometry={G.sphere} position={[1.55, 0.99, 0]} scale={0.05}>
        <meshStandardMaterial {...M.brass} />
      </mesh>

      {/* chimney, domes, bell, handrails */}
      <mesh geometry={chimney} position={[1.3, 1.3, 0]} castShadow>
        <meshStandardMaterial {...M.steel} />
      </mesh>
      <mesh geometry={dome} position={[0.65, 1.32, 0]} scale={[1, 1.15, 1]} castShadow>
        <meshStandardMaterial {...M.brass} />
      </mesh>
      <mesh geometry={dome} position={[0.12, 1.32, 0]} scale={[0.85, 1, 0.85]} castShadow>
        <meshStandardMaterial {...M.brass} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} geometry={G.cyl} position={[0.45, 1.08, s * 0.39]} rotation={[0, 0, Math.PI / 2]} scale={[0.015, 1.5, 0.015]}>
          <meshStandardMaterial {...M.brass} />
        </mesh>
      ))}

      {/* headlamp (pumpkin-orange) */}
      <mesh geometry={G.box} position={[1.42, 1.48, 0]} scale={[0.2, 0.2, 0.22]} castShadow>
        <meshStandardMaterial {...M.dark} />
      </mesh>
      <mesh geometry={G.wheel} position={[1.53, 1.48, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.08, 0.08, 0.02]}>
        <meshStandardMaterial ref={lamp} color="#ffb347" emissive="#ff9f1a" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* cab */}
      <mesh geometry={cab} position={[-0.95, 1.12, 0]} castShadow>
        <meshPhysicalMaterial ref={cabPaint} color="#9147ff" roughness={0.4} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>
      <mesh geometry={roof} position={[-0.95, 1.5, 0]} scale={[1, 0.38, 1]} castShadow>
        <meshStandardMaterial color="#2e0b68" roughness={0.6} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s}>
          <mesh geometry={G.box} position={[-0.9, 1.28, s * 0.485]} scale={[0.46, 0.34, 0.02]}>
            <meshStandardMaterial color="#2b1d45" emissive="#ffd37a" emissiveIntensity={0.9} />
          </mesh>
          <mesh geometry={G.box} position={[-0.9, 1.28, s * 0.49]} scale={[0.52, 0.04, 0.02]}>
            <meshStandardMaterial {...M.brass} />
          </mesh>
        </group>
      ))}
      <mesh geometry={G.box} position={[-0.42, 1.3, 0]} scale={[0.02, 0.3, 0.7]}>
        <meshStandardMaterial color="#2b1d45" emissive="#ffd37a" emissiveIntensity={0.6} />
      </mesh>

      {/* cylinders + cowcatcher + buffer beam */}
      {[1, -1].map((s) => (
        <mesh key={s} geometry={G.cyl} position={[1.12, 0.48, s * 0.44]} rotation={[0, 0, Math.PI / 2]} scale={[0.14, 0.42, 0.14]} castShadow>
          <meshStandardMaterial {...M.steel} />
        </mesh>
      ))}
      <mesh geometry={G.box} position={[1.55, 0.5, 0]} scale={[0.1, 0.2, 1.0]}>
        <meshStandardMaterial {...M.red} />
      </mesh>
      {[0.32, -0.32].map((z) => (
        <mesh key={z} geometry={buffer} position={[1.66, 0.5, z]}>
          <meshStandardMaterial {...M.brass} />
        </mesh>
      ))}
      <mesh geometry={cowcatcher} position={[1.55, 0, 0]} castShadow>
        <meshStandardMaterial {...M.steel} />
      </mesh>

      {/* wheels: leading truck, two big drivers, trailing wheel under the cab */}
      {[0.46, -0.46].map((z) => (
        <group key={z}>
          <Wheel r={0.17} x={1.28} z={z} spin={spin} spokes={6} />
          <Wheel r={0.17} x={0.92} z={z} spin={spin} spokes={6} />
          <Wheel r={0.34} x={0.38} z={z} spin={spin} counter />
          <Wheel r={0.34} x={-0.42} z={z} spin={spin} counter />
          <Wheel r={0.2} x={-1.18} z={z} spin={spin} spokes={6} />
          <Rods spin={spin} z={z * 1.18} drivers={[-0.42, 0.38]} r={0.34} crank={0.13} pistonX={0.9} y={0.34} />
        </group>
      ))}
    </group>
  )
}

/* ---------------- Carriage ---------------- */

export function Carriage({ car, spin, flash }: { car: Car; spin: RefObject<number>; flash: RefObject<number> }) {
  const color = ROLE_COLOR[car.role]
  const tex = useLabel(`${ROLE_ICON[car.role]} ${car.label}`.trim(), color, car.me)
  const win = useRef<THREE.MeshStandardMaterial>(null)
  const marker = useRef<THREE.Mesh>(null)
  const body = useGeo(() => roundedBox(2.04, 0.74, 0.92, 0.1))
  const roof = useGeo(() => roundedBox(2.14, 0.12, 1.02, 0.05))
  const clere = useGeo(() => roundedBox(1.6, 0.1, 0.56, 0.04))
  const dark = useMemo(() => new THREE.Color(color).multiplyScalar(0.55), [color])
  useFrame((s) => {
    if (win.current) win.current.emissiveIntensity = (car.role === 'open' ? 0.2 : 1) + flash.current * 2
    if (marker.current) {
      marker.current.rotation.y = s.clock.elapsedTime * 2
      marker.current.position.y = 1.8 + Math.sin(s.clock.elapsedTime * 3) * 0.08
    }
  })
  return (
    <group>
      {/* body with darker skirt */}
      <mesh geometry={body} position={[0, 0.86, 0]} castShadow>
        <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.7} clearcoatRoughness={0.3} />
      </mesh>
      <mesh geometry={G.box} position={[0, 0.56, 0]} scale={[2.0, 0.14, 0.93]}>
        <meshStandardMaterial color={dark} roughness={0.6} />
      </mesh>
      <mesh geometry={G.box} position={[0, 0.66, 0]} scale={[2.02, 0.025, 0.935]}>
        <meshStandardMaterial {...M.brass} />
      </mesh>
      {/* roof + clerestory */}
      <mesh geometry={roof} position={[0, 1.28, 0]} castShadow>
        <meshStandardMaterial color="#26262c" roughness={0.6} />
      </mesh>
      <mesh geometry={clere} position={[0, 1.38, 0]}>
        <meshStandardMaterial color="#2f2f35" roughness={0.6} />
      </mesh>
      {/* windows with frames */}
      {[-0.72, -0.24, 0.24, 0.72].map((x, i) => (
        <group key={x}>
          <mesh geometry={G.box} position={[x, 1.0, 0]} scale={[0.34, 0.26, 0.94]}>
            <meshStandardMaterial ref={i === 0 ? win : undefined} color="#2b1d45" emissive="#ffd37a" emissiveIntensity={1} />
          </mesh>
          <mesh geometry={G.box} position={[x, 1.0, 0]} scale={[0.38, 0.3, 0.925]}>
            <meshStandardMaterial {...M.dark} />
          </mesh>
        </group>
      ))}
      {/* name plate */}
      {[1, -1].map((side) => (
        <mesh key={side} geometry={G.plane} position={[0, 0.7, 0.475 * side]} rotation={[0, side < 0 ? Math.PI : 0, 0]} scale={[1.7, 0.36, 1]}>
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      {/* gangway bellows + couplers */}
      {[1.06, -1.06].map((x) => (
        <group key={x}>
          <mesh geometry={G.box} position={[x, 0.95, 0]} scale={[0.12, 0.6, 0.6]}>
            <meshStandardMaterial color="#26262c" roughness={0.9} />
          </mesh>
          <mesh geometry={G.box} position={[x * 1.07, 0.42, 0]} scale={[0.2, 0.06, 0.08]}>
            <meshStandardMaterial {...M.steel} />
          </mesh>
        </group>
      ))}
      {/* bogies */}
      {[-0.62, 0.62].map((bx) => (
        <group key={bx}>
          <mesh geometry={G.box} position={[bx, 0.3, 0]} scale={[0.62, 0.1, 0.78]}>
            <meshStandardMaterial {...M.dark} />
          </mesh>
          {[0.46, -0.46].map((z) => (
            <group key={z}>
              <Wheel r={0.16} x={bx - 0.2} z={z} spin={spin} spokes={6} rim="#adadb8" />
              <Wheel r={0.16} x={bx + 0.2} z={z} spin={spin} spokes={6} rim="#adadb8" />
            </group>
          ))}
        </group>
      ))}
      {car.me && (
        <mesh ref={marker} geometry={G.octa} position={[0, 1.8, 0]} scale={0.18}>
          <meshStandardMaterial color="#bf94ff" emissive="#9147ff" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  )
}

/* ---------------- Battle Bus ---------------- */

/** Teardrop balloon made of alternating blue/white gores. */
function Balloon({ gold }: { gold: boolean }) {
  const gores = 14
  const geos = useGeo(() => {
    const prof: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) {
      const t = i / 24
      // teardrop: narrow at the mouth, round on top
      const y = t * 2.1
      const r = Math.sin(Math.pow(t, 0.85) * Math.PI) * 1.18 * (t < 0.15 ? 0.55 + t * 3 : 1)
      prof.push(new THREE.Vector2(Math.max(0.16, r), y))
    }
    prof.push(new THREE.Vector2(0, 2.1))
    return Array.from({ length: gores }, (_, i) => new THREE.LatheGeometry(prof, 6, (i / gores) * Math.PI * 2, (Math.PI * 2) / gores))
  })
  const a = gold ? '#e8b83d' : '#2f7bff'
  const b = gold ? '#fff2b0' : '#ffffff'
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} castShadow>
          <meshStandardMaterial color={i % 2 ? b : a} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function BattleBus({ gold, spin, flash }: { gold: boolean; spin: RefObject<number>; flash: RefObject<number> }) {
  const fans = useRef<THREE.Group>(null)
  const body = useRef<THREE.MeshPhysicalMaterial>(null)
  const lamps = useRef<THREE.MeshStandardMaterial>(null)
  const blue = useMemo(() => new THREE.Color('#2f7bff'), [])
  const goldC = useMemo(() => new THREE.Color('#e8b83d'), [])
  const sign = useLabel('BATTLE BUS', '#ffffff')
  const shell = useGeo(() => roundedBox(2.6, 0.95, 1.0, 0.16))
  const roofStripe = useGeo(() => roundedBox(2.5, 0.1, 1.02, 0.05))
  const ring = useGeo(() => new THREE.TorusGeometry(0.3, 0.025, 8, 28))
  const basketRing = useGeo(() => new THREE.TorusGeometry(0.42, 0.04, 8, 28).rotateX(Math.PI / 2))
  useFrame((_, dt) => {
    fans.current?.children.forEach((f) => (f.children[0].rotation.x = spin.current * 8))
    body.current?.color.lerp(gold ? goldC : blue, Math.min(1, dt * 2))
    if (lamps.current) lamps.current.emissiveIntensity = 2 + flash.current * 8
  })
  return (
    <group>
      <mesh geometry={shell} castShadow>
        <meshPhysicalMaterial ref={body} color="#2f7bff" roughness={0.3} metalness={0.15} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      <mesh geometry={roofStripe} position={[0, 0.44, 0]}>
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {/* windshield */}
      <mesh geometry={G.box} position={[1.27, 0.12, 0]} rotation={[0, 0, -0.12]} scale={[0.08, 0.46, 0.86]}>
        <meshStandardMaterial {...M.glass} emissive="#9fd4ff" emissiveIntensity={0.25} />
      </mesh>
      {/* side windows + door */}
      {[-0.95, -0.55, -0.15, 0.25].map((x) => (
        <mesh key={x} geometry={G.box} position={[x, 0.15, 0]} scale={[0.32, 0.34, 1.01]}>
          <meshStandardMaterial {...M.glass} emissive="#9fd4ff" emissiveIntensity={0.35} />
        </mesh>
      ))}
      <mesh geometry={G.box} position={[0.78, -0.03, 0]} scale={[0.3, 0.72, 1.01]}>
        <meshStandardMaterial {...M.glass} emissive="#9fd4ff" emissiveIntensity={0.25} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} geometry={G.plane} position={[-0.35, -0.27, 0.506 * s]} rotation={[0, s < 0 ? Math.PI : 0, 0]} scale={[1.5, 0.24, 1]}>
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      ))}
      {/* bumpers + lights */}
      {[1.33, -1.33].map((x) => (
        <mesh key={x} geometry={G.box} position={[x, -0.4, 0]} scale={[0.08, 0.12, 1.02]}>
          <meshStandardMaterial {...M.steel} />
        </mesh>
      ))}
      {[0.32, -0.32].map((z) => (
        <group key={z}>
          <mesh geometry={G.sphere} position={[1.31, -0.2, z]} scale={0.07}>
            <meshStandardMaterial ref={z > 0 ? lamps : undefined} color="#fff6c8" emissive="#fff2b0" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh geometry={G.box} position={[-1.31, -0.2, z]} scale={[0.03, 0.12, 0.08]}>
            <meshStandardMaterial color="#ff4f4d" emissive="#ff4f4d" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* wheels in arches */}
      {[-0.82, 0.82].map((x) =>
        [0.47, -0.47].map((z) => (
          <group key={`${x}${z}`}>
            <mesh geometry={G.wheel} position={[x, -0.45, z * 1.02]} scale={[0.29, 0.29, 0.06]}>
              <meshStandardMaterial {...M.dark} />
            </mesh>
            <Wheel r={0.23} x={x} y={-0.5} z={z * 1.06} spin={spin} spokes={5} rim="#d8dde8" />
          </group>
        )),
      )}
      {/* caged fans */}
      <group ref={fans}>
        {[0.28, -0.28].map((z) => (
          <group key={z} position={[-1.42, 0.12, z]}>
            <group>
              <mesh geometry={G.box} scale={[0.03, 0.46, 0.07]}>
                <meshStandardMaterial color="#d8dde8" metalness={0.7} />
              </mesh>
              <mesh geometry={G.box} scale={[0.03, 0.07, 0.46]}>
                <meshStandardMaterial color="#d8dde8" metalness={0.7} />
              </mesh>
            </group>
            <mesh geometry={ring} rotation={[0, Math.PI / 2, 0]}>
              <meshStandardMaterial {...M.steel} />
            </mesh>
          </group>
        ))}
      </group>
      {/* rope rig + balloon */}
      {[
        [1, 0.4],
        [1, -0.4],
        [-1, 0.4],
        [-1, -0.4],
      ].map(([x, z], i) => (
        <mesh key={i} geometry={G.cyl} position={[x * 0.62, 1.0, z * 0.62]} rotation={[z * 0.32, 0, -x * 0.42]} scale={[0.015, 1.05, 0.015]}>
          <meshStandardMaterial color="#7a5a3a" />
        </mesh>
      ))}
      <mesh geometry={basketRing} position={[0, 1.5, 0]}>
        <meshStandardMaterial {...M.steel} />
      </mesh>
      <group position={[0, 1.5, 0]}>
        <Balloon gold={gold} />
      </group>
    </group>
  )
}

/* ---------------- Glider ---------------- */

/** A rider hanging under a two-tone delta wing, their name on a banner. */
export function Glider({ car, flash }: { car: Car; flash: RefObject<number> }) {
  const color = ROLE_COLOR[car.role]
  const tex = useLabel(`${ROLE_ICON[car.role]} ${car.label}`.trim(), color, car.me)
  const wing = useRef<THREE.MeshStandardMaterial>(null)
  const wingGeo = useGeo(() => {
    const s = new THREE.Shape()
    s.moveTo(0.75, 0)
    s.lineTo(-0.55, 0.85)
    s.lineTo(-0.35, 0)
    s.lineTo(-0.55, -0.85)
    s.lineTo(0.75, 0)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2 })
    g.rotateX(Math.PI / 2)
    g.center()
    return g
  })
  const stripe = useGeo(() => {
    const s = new THREE.Shape()
    s.moveTo(0.75, 0)
    s.lineTo(-0.15, 0.42)
    s.lineTo(-0.05, 0)
    s.lineTo(-0.15, -0.42)
    s.lineTo(0.75, 0)
    const g = new THREE.ShapeGeometry(s)
    g.rotateX(-Math.PI / 2)
    return g
  })
  const capsule = useGeo(() => new THREE.CapsuleGeometry(0.11, 0.24, 6, 12))
  useFrame(() => {
    if (wing.current) wing.current.emissiveIntensity = 0.12 + flash.current * 1.5
  })
  return (
    <group>
      <group position={[0, 0.62, 0]} rotation={[0, 0, 0.08]}>
        <mesh geometry={wingGeo} castShadow>
          <meshStandardMaterial ref={wing} color={color} emissive={color} emissiveIntensity={0.12} roughness={0.5} />
        </mesh>
        <mesh geometry={stripe} position={[0, 0.035, 0]}>
          <meshStandardMaterial color="#ffffff" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[0.3, -0.3].map((z) => (
        <mesh key={z} geometry={G.cyl} position={[0, 0.42, z * 0.6]} rotation={[z, 0, 0]} scale={[0.008, 0.38, 0.008]}>
          <meshStandardMaterial {...M.steel} />
        </mesh>
      ))}
      {/* rider */}
      <mesh geometry={capsule} position={[0, 0.1, 0]} rotation={[0, 0, -0.25]}>
        <meshStandardMaterial color={car.me ? '#bf94ff' : '#3b3b44'} roughness={0.6} />
      </mesh>
      <mesh geometry={G.sphere} position={[0.06, 0.36, 0]} scale={0.1}>
        <meshStandardMaterial color="#ffd9b3" roughness={0.7} />
      </mesh>
      <mesh geometry={G.box} position={[-0.1, 0.14, 0]} scale={[0.1, 0.2, 0.18]}>
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} geometry={G.plane} position={[0, -0.36, 0.02 * side]} rotation={[0, side < 0 ? Math.PI : 0, 0]} scale={[1.6, 0.38, 1]}>
          <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {car.me && (
        <mesh geometry={G.octa} position={[0, 1.0, 0]} scale={0.15}>
          <meshStandardMaterial color="#bf94ff" emissive="#9147ff" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  )
}
