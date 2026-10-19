#!/usr/bin/env node
// Scaffold a new teammate app from templates/app.
//
//   npm run new-app -- <name> [--title "Concept title"] [--owner "Your name"]
//
// Gives the app its own package name (@hype/<name>), its own folder (apps/<name>) and
// the next free dev port, so nobody's dev server or build collides with anyone else's.

import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const name = args.find((a) => !a.startsWith('--'))
const flag = (f) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : undefined
}

if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error('Usage: npm run new-app -- <name> [--title "Concept title"] [--owner "Your name"]')
  console.error('  <name> must be lowercase kebab-case, e.g. boss-fight-train')
  process.exit(1)
}

const dest = join(root, 'apps', name)
if (existsSync(dest)) {
  console.error(`apps/${name} already exists.`)
  process.exit(1)
}

// Next free dev port: one above the highest port any app already uses (apps start at 5101).
let port = 5100
for (const dir of readdirSync(join(root, 'apps'))) {
  const cfg = join(root, 'apps', dir, 'vite.config.ts')
  if (!existsSync(cfg)) continue
  const m = readFileSync(cfg, 'utf8').match(/server:\s*\{[^}]*port:\s*(\d+)/)
  if (m) port = Math.max(port, Number(m[1]))
}
port += 1

const title = flag('--title') ?? name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
const owner = flag('--owner') ?? 'TBD'
const vars = { __NAME__: name, __TITLE__: title, __OWNER__: owner, __PORT__: String(port), __PREVIEW_PORT__: String(port - 1000) }

cpSync(join(root, 'templates', 'app'), dest, { recursive: true })

const fill = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) fill(p)
    else if (/\.(json|ts|tsx|css|html|md|svg)$/.test(entry)) {
      let text = readFileSync(p, 'utf8')
      for (const [k, v] of Object.entries(vars)) text = text.replaceAll(k, v)
      writeFileSync(p, text)
    }
  }
}
fill(dest)

console.log(`
Created apps/${name}  (@hype/${name}, dev port ${port})

Next:
  npm install                       # links the new workspace
  npm run dev -w @hype/${name}      # http://localhost:${port}
`)
