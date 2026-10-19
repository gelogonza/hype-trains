#!/usr/bin/env node
// Bring a project someone already built into the monorepo as apps/<name>.
//
//   npm run import-app -- <source> <name> [--owner "Name"] [--subdir <path>]
//   npm run import-app -- apps/<name> <name> --in-place           (already in apps/, e.g. via git subtree)
//   npm run import-app -- --link <url> <name> [--owner "Name"]    (hosted elsewhere: just list it on the site)
//
// <source> can be a folder, a .zip (e.g. downloaded from Canvas/Drive/Bolt/Lovable) or a git URL.
// The importer finds the actual app inside nested folders, copies it without node_modules, build
// output, .git, lockfiles or secrets (.env), then makes it follow the repo rules: package name
// @hype/<name>, its own dev port, a build that works under /<name>/, deps from the root lockfile.
// Whatever it can't fix automatically is printed as a checklist.

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'
import { IGNORE_DIRS, NAME_RE, appsDir, findRootPaths, nextPort, readJson } from './lib.mjs'

/* ---------- arguments ---------- */

const args = process.argv.slice(2)
const VALUE_FLAGS = new Set(['--owner', '--subdir', '--link'])
const flag = (f) => {
  const i = args.indexOf(f)
  return i >= 0 ? args[i + 1] : undefined
}
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(args[i - 1]))
const linkUrl = flag('--link')
const owner = flag('--owner')
const subdir = flag('--subdir')
const inPlace = args.includes('--in-place')
const [src, name] = linkUrl ? [undefined, positional[0]] : positional

const die = (msg) => {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}
if (!name || (!src && !linkUrl)) {
  die(`Usage:
  npm run import-app -- <folder | file.zip | git-url> <name> [--owner "Name"] [--subdir <path>]
  npm run import-app -- apps/<name> <name> --in-place
  npm run import-app -- --link <url> <name> [--owner "Name"]`)
}
if (!NAME_RE.test(name)) die(`"${name}" must be lowercase kebab-case, e.g. boss-fight-train`)
const dest = join(appsDir, name)
const notes = [] // things the importer did that the person should know
const todo = [] // things only a human (or agent) can finish

/* ---------- link-only: hosted somewhere else ---------- */

if (linkUrl) {
  if (existsSync(dest)) die(`apps/${name} already exists.`)
  if (!/^https?:\/\//.test(linkUrl)) die('--link needs a full http(s) URL.')
  mkdirSync(dest, { recursive: true })
  writeFileSync(
    join(dest, 'package.json'),
    JSON.stringify({ name: `@hype/${name}`, private: true, version: '0.1.0', description: owner ? `${name} (${owner})` : name, hype: { external: linkUrl } }, null, 2) + '\n',
  )
  writeFileSync(
    join(dest, 'README.md'),
    `# ${name}\n\nOwner: ${owner ?? 'TBD'}\n\nHosted outside this repo: ${linkUrl}\n\nIt's listed on the combined site (\`npm run build:site\`) as a link. To bring the code in later:\n\`npm run import-app -- <folder|zip|git-url> ${name}-app\`\n`,
  )
  console.log(`\n✓ Added apps/${name} as a link to ${linkUrl}. It shows up on the combined site's hub page.\n`)
  process.exit(0)
}

/* ---------- 1. get the source onto disk (folder, zip or git) ---------- */

let source = resolve(src)
let temp
const isGit = /^(https?:\/\/.+\.git|git@.+:.+|https?:\/\/(github\.com|github\.iu\.edu|gitlab\.com|bitbucket\.org)\/[^/]+\/[^/]+\/?)$/.test(src)
if (isGit) {
  temp = mkdtempSync(join(tmpdir(), 'hype-import-'))
  console.log(`Cloning ${src} …`)
  const r = spawnSync('git', ['clone', '--depth', '1', src, join(temp, 'repo')], { stdio: 'inherit' })
  if (r.status !== 0) die(`Couldn't clone ${src}. Check the URL and that you have access (IU GitHub may ask you to sign in).`)
  source = join(temp, 'repo')
  notes.push('Cloned without history. To keep the commit history, use git subtree instead (see README).')
} else if (/\.zip$/i.test(src)) {
  if (!existsSync(source)) die(`Can't find ${source}`)
  temp = mkdtempSync(join(tmpdir(), 'hype-import-'))
  const r = spawnSync('unzip', ['-q', source, '-d', join(temp, 'zip')], { stdio: 'inherit' })
  if (r.status !== 0) die(`Couldn't unzip ${source}. Is it a normal .zip?`)
  source = join(temp, 'zip')
  // Zips usually wrap everything in one folder (plus macOS junk).
  const top = readdirSync(source).filter((f) => f !== '__MACOSX' && !f.startsWith('.'))
  if (top.length === 1 && statSync(join(source, top[0])).isDirectory()) source = join(source, top[0])
} else if (!existsSync(source)) {
  die(`Can't find ${source}`)
}

/* ---------- 2. find the actual app inside (nested folders, their own monorepo) ---------- */

const MARKERS = ['package.json', 'index.html', 'requirements.txt', 'pyproject.toml', 'app.py']
const looksLikeApp = (d) => MARKERS.some((m) => existsSync(join(d, m)))

function candidates(dir, depth = 0, out = []) {
  if (depth > 3) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (looksLikeApp(p)) out.push(p)
    else candidates(p, depth + 1, out)
  }
  return out
}

