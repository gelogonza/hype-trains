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

/** Folders never worth scanning or copying. */
export const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.svelte-kit', '.astro', '.vercel', '.turbo', '.cache', '.parcel-cache', '.expo', 'coverage'])

/** Walk text-ish source files under `dir` (skips deps and build output). Calls fn(path, text). */
export function walkSource(dir, fn, exts = /\.(html|css|scss|js|jsx|ts|tsx|mjs|vue|svelte|astro)$/) {
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    let entries
    try {
      entries = readdirSync(d, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) stack.push(join(d, e.name))
      } else if (exts.test(e.name)) {
        try {
          fn(join(d, e.name), readFileSync(join(d, e.name), 'utf8'))
        } catch {
          /* unreadable file */
        }
      }
    }
  }
}

/**
 * Asset URLs hard-coded from the domain root ("/img/logo.png"). They work on localhost but break
 * once the app is hosted under /<app-name>/. Returns up to `limit` "file:line  snippet" hits.
 */
export function findRootPaths(dir, limit = 8) {
  // Vite rewrites root paths in index.html and CSS to include the base; only JS/TS string literals break.
  const vite = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].some((f) => existsSync(join(dir, f)))
  const hits = []
  const attr = /(?:src|href|poster)=["']\/(?!\/)[^"'#?]+\.(?:png|jpe?g|gif|svg|webp|avif|mp3|wav|ogg|mp4|webm|glb|gltf|json|css|js|woff2?)["']/g
  const lit = /["'`]\/(?!\/)[\w\-./]+\.(?:png|jpe?g|gif|svg|webp|avif|mp3|wav|ogg|mp4|webm|glb|gltf|json|woff2?)["'`]/g
  const css = /url\(\s*["']?\/(?!\/)[^)"']+["']?\s*\)/g
  walkSource(dir, (file, text) => {
    if (hits.length >= limit) return
    text.split('\n').forEach((line, i) => {
      if (hits.length >= limit) return
      const code = /\.(js|jsx|ts|tsx|mjs|vue|svelte)$/.test(file)
      const m = code ? line.match(lit) || (!vite && line.match(attr)) : !vite && (line.match(attr) || line.match(css))
      if (m) hits.push(`${file.slice(dir.length + 1)}:${i + 1}  ${m[0]}`)
    })
  })
  return hits
}

/** localStorage/sessionStorage keys that aren't prefixed with "<app>:" (they'd clash on a shared domain). */
export function findUnprefixedStorage(dir, app, limit = 6) {
  const hits = new Set()
  walkSource(dir, (file, text) => {
    for (const m of text.matchAll(/(?:local|session)Storage\.(?:setItem|getItem|removeItem)\(\s*["'`]([^"'`]+)["'`]/g)) {
      if (!m[1].startsWith(`${app}:`) && hits.size < limit) hits.add(`${m[1]}  (${file.slice(dir.length + 1)})`)
    }
  })
  return [...hits]
}
