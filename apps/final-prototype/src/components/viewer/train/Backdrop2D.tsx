import { useEffect, useRef } from 'react'

/** 'cozy' is the Challenge Train's farm-day scene; it draws the battle scene's countryside without the storm. */
export type ThemeId = 'spooky' | 'battle' | 'cozy'

/** Shared between the 2D backdrop and the 3D train each frame. */
export interface RunnerSim {
  /** Current / target scroll speed in world units per second. */
  speed: number
  target: number
  /** Screen position of the 3D ground line and world→pixel scale, reported by the 3D camera. */
  groundY: number
  ppu: number
  /** 0 → 1 flash on level clear. */
  flash: number
  tier: number
  completed: number
  theme: ThemeId
  img: HTMLImageElement | null
  calm: boolean
}

type RGB = [number, number, number]
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const rgba = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Geometry Dash-style color changes: every level clear shifts the palette. [skyTop, skyBottom, accent, block] */
const PALETTES: Record<ThemeId, string[][]> = {
  spooky: [
    ['#140a2b', '#3a1a5c', '#ff9f1a', '#2a1650'],
    ['#1a0b3a', '#5b1f7a', '#ffb84d', '#331a5e'],
    ['#22093f', '#7a1f6e', '#ff6f9f', '#3d1866'],
    ['#2a0a2e', '#9b2340', '#ff4f4d', '#4a1238'],
    ['#120a3a', '#3d1fa8', '#00e6cb', '#2a1b6e'],
    ['#2b1a00', '#8a5a00', '#ffe08a', '#5a3c00'],
  ],
  cozy: [
    ['#6fb8ff', '#ffe3c2', '#ffffff', '#5aa84a'],
    ['#5aa6f5', '#ffd6a8', '#ffe08a', '#529e44'],
    ['#7a8cf0', '#ffbf9a', '#ffca5f', '#4c9440'],
    ['#8a6fd8', '#ff9fa0', '#ff8fd0', '#45883b'],
    ['#5a3fb0', '#c27ad8', '#00e6cb', '#3a7a36'],
    ['#8a5a00', '#ffd37a', '#fff2b0', '#c99a1e'],
  ],
  battle: [
    ['#4fb3ff', '#c8eeff', '#ffffff', '#3fae3a'],
    ['#3d9cf0', '#b3e2ff', '#ffe08a', '#3aa336'],
    ['#4a7fe0', '#c2bcff', '#ffca5f', '#349a33'],
    ['#5a5fd0', '#d2a8ff', '#ff6fd8', '#2f8f30'],
    ['#3f2f9c', '#8f5cff', '#00e6cb', '#2b7d2b'],
    ['#8a5a00', '#ffd37a', '#fff2b0', '#c99a1e'],
  ],
}

/** Draw `count` repeating items of width `period` scrolling at `par` × the world. */
function repeat(x: number, par: number, period: number, w: number, draw: (sx: number, k: number) => void) {
  const off = (x * par) % period
  const base = Math.floor((x * par) / period)
  for (let i = -1; i * period - off < w + period; i++) draw(i * period - off, base + i)
}

function drawSpooky(g: CanvasRenderingContext2D, w: number, h: number, gy: number, x: number, t: number, pal: RGB[], sim: RunnerSim) {
  const [, bottom, accent, block] = pal
  // stars
  g.fillStyle = 'rgba(255,255,255,0.7)'
  repeat(x, 0.03, 60, w, (sx, k) => {
    if (hash(k) > 0.55) g.fillRect(sx + hash(k + 1) * 60, hash(k + 2) * gy * 0.6, 1.5, 1.5)
  })
  // moon
  const mr = Math.max(10, h * 0.11)
  g.save()
  g.shadowColor = rgba(mix([255, 233, 176], accent, sim.completed / 6), 0.9)
  g.shadowBlur = 30
  g.fillStyle = rgba(mix([255, 233, 176], [255, 74, 42], sim.completed / 5))
  g.beginPath()
  g.arc(w * 0.84, gy * 0.32, mr, 0, Math.PI * 2)
  g.fill()
  g.restore()
  // far mountains (sharp triangles)
  g.fillStyle = rgba(mix(bottom, [0, 0, 0], 0.45))
  repeat(x, 0.15, 150, w, (sx, k) => {
    const mh = gy * (0.25 + hash(k) * 0.35)
    g.beginPath()
    g.moveTo(sx - 40, gy)
    g.lineTo(sx + 75, gy - mh)
    g.lineTo(sx + 190, gy)
    g.fill()
  })
  // mid: GD blocks + spikes
  const s = Math.max(9, h * 0.085)
  repeat(x, 0.5, s * 5, w, (sx, k) => {
    const r = hash(k * 3.1)
    if (r < 0.35) return
    const n = 1 + Math.floor(hash(k * 7.7) * 3)
    for (let j = 0; j < n; j++) {
      const by = gy - (j + 1) * s
      g.fillStyle = rgba(block)
      g.fillRect(sx, by, s, s)
      g.strokeStyle = rgba(accent, 0.75)
      g.lineWidth = 1.5
      g.strokeRect(sx + 0.75, by + 0.75, s - 1.5, s - 1.5)
      g.strokeStyle = rgba(accent, 0.3)
      g.strokeRect(sx + s * 0.28, by + s * 0.28, s * 0.44, s * 0.44)
    }
    if (r > 0.75) {
      g.fillStyle = rgba(mix(block, accent, 0.25))
      g.beginPath()
      g.moveTo(sx + s * 1.4, gy)
      g.lineTo(sx + s * 1.9, gy - s * 0.9)
      g.lineTo(sx + s * 2.4, gy)
      g.fill()
    }
  })
  // bats
  const bats = 2 + Math.round(sim.completed * 2.5)
  g.strokeStyle = 'rgba(10,6,16,0.9)'
  g.lineWidth = 2
  for (let i = 0; i < bats; i++) {
    const bx = (w + 40 - ((x * 0.7 + i * 173 + t * 30) % (w + 80))) | 0
    const by = gy * (0.15 + hash(i) * 0.45) + Math.sin(t * 3 + i) * 4
    const f = Math.sin(t * 16 + i) * 4
    g.beginPath()
    g.moveTo(bx - 7, by - f)
    g.lineTo(bx, by)
    g.lineTo(bx + 7, by - f)
    g.stroke()
  }
}

