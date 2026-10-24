import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { conductors, isHeld, leaderboard } from '../../../state/trainReducer.js';
import * as THREE from 'three';
import { Backdrop2D } from './Backdrop2D.tsx';
import { LEADERBOARD_SIZE as RIDER_CARS } from '../../../data/train.js';
import { CALM, Smoke } from './core.tsx';
import { Dirt, LOCO, Upgrades, thrusterGap } from './Upgrades.tsx';
import { Carriage, Engine } from './vehicles.tsx';

/*
 * The runner train from Angelo Gonzalez's Hype Train Station prototype, driven by the Challenge
 * Train. A flat 2D farm scrolls past and the 3D train stays put. Every level reached makes it
 * hop, speed up, get muddier and bolt on an upgrade (spoiler, boosters, thruster, wings). It goes
 * gold when every level is reached, and stops when time runs out or a challenge holds it.
 *
 * The carriages are the donor leaderboard: #1 rides right behind the engine, and cars swap places
 * when someone overtakes. The Conductors (top Bits, top Subs) ride in gold. Name tags are HTML
 * laid over the scene, because painted name plates are unreadable at phone size.
 */

// strip: close on the engine and the top cars. wide: the whole train, for the train sheet.
const CAMS = {
  strip: { pos: [-2.8, 1.45, 6.6], look: [-2.8, 1.2, 0], fov: 28 },
  wide: { pos: [-5.6, 2.5, 15], look: [-5.6, 2.0, 0], fov: 28 },
};

// Top contributors fill the carriages. If you've supported but aren't in the top, you take the last car.
export function buildCars(train) {
  const ranked = leaderboard(train).map((c, i) => ({ ...c, rank: i + 1 }));
  const { bits, subs } = conductors(train);
  let riders = ranked.slice(0, RIDER_CARS);
  const me = ranked.find((c) => c.me);
  if (me && me.rank > RIDER_CARS) riders = [...riders.slice(0, RIDER_CARS - 1), me];

  const cars = riders.map((c) => {
    const crown = c.name === bits?.name || c.name === subs?.name;
    return {
      key: c.name,
      label: `#${c.rank}`,
      name: c.name,
      rank: c.rank,
      hype: c.bits + c.subs,
      crown,
      role: crown ? 'conductor' : c.subs >= c.bits ? 'subscriber' : 'cheerer',
      me: c.me,
    };
  });
  for (let i = cars.length; i < RIDER_CARS; i++) {
    cars.push({ key: `open${i}`, label: 'OPEN SEAT', role: 'open', me: false });
  }
  return cars;
}

// World units per second the scenery scrolls past. Every level is faster.
function targetSpeed(train) {
  switch (train.phase) {
    case 'boarding':
      return 1.6;
    case 'running':
      return isHeld(train) ? 0 : 5 + (train.levelReached + 1) * 2.6;
    case 'complete':
      return 20;
    default:
      return 0;
  }
}

// 0 = stock train, 1–4 = one upgrade per level reached, 5 = gold.
const tierOf = (train) => (train.phase === 'complete' ? 5 : train.levelReached);

// Places the side-on camera and tells the 2D backdrop where the ground line and scale are.
function Rig({ sim, view }) {
  const { camera, size } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  useFrame((s) => {
    const CAM = CAMS[view];
    const shake = CALM ? 0 : Math.max(0, sim.speed - 10) * 0.004;
    const t = s.clock.elapsedTime;
    camera.position.set(CAM.pos[0] + Math.sin(t * 37) * shake, CAM.pos[1] + Math.sin(t * 53) * shake, CAM.pos[2]);
    if (camera.fov !== CAM.fov) {
      camera.fov = CAM.fov;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(look.set(...CAM.look));
    camera.updateMatrixWorld();
    a.set(0, 0, 0).project(camera);
    b.set(1, 0, 0).project(camera);
    sim.groundY = ((1 - a.y) / 2) * size.height;
    sim.ppu = ((b.x - a.x) / 2) * size.width;
  });
  return null;
}

// A carriage slot that eases back when the train lengthens (thruster fitted).
function CarSlot({ x, slotRef, children }) {
  const g = useRef(null);
  useFrame((_, dt) => {
    if (g.current) g.current.position.x += (x - g.current.position.x) * Math.min(1, dt * 4);
  });
  return (
    <group
      ref={(el) => {
        g.current = el;
        slotRef(el);
      }}
      position={[x, 0, 0]}
    >
      {children}
    </group>
  );
}

// Moves each HTML name tag to sit above its carriage. In the wide view the cars are small, so
// every other tag sits higher to keep them from overlapping.
function useTags(slots, tags, view) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    slots.current.forEach((g, i) => {
      const tag = tags.current?.[i];
      if (!g || !tag) return;
      g.getWorldPosition(v);
      v.y += 1.55 + (view === 'wide' && i % 2 ? 0.9 : 0);
      v.project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      tag.style.visibility = x > -40 && x < size.width + 40 ? 'visible' : 'hidden';
    });
  });
}

