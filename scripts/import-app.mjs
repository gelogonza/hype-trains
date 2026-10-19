#!/usr/bin/env node
// Bring a project someone already built into the monorepo as apps/<name>.
//
//   npm run import-app -- <path-to-project> <name> [--owner "Name"]
//   npm run import-app -- apps/<name> <name> --in-place      (already copied in, e.g. via git subtree)
//
// It copies the project (minus node_modules, build output, its own .git and lockfile), then makes
// it follow the repo's rules: package name @hype/<name>, its own dev port, a build that can live
// under /<name>/ on the combined site, and dependencies installed from the root lockfile.
// Supported: Vite (incl. Bolt / Lovable / v0 / Figma Make exports), Next.js, Create React App,
// and plain HTML/CSS/JS. Anything else is copied and you get a checklist.

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { NAME_RE, appsDir, nextPort, readJson } from './lib.mjs'

const args = process.argv.slice(2)
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--owner')
const [src, name] = positional
const inPlace = args.includes('--in-place')
const ownerIdx = args.indexOf('--owner')
const owner = ownerIdx >= 0 ? args[ownerIdx + 1] : undefined

const usage = () => {
  console.error('Usage: npm run import-app -- <path-to-project> <name> [--owner "Name"] [--in-place]')
  process.exit(1)
}
if (!src || !name) usage()
if (!NAME_RE.test(name)) {
  console.error(`"${name}" must be lowercase kebab-case, e.g. boss-fight-train`)
  process.exit(1)
}

const source = resolve(src)
const dest = join(appsDir, name)
if (!existsSync(source)) {
  console.error(`Can't find ${source}`)
  process.exit(1)
}

/* ---------- 1. copy (skip deps, builds, git and lockfiles) ---------- */

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.vercel', '.turbo', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock', '.DS_Store'])

if (inPlace) {
  if (resolve(source) !== resolve(dest)) {
    console.error(`--in-place expects the project to already be at apps/${name}`)
    process.exit(1)
  }
  for (const f of ['node_modules', '.git', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']) rmSync(join(dest, f), { recursive: true, force: true })
} else {
  if (existsSync(dest)) {
    console.error(`apps/${name} already exists. Pick another name or use --in-place.`)
    process.exit(1)
  }
  cpSync(source, dest, { recursive: true, filter: (p) => !SKIP.has(basename(p)) })
}

/* ---------- 2. figure out what it is ---------- */

const port = nextPort()
const pkgPath = join(dest, 'package.json')
const hasPkg = existsSync(pkgPath)
const pkg = hasPkg ? readJson(pkgPath) : {}
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const kind = deps.next ? 'next' : deps['react-scripts'] ? 'cra' : deps.vite ? 'vite' : hasPkg ? 'other' : existsSync(join(dest, 'index.html')) ? 'static' : 'other'
const todo = []

/* ---------- 3. make it follow the rules ---------- */

pkg.name = `@hype/${name}`
pkg.private = true
pkg.version ??= '0.1.0'
if (owner) pkg.description = pkg.description ? `${pkg.description} (${owner})` : `${name} (${owner})`
pkg.scripts ??= {}

if (kind === 'vite') {
  pkg.hype = { port, out: 'dist' }
  const cfgName = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].find((f) => existsSync(join(dest, f)))
  const cfgPath = cfgName && join(dest, cfgName)
  const cfg = cfgPath ? readFileSync(cfgPath, 'utf8') : ''
  const inject = `\n  base: process.env.BASE_PATH ?? '/',\n  server: { port: ${port}, strictPort: true },\n  preview: { port: ${port - 1000}, strictPort: true },`
  if (cfgPath && /defineConfig\(\{/.test(cfg) && !/\bbase\s*:/.test(cfg) && !/\bserver\s*:/.test(cfg)) {
    writeFileSync(cfgPath, cfg.replace(/defineConfig\(\{/, `defineConfig({${inject}`))
  } else if (!cfgPath) {
    writeFileSync(join(dest, 'vite.config.js'), `import { defineConfig } from 'vite'\n\nexport default defineConfig({${inject}\n})\n`)
  } else {
    todo.push(`Edit ${cfgName}: add  base: process.env.BASE_PATH ?? '/'  and  server: { port: ${port}, strictPort: true }`)
  }
} else if (kind === 'next') {
  pkg.hype = { port, out: 'out' }
  pkg.scripts.dev = `next dev -p ${port}`
  todo.push(
    `next.config: add  output: 'export'  and  basePath: process.env.BASE_PATH?.replace(/\\/$/, '') || undefined  so it can be hosted under /${name}/ (static export only; no server routes).`,
  )
} else if (kind === 'cra') {
  pkg.hype = { port, out: 'build' }
  pkg.homepage = '.' // relative asset URLs, so it works under any sub-path
  pkg.scripts.dev = `cross-env PORT=${port} react-scripts start`
  if (!deps['cross-env']) (pkg.devDependencies ??= {})['cross-env'] = '^7.0.3'
  todo.push('Create React App uses relative URLs now ("homepage": "."). If it uses React Router, switch to HashRouter for the combined site.')
} else if (kind === 'static') {
  // Plain HTML/CSS/JS: serve and build it with Vite, no code changes needed.
  pkg.type = 'module'
  pkg.hype = { port, out: 'dist' }
  pkg.scripts = { dev: 'vite', build: 'vite build', preview: 'vite preview' }
  pkg.devDependencies = { vite: '^8.3.0' }
  writeFileSync(
    join(dest, 'vite.config.js'),
    `import { defineConfig } from 'vite'\n\nexport default defineConfig({\n  base: process.env.BASE_PATH ?? '/',\n  server: { port: ${port}, strictPort: true },\n  preview: { port: ${port - 1000}, strictPort: true },\n})\n`,
  )
} else {
  pkg.hype = { port, out: 'dist' }
  todo.push(`Unknown stack: make "dev" run on port ${port}, and "build" output a static site (set "hype.out" to its folder) that works under /${name}/.`)
}

if (!pkg.scripts.dev && pkg.scripts.start) pkg.scripts.dev = pkg.scripts.start
if (!pkg.scripts.build) todo.push('Add a "build" script so it can be included in the combined site.')

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

const react = deps.react
if (react && !/\^?19\./.test(react)) todo.push(`It uses React ${react} (hype-pass uses 19). That's fine, npm keeps a separate copy for it, but don't mix versions inside one app.`)

console.log(`
Imported apps/${name}  (@hype/${name}, ${kind}, dev port ${port})
${todo.length ? `\nStill to do:\n${todo.map((t) => `  • ${t}`).join('\n')}\n` : ''}
Next:
  npm install                       # from the repo root, installs its deps into the shared lockfile
  npm run dev -w @hype/${name}      # http://localhost:${port}
  npm run build -w @hype/${name}    # make sure it still builds
`)