if (subdir) {
  source = join(source, subdir)
  if (!looksLikeApp(source)) die(`--subdir ${subdir} has no package.json or index.html.`)
} else if (!inPlace) {
  const rootPkg = existsSync(join(source, 'package.json')) ? readJson(join(source, 'package.json')) : null
  const isTheirMonorepo = rootPkg?.workspaces || existsSync(join(source, 'pnpm-workspace.yaml')) || existsSync(join(source, 'turbo.json'))
  if (!looksLikeApp(source) || isTheirMonorepo) {
    const found = candidates(source)
    const web = found.filter((p) => existsSync(join(p, 'index.html')) || /vite|next|react-scripts|astro|svelte|parcel|@angular|expo/.test(existsSync(join(p, 'package.json')) ? readFileSync(join(p, 'package.json'), 'utf8') : ''))
    const pick = web.length === 1 ? web[0] : found.length === 1 ? found[0] : null
    if (pick) {
      notes.push(`The app was nested at ${relative(source, pick) || '.'}/, so that's what was imported.`)
      const leftBehind = found.filter((p) => p !== pick).map((p) => relative(source, p))
      if (leftBehind.length)
        todo.push(`Not imported: ${leftBehind.join(', ')}. If the app needs it (e.g. an API server), run it separately while demoing, or mock it in the front end.`)
      source = pick
    } else if (found.length) {
      die(`This project has several parts. Pick the web front end with --subdir:\n${found.map((p) => `    --subdir ${relative(source, p)}`).join('\n')}`)
    } else if (!looksLikeApp(source)) {
      die('No package.json, index.html or Python app found. Is this the right folder? If it\'s hosted somewhere (Figma, Streamlit, Replit…), use --link <url> instead.')
    }
  }
}

/* ---------- 3. copy (skip deps, builds, git, lockfiles, secrets) ---------- */

const LOCKFILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']
const skippedSecrets = []
const keep = (p) => {
  const b = basename(p)
  if (IGNORE_DIRS.has(b) || LOCKFILES.includes(b) || b === '.DS_Store' || b === '__MACOSX') return false
  if (/^\.env(\..+)?$/.test(b) && !/\.(example|sample|template)$/.test(b)) {
    skippedSecrets.push(relative(source, p))
    return false
  }
  return true
}

if (inPlace) {
  if (resolve(source) !== resolve(dest)) die(`--in-place expects the project to already be at apps/${name}`)
  for (const f of ['node_modules', '.git', ...LOCKFILES]) rmSync(join(dest, f), { recursive: true, force: true })
  for (const f of readdirSync(dest)) if (/^\.env(\..+)?$/.test(f) && !/\.(example|sample|template)$/.test(f)) skippedSecrets.push(f)
} else {
  if (existsSync(dest)) die(`apps/${name} already exists. Pick another name, or use --in-place.`)
  cpSync(source, dest, { recursive: true, filter: keep })
}
if (temp) rmSync(temp, { recursive: true, force: true })

/* ---------- 4. figure out what it is ---------- */

const port = nextPort()
const pkgPath = join(dest, 'package.json')
const hasPkg = existsSync(pkgPath)
const pkg = hasPkg ? readJson(pkgPath) : {}
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const has = (d) => Boolean(deps[d])
const fileHas = (f) => existsSync(join(dest, f))

const kind = has('next')
  ? 'next'
  : has('react-scripts')
    ? 'cra'
    : has('astro')
      ? 'astro'
      : has('@sveltejs/kit')
        ? 'sveltekit'
        : has('@angular/core')
          ? 'angular'
          : has('expo')
            ? 'expo'
            : has('vite')
              ? 'vite'
              : has('parcel')
                ? 'parcel'
                : has('webpack')
                  ? 'webpack'
                  : fileHas('requirements.txt') || fileHas('pyproject.toml') || fileHas('app.py')
                    ? 'python'
                    : fileHas('index.html')
                      ? 'static'
                      : 'other'