function drawBattle(g: CanvasRenderingContext2D, w: number, h: number, gy: number, x: number, t: number, pal: RGB[], sim: RunnerSim) {
  const [, bottom, accent, block] = pal
  // sun
  g.save()
  g.shadowColor = 'rgba(255,246,200,0.9)'
  g.shadowBlur = 40
  g.fillStyle = '#fff6c8'
  g.beginPath()
  g.arc(w * 0.15, gy * 0.25, Math.max(10, h * 0.1), 0, Math.PI * 2)
  g.fill()
  g.restore()
  // clouds
  g.fillStyle = 'rgba(255,255,255,0.92)'
  repeat(x, 0.08, 210, w, (sx, k) => {
    const cy = gy * (0.15 + hash(k) * 0.35)
    const r = Math.max(8, h * 0.06) * (0.8 + hash(k + 4))
    g.beginPath()
    g.arc(sx, cy, r, 0, Math.PI * 2)
    g.arc(sx + r, cy - r * 0.4, r * 1.1, 0, Math.PI * 2)
    g.arc(sx + r * 2.1, cy, r * 0.9, 0, Math.PI * 2)
    g.fill()
  })
  // far hills
  g.fillStyle = rgba(mix(block, bottom, 0.45))
  repeat(x, 0.2, 260, w, (sx, k) => {
    g.beginPath()
    g.ellipse(sx + 130, gy, 160, gy * (0.25 + hash(k) * 0.25), 0, Math.PI, 0)
    g.fill()
  })
  // mid: trees and houses on the ground line
  const s = Math.max(9, h * 0.085)
  repeat(x, 0.5, s * 4.5, w, (sx, k) => {
    const r = hash(k * 5.3)
    if (r < 0.3) return
    if (r < 0.7) {
      g.fillStyle = '#7a4a24'
      g.fillRect(sx + s * 0.42, gy - s * 1.1, s * 0.16, s * 1.1)
      g.fillStyle = rgba(mix(block, [255, 255, 255], 0.1))
      g.beginPath()
      g.arc(sx + s * 0.5, gy - s * 1.4, s * 0.62, 0, Math.PI * 2)
      g.fill()
    } else {
      g.fillStyle = '#f3ead7'
      g.fillRect(sx, gy - s * 1.1, s * 1.4, s * 1.1)
      g.fillStyle = ['#e8483d', '#2f7bff', '#ffb400', '#9147ff'][k & 3]
      g.beginPath()
      g.moveTo(sx - s * 0.15, gy - s * 1.1)
      g.lineTo(sx + s * 0.7, gy - s * 1.8)
      g.lineTo(sx + s * 1.55, gy - s * 1.1)
      g.fill()
    }
  })
  if (sim.theme === 'cozy') return
  // the storm creeps in from the left, more every level
  const sw = w * (0.05 + sim.completed * 0.09)
  const grad = g.createLinearGradient(0, 0, sw + 30, 0)
  grad.addColorStop(0, 'rgba(110,30,214,0.85)')
  grad.addColorStop(0.8, 'rgba(143,60,255,0.45)')
  grad.addColorStop(1, 'rgba(143,60,255,0)')
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(0, 0)
  for (let yy = 0; yy <= h; yy += 8) g.lineTo(sw + Math.sin(yy * 0.08 + t * 3) * 10, yy)
  g.lineTo(0, h)
  g.fill()
  void accent
}

