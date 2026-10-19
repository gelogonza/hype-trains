// Helpers shared by new-app / import-app / build-site.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const appsDir = join(root, 'apps')

export const NAME_RE = /^[a-z][a-z0-9-]*$/

export function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'))
}

/** Dev port an app uses: `hype.port` in its package.json, else the port in its vite config. */
export function appPort(dir) {
  const pkgPath = join(appsDir, dir, 'package.json')
  if (existsSync(pkgPath)) {
    const port = readJson(pkgPath).hype?.port
    if (port) return Number(port)
  }
  for (const f of ['vite.config.ts', 'vite.config.js', 'vite.config.mjs']) {
    const p = join(appsDir, dir, f)
    if (!existsSync(p)) continue
    const m = readFileSync(p, 'utf8').match(/server:\s*\{[^}]*port:\s*(\d+)/)
    if (m) return Number(m[1])
  }
  return 0
}

/** One above the highest port any app already uses (apps start at 5101). */
export function nextPort() {
  let max = 5100
  if (existsSync(appsDir)) for (const dir of readdirSync(appsDir)) max = Math.max(max, appPort(dir))
  return max + 1
}

/** Where an app's production build lands: `hype.out` if set, else the first of dist/build/out that exists. */
export function buildOutput(dir) {
  const pkg = readJson(join(appsDir, dir, 'package.json'))
  const candidates = [pkg.hype?.out, 'dist', 'build', 'out'].filter(Boolean)
  return candidates.map((c) => join(appsDir, dir, c)).find((p) => existsSync(p))
}