const backend = ['express', 'fastify', 'koa', 'hono', '@nestjs/core', 'socket.io', 'mongoose', 'prisma', 'pg', 'mysql2'].filter(has)

/* ---------- 5. make it follow the rules ---------- */

pkg.name = `@hype/${name}`
pkg.private = true
pkg.version ??= '0.1.0'
pkg.description = owner ? `${pkg.description ?? name} (${owner})` : (pkg.description ?? name)
pkg.scripts ??= {}
delete pkg.packageManager // a pinned yarn/pnpm would fight the root npm workspace
delete pkg.workspaces

const baseLine = `base: process.env.BASE_PATH ?? '/'`
const viteBits = `\n  ${baseLine},\n  server: { port: ${port}, strictPort: true },\n  preview: { port: ${port - 1000}, strictPort: true },`

function patchVite() {
  const cfgName = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].find(fileHas)
  if (!cfgName) {
    writeFileSync(join(dest, 'vite.config.js'), `import { defineConfig } from 'vite'\n\nexport default defineConfig({${viteBits}\n})\n`)
    return
  }
  const p = join(dest, cfgName)
  const cfg = readFileSync(p, 'utf8')
  const outDir = cfg.match(/outDir:\s*['"]([^'"]+)['"]/)?.[1]
  if (outDir) pkg.hype.out = outDir
  if (/defineConfig\(\{/.test(cfg) && !/\bbase\s*:/.test(cfg) && !/\bserver\s*:/.test(cfg)) {
    writeFileSync(p, cfg.replace(/defineConfig\(\{/, `defineConfig({${viteBits}`))
  } else if (/defineConfig\(\s*\(/.test(cfg) || /defineConfig\(\s*async/.test(cfg)) {
    todo.push(`${cfgName} uses a function config. Inside the returned object add:  ${baseLine},  server: { port: ${port}, strictPort: true }`)
  } else {
    todo.push(`${cfgName}: set  ${baseLine}  and  server: { port: ${port}, strictPort: true }  (it already has base/server, so I didn't overwrite them).`)
  }
}

switch (kind) {
  case 'vite':
    pkg.hype = { port, out: 'dist' }
    patchVite()
    break
  case 'next':
    pkg.hype = { port, out: 'out' }
    pkg.scripts.dev = `next dev -p ${port}`
    todo.push(`next.config: add  output: 'export'  and  basePath: process.env.BASE_PATH?.replace(/\\/$/, '') || undefined  (static export; API routes / server actions won't run on the shared site).`)
    break
  case 'cra':
    pkg.hype = { port, out: 'build' }
    pkg.homepage = '.'
    pkg.scripts.dev = `cross-env PORT=${port} BROWSER=none react-scripts start`
    if (!has('cross-env')) (pkg.devDependencies ??= {})['cross-env'] = '^7.0.3'
    notes.push('Create React App: set "homepage": "." so assets load from any sub-path.')
    todo.push('If it uses React Router, switch BrowserRouter → HashRouter so deep links work on the shared site.')
    break
  case 'astro':
    pkg.hype = { port, out: 'dist' }
    pkg.scripts.dev = `astro dev --port ${port}`
    todo.push(`astro.config: add  ${baseLine}  (static output).`)
    break
  case 'sveltekit':
    pkg.hype = { port, out: 'build' }
    pkg.scripts.dev = `vite dev --port ${port} --strictPort`
    todo.push(`Use @sveltejs/adapter-static and set kit.paths.base to process.env.BASE_PATH?.replace(/\\/$/, '') ?? ''.`)
    break
  case 'angular':
    pkg.hype = { port, out: `dist/${pkg.name.split('/')[1]}/browser` }
    pkg.scripts.dev = `ng serve --port ${port}`
    pkg.scripts.build = 'ng build --base-href ./'
    todo.push('Check angular.json\'s outputPath and set "hype.out" in package.json to match (usually dist/<project>/browser).')
    break
  case 'expo':
    pkg.hype = { port, out: 'dist' }
    pkg.scripts.dev = `expo start --web --port ${port}`
    pkg.scripts.build = 'expo export -p web'
    todo.push('Expo: only the web export goes on the shared site. Set "experiments.baseUrl" in app.json to /<name> if links break. Phone-only features need Expo Go to demo.')
    break
  case 'parcel':
    pkg.hype = { port, out: 'dist' }
    pkg.scripts.dev = `parcel index.html --port ${port}`
    pkg.scripts.build = 'parcel build index.html --public-url ./'
    if (!fileHas('index.html')) todo.push('Parcel: point the dev/build scripts at your real entry file instead of index.html.')
    break
  case 'webpack':
    pkg.hype = { port, out: 'dist' }
    todo.push(`webpack: set devServer.port = ${port}, output.publicPath = 'auto' (or './'), and make sure "hype.out" matches output.path.`)
    if (!pkg.scripts.dev && pkg.scripts.start) pkg.scripts.dev = pkg.scripts.start
    break
  case 'static':
    // Plain HTML/CSS/JS (or CDN React): serve and build it with Vite, no code changes needed.
    pkg.type = 'module'
    pkg.hype = { port, out: 'dist' }
    pkg.scripts = { ...pkg.scripts, dev: 'vite', build: 'vite build', preview: 'vite preview' }
    pkg.devDependencies = { ...pkg.devDependencies, vite: '^8.3.0' }
    writeFileSync(join(dest, 'vite.config.js'), `import { defineConfig } from 'vite'\n\nexport default defineConfig({${viteBits}\n})\n`)
    notes.push('Plain HTML/CSS/JS: added a tiny Vite setup to serve and build it. Your files are unchanged.')
    break
  case 'python':
    pkg.hype = { port, site: false }
    todo.push('Python app (Streamlit/Flask/Jupyter): it can\'t go on the static site. Either host it (e.g. Streamlit Cloud) and run  npm run import-app -- --link <url> <name>-live , or keep it here for code review only (it is skipped by build:site).')
    break
  default:
    pkg.hype = { port, out: 'dist' }
    todo.push(`Unknown setup. Make "dev" run on port ${port} and "build" produce static files that work under /${name}/, then set "hype.out" to that folder. Or, if it's hosted elsewhere, use --link.`)
}

if (!pkg.scripts.dev && pkg.scripts.start && kind !== 'python') pkg.scripts.dev = pkg.scripts.start
if (!pkg.scripts.build && pkg.hype.site !== false) todo.push('No "build" script. Add one, or set "hype": { "site": false } to keep it out of the combined site.')
if (/\btsc\b/.test(pkg.scripts.build ?? '')) notes.push('Its build type-checks first (tsc). If it fails on type errors in generated code, see README → "Troubleshooting".')

if (backend.length) {
  todo.push(
    `It has server code (${backend.join(', ')}). The shared site is static, so: run the server separately while demoing, mock the API in the front end, or host the server and point the app at it. If the front end can't work without it, set "hype": { ..., "site": false }.`,
  )
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

/* ---------- 6. things that will bite later ---------- */

if (skippedSecrets.length) {
  notes.push(`Left out secret files: ${skippedSecrets.join(', ')}. Share keys privately, and commit a .env.example with the variable names instead.`)
}
if (deps.react && !/^\^?~?19\./.test(deps.react)) notes.push(`Uses React ${deps.react} (hype-pass uses 19). That's fine, npm keeps a separate copy for this app.`)
if (pkg.engines?.node) notes.push(`It asks for Node ${pkg.engines.node}; this repo runs on Node 20.19+.`)

const rootPaths = findRootPaths(dest)
if (rootPaths.length) {
  todo.push(
    `Hard-coded root paths will break under /${name}/ on the shared site. Use relative paths ("./img.png"), import the asset, or prefix with import.meta.env.BASE_URL:\n${rootPaths.map((h) => `      ${h}`).join('\n')}`,
  )
}

if (!fileHas('README.md')) {
  writeFileSync(join(dest, 'README.md'), `# ${name}\n\nOwner: ${owner ?? 'TBD'}\n\n\`\`\`bash\nnpm run dev -w @hype/${name}     # http://localhost:${port}\nnpm run build -w @hype/${name}\n\`\`\`\n\nDescribe the concept and how to demo it here.\n`)
}

console.log(`
✓ Imported apps/${name}  (@hype/${name} · ${kind} · dev port ${port})
${notes.length ? `\nGood to know:\n${notes.map((n) => `  • ${n}`).join('\n')}\n` : ''}${todo.length ? `\nStill to do:\n${todo.map((t) => `  □ ${t}`).join('\n')}\n` : ''}
Next:
  npm install                        # from the repo root
${pkg.hype.site === false && !pkg.scripts.dev ? '' : `  npm run dev -w @hype/${name}       # http://localhost:${port}\n  npm run build -w @hype/${name}     # make sure it builds on its own\n`}  npm run doctor -- ${name}          # re-check everything above
`)