function drawGround(g: CanvasRenderingContext2D, w: number, h: number, gy: number, x: number, t: number, pal: RGB[], sim: RunnerSim) {
  const [, , accent, block] = pal
  g.fillStyle = rgba(mix(block, [0, 0, 0], sim.theme === 'spooky' ? 0.35 : 0.15))
  g.fillRect(0, gy, w, h - gy)
  const ts = Math.max(14, (h - gy) * 0.9)
  g.strokeStyle = rgba(accent, 0.28)
  g.lineWidth = 1.5
  repeat(x, 1, ts, w, (sx) => {
    g.strokeRect(sx + 1, gy + 3, ts - 2, ts - 2)
  })
  // beat-pulsing ground line, like a level edge in Geometry Dash
  const beat = 0.6 + 0.4 * Math.abs(Math.sin(t * (2 + sim.completed)))
  g.save()
  g.shadowColor = rgba(accent, 0.9)
  g.shadowBlur = 10 * beat
  g.fillStyle = rgba(accent, beat)
  g.fillRect(0, gy, w, 2.5)
  g.restore()
}

function drawSpeed(g: CanvasRenderingContext2D, w: number, gy: number, x: number, sim: RunnerSim) {
  const k = Math.max(0, sim.speed - 6) / 14
  const n = Math.round(k * 16 + sim.tier * 2)
  if (!n) return
  g.strokeStyle = `rgba(255,255,255,${0.15 + k * 0.25})`
  g.lineWidth = 1.5
  for (let i = 0; i < n; i++) {
    const len = 20 + k * 90
    const y = gy * (0.1 + hash(i * 9.1) * 0.85)
    const sx = w + len - ((x * 1.8 + hash(i) * 997) % (w + len * 2))
    g.beginPath()
    g.moveTo(sx, y)
    g.lineTo(sx + len, y)
    g.stroke()
  }
}

/** The 2D side-scrolling world behind the 3D train. Owns the speed easing; the 3D layer reads it. */
export function Backdrop2D({ sim, paused }: { sim: RunnerSim; paused?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const c = ref.current!
    const g = c.getContext('2d')!
    let w = 0
    let h = 0
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = c.clientWidth
      h = c.clientHeight
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)

    let x = 0
    let last = performance.now()
    let raf = 0
    let pal: RGB[] = PALETTES[sim.theme][0].map(hex)
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (pausedRef.current || !w || !h) return
      const t = now / 1000
      sim.speed += (sim.target - sim.speed) * Math.min(1, dt * (sim.target > sim.speed ? 0.8 : 1.5))
      x += sim.speed * (sim.ppu || 40) * dt
      sim.flash = Math.max(0, sim.flash - dt * 1.6)
      const target = PALETTES[sim.theme][Math.min(5, sim.tier)].map(hex)
      pal = pal.map((c0, i) => mix(c0, target[i], Math.min(1, dt * 1.5)))
      const gy = sim.groundY > 0 ? sim.groundY : h * 0.8

      // sky
      if (sim.img?.complete && sim.img.naturalWidth) {
        const iw = (sim.img.naturalWidth / sim.img.naturalHeight) * h
        repeat(x, 0.05, iw, w, (sx) => g.drawImage(sim.img!, sx, 0, iw, h))
      } else {
        const sky = g.createLinearGradient(0, 0, 0, gy)
        sky.addColorStop(0, rgba(pal[0]))
        sky.addColorStop(1, rgba(pal[1]))
        g.fillStyle = sky
        g.fillRect(0, 0, w, h)
        // faint Geometry Dash grid
        g.strokeStyle = 'rgba(255,255,255,0.05)'
        g.lineWidth = 1
        const gs = Math.max(18, h * 0.16)
        repeat(x, 0.1, gs, w, (sx) => {
          g.beginPath()
          g.moveTo(sx, 0)
          g.lineTo(sx, gy)
          g.stroke()
        })
        for (let yy = gy; yy > 0; yy -= gs) {
          g.beginPath()
          g.moveTo(0, yy)
          g.lineTo(w, yy)
          g.stroke()
        }
      }

      if (sim.theme !== 'spooky') drawBattle(g, w, h, gy, x, t, pal, sim)
      else drawSpooky(g, w, h, gy, x, t, pal, sim)
      drawGround(g, w, h, gy, x, t, pal, sim)
      if (!sim.calm) drawSpeed(g, w, gy, x, sim)

      if (sim.flash > 0) {
        g.fillStyle = `rgba(255,255,255,${sim.flash * 0.55})`
        g.fillRect(0, 0, w, h)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [sim])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} aria-hidden />
}