function LocoRun({ train, cars, sim, tags, view }) {
  const tier = tierOf(train);
  const dirt = train.phase === 'complete' ? 0 : train.levelReached / 4;
  const lead = useRef(null);
  const body = useRef(null);
  const spin = useRef(0);
  const speed = useRef(0);
  const flash = useRef(0);
  const hop = useRef({ y: 0, vy: 0 });
  const slots = useRef([]);
  useTags(slots, tags, view);

  // A Geometry Dash hop and a flash on every level reached.
  useEffect(() => {
    if (!train.levelReached) return;
    flash.current = 1;
    if (!CALM) hop.current.vy = 7;
  }, [train.levelReached]);

  useFrame((s, raw) => {
    const dt = Math.min(raw, 0.05);
    speed.current = sim.speed;
    spin.current += sim.speed * dt;
    flash.current = Math.max(0, flash.current - dt * 1.5);
    const h = hop.current;
    h.vy -= 28 * dt;
    h.y = Math.max(0, h.y + h.vy * dt);
    if (h.y === 0) h.vy = Math.max(0, h.vy);
    const rattle = CALM ? 0 : Math.abs(Math.sin(s.clock.elapsedTime * (6 + sim.speed))) * 0.02 * Math.min(1, sim.speed / 6);
    if (body.current) body.current.position.y = h.y + rattle;
  });

  return (
    <group ref={body}>
      <group ref={lead}>
        <Engine gold={tier >= 5} spin={spin} flash={flash} />
        <Upgrades tier={tier} m={LOCO} speed={speed} />
        <Dirt amount={dirt} len={2.4} y0={0.35} y1={1.5} halfW={0.5} seed={3} />
      </group>
      {cars.map((c, i) => (
        <CarSlot key={c.key} x={-2.9 - thrusterGap(tier) - i * 2.35} slotRef={(el) => (slots.current[i] = el)}>
          <Carriage car={c} spin={spin} flash={flash} />
          <Dirt amount={dirt * 0.8} len={1.8} y0={0.45} y1={1.15} halfW={0.475} seed={i + 5} />
        </CarSlot>
      ))}
      <Smoke source={lead} speed={speed} at={[1.3, 1.9, 0]} color={dirt > 0.5 ? '#6b6470' : '#e6dff0'} />
    </group>
  );
}

function Tag({ car, tagRef }) {
  if (car.role === 'open') return <span ref={tagRef} className="car-tag car-tag--open">Open seat</span>;
  return (
    <span ref={tagRef} className={`car-tag${car.crown ? ' car-tag--crown' : ''}${car.me ? ' car-tag--me' : ''}`}>
      {car.crown && '👑 '}
      <b>{car.rank}</b> {car.me ? 'you' : car.name}
    </span>
  );
}

export default function Train3D({ train, view = 'strip' }) {
  const cars = useMemo(() => buildCars(train), [train.contributors]);
  const tags = useRef([]);
  const sim = useRef({ speed: 0, target: 0, groundY: 0, ppu: 40, flash: 0, tier: 0, completed: 0, theme: 'cozy', img: null, calm: CALM }).current;

  // R3F measures its box once on mount, which can be 0×0 inside a lazy reveal. Nudge it once laid out.
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    return () => clearTimeout(t);
  }, []);

  // Feed the latest train to the animation loops.
  useEffect(() => {
    sim.target = targetSpeed(train) * (CALM ? 0.35 : 1);
    sim.tier = tierOf(train);
    sim.completed = train.levelReached;
  }, [train.phase, train.levelReached, train.challenges, sim]);
  useEffect(() => {
    if (train.levelReached) sim.flash = 1;
  }, [train.levelReached, sim]);

  return (
    <div className="train-scene" aria-hidden="true">
      <Backdrop2D sim={sim} />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 26, near: 0.1, far: 80, position: [0, 1.5, 10] }}
        gl={{ antialias: true, alpha: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Rig sim={sim} view={view} />
        <hemisphereLight args={['#ffffff', '#4cb437', 1.3]} />
        <directionalLight position={[4, 8, 10]} intensity={2.2} color="#fff4dc" />
        <LocoRun train={train} cars={cars} sim={sim} tags={tags} view={view} />
      </Canvas>
      <div className="car-tags">
        {cars.map((c, i) => (
          <Tag key={c.key} car={c} tagRef={(el) => (tags.current[i] = el)} />
        ))}
      </div>
    </div>
  );
}
