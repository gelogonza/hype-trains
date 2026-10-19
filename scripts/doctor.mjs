#!/usr/bin/env node
// Check that every app (or just the ones named) follows the repo rules, with a fix for each problem.
//
//   npm run doctor              # all apps
//   npm run doctor -- my-app    # one app
//
// ✗ = will break builds or collide with someone else   ⚠ = will probably bite on the shared site

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { appPort, appsDir, findRootPaths, findUnprefixedStorage, readJson } from './lib.mjs'

const only = process.argv.slice(2)
const dirs = readdirSync(appsDir).filter((d) => existsSync(join(appsDir, d, 'package.json')) && (!only.length || only.includes(d)))
if (only.length && !dirs.length) {
  console.error(`No app named ${only.join(', ')} in apps/.`)
  process.exit(1)
}

// Ports across *all* apps, so duplicates are caught even when checking one.
const ports = new Map()
for (const d of readdirSync(appsDir)) {
  const p = existsSync(join(appsDir, d, 'package.json')) ? appPort(d) : 0
  if (p) ports.set(p, [...(ports.get(p) ?? []), d])
}

let errors = 0
let warnings = 0

for (const dir of dirs) {
  const app = join(appsDir, dir)
  const pkg = readJson(join(app, 'package.json'))
  const hype = pkg.hype ?? {}
  const out = []
  const bad = (msg, fix) => (errors++, out.push(`  ✗ ${msg}\n      → ${fix}`))
  const warn = (msg, fix) => (warnings++, out.push(`  ⚠ ${msg}\n      → ${fix}`))
  const read = (f) => (existsSync(join(app, f)) ? readFileSync(join(app, f), 'utf8') : '')

  if (pkg.name !== `@hype/${dir}`) bad(`package name is "${pkg.name}"`, `set "name": "@hype/${dir}" in apps/${dir}/package.json`)

  if (hype.external) {
    console.log(`\n${dir}  (link → ${hype.external})\n  ✓ link-only app`)
    continue
  }

  const port = appPort(dir)
  if (!port) bad('no dev port assigned', 'add "hype": { "port": <next free port> } to package.json (see the README port table)')
  else if (ports.get(port).length > 1) bad(`port ${port} is shared with ${ports.get(port).filter((d) => d !== dir).join(', ')}`, 'give one of them a different "hype.port" (and vite server.port)')

  const vite = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].map(read).find(Boolean)
  if (vite) {
    if (!/BASE_PATH/.test(vite)) bad('vite config ignores BASE_PATH, so it breaks under /' + dir + '/', `add  base: process.env.BASE_PATH ?? '/'  to defineConfig`)
    const vPort = vite.match(/server:\s*\{[^}]*port:\s*(\d+)/)?.[1]
    if (hype.port && vPort && Number(vPort) !== Number(hype.port)) bad(`vite server.port ${vPort} ≠ hype.port ${hype.port}`, 'make them match')
    if (vPort && !/strictPort:\s*true/.test(vite)) warn('dev port isn\'t strict', 'add strictPort: true so it fails loudly instead of hopping to another app\'s port')
  }
  const nextCfg = ['next.config.js', 'next.config.mjs', 'next.config.ts'].map(read).find(Boolean)
  if (nextCfg && (!/output:\s*['"]export['"]/.test(nextCfg) || !/basePath/.test(nextCfg)))
    bad('Next.js isn\'t set up for static export under a sub-path', "add  output: 'export'  and  basePath: process.env.BASE_PATH?.replace(/\\/$/, '') || undefined")
  if (pkg.dependencies?.['react-scripts'] && pkg.homepage !== '.') bad('Create React App without "homepage": "."', 'add "homepage": "." to package.json')

  for (const lock of ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock'])
    if (existsSync(join(app, lock))) bad(`has its own ${lock}`, `delete it; the repo uses the root lockfile (run npm install at the root)`)
  if (pkg.packageManager) warn(`pins "packageManager": "${pkg.packageManager}"`, 'remove it; this repo uses npm workspaces')

  if (hype.site === false) out.push('  · not on the combined site ("site": false)')
  else if (!pkg.scripts?.build) bad('no "build" script', 'add one, or set "hype": { "site": false }')
  if (!pkg.scripts?.dev && hype.site !== false) warn('no "dev" script', `add one so  npm run dev -w @hype/${dir}  works`)

  for (const f of readdirSync(app)) {
    if (/^\.env(\..+)?$/.test(f) && !/\.(example|sample|template)$/.test(f)) warn(`${f} is in the app folder`, 'don\'t commit secrets: keep it out of git and commit a .env.example instead')
  }

  const roots = findRootPaths(app)
  if (roots.length) warn(`root-relative asset paths (break under /${dir}/):\n${roots.map((h) => `        ${h}`).join('\n')}`, 'use "./file", import the asset, or prefix with import.meta.env.BASE_URL')

  const keys = findUnprefixedStorage(app, dir)
  if (keys.length) warn(`storage keys without "${dir}:" prefix:\n${keys.map((k) => `        ${k}`).join('\n')}`, `prefix them, e.g. "${dir}:${keys[0].split(' ')[0]}", so apps on one domain don't overwrite each other`)

  if (!existsSync(join(app, 'README.md'))) warn('no README.md', 'add one with the owner, how to run it, and how to demo it')

  console.log(`\n${dir}  (${pkg.name} · port ${port || '?'})`)
  console.log(out.length ? out.join('\n') : '  ✓ all good')
}

// The README's port table should list every app.
const readme = readFileSync(join(appsDir, '..', 'README.md'), 'utf8')
const missing = dirs.filter((d) => !readJson(join(appsDir, d, 'package.json')).hype?.external && !new RegExp(`\\|\\s*${d}\\s*\\|`).test(readme))
if (missing.length) {
  warnings++
  console.log(`\nREADME\n  ⚠ port table is missing: ${missing.join(', ')}\n      → add a row under "How builds stay separate"`)
}

console.log(`\n${errors ? `✗ ${errors} problem(s)` : '✓ no blocking problems'}${warnings ? ` · ⚠ ${warnings} warning(s)` : ''}\n`)
process.exit(errors ? 1 : 0)
