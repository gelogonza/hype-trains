#!/usr/bin/env node
// Build every app separately and collect them into one static site:
//
//   site/
//     index.html          hub page linking to each prototype
//     hype-pass/          apps/hype-pass/dist, built with base /hype-pass/
//     <teammate-app>/     ...
//
// Each app still builds on its own (its own Vite build, its own dist), so one app failing
// doesn't touch the others. Set SITE_BASE when hosting under a sub-path, e.g. GitHub Pages:
//   SITE_BASE=/hype-train-dreams/ npm run build:site

import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildOutput, root } from './lib.mjs'
const siteBase = (process.env.SITE_BASE ?? '/').replace(/\/?$/, '/')
const out = join(root, 'site')
const only = process.argv.slice(2)

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const built = []
const failed = []

for (const dir of readdirSync(join(root, 'apps')).sort()) {
  const pkgPath = join(root, 'apps', dir, 'package.json')
  if (!existsSync(pkgPath)) continue
  if (only.length && !only.includes(dir)) continue
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  if (!pkg.scripts?.build) continue

  console.log(`\n▶ Building ${pkg.name} → ${siteBase}${dir}/`)
  const r = spawnSync('npm', ['run', 'build', '-w', pkg.name], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, BASE_PATH: `${siteBase}${dir}/` },
  })
  if (r.status !== 0) {
    failed.push(pkg.name)
    continue
  }
  // Vite builds to dist/, Create React App to build/, Next.js static export to out/.
  const output = buildOutput(dir)
  if (!output) {
    console.error(`  ${pkg.name} built, but no dist/, build/ or out/ folder was found. Set "hype.out" in its package.json.`)
    failed.push(pkg.name)
    continue
  }
  cpSync(output, join(out, dir), { recursive: true })
  built.push({ dir, name: pkg.name, description: pkg.description ?? '' })
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hype Train Dreams — prototypes</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0e0e10; color: #efeff1; }
  main { max-width: 720px; margin: 0 auto; padding: 40px 16px; }
  h1 { margin: 0 0 4px; }
  p { color: #adadb8; }
  ul { list-style: none; padding: 0; display: grid; gap: 10px; }
  a { display: block; padding: 16px; border-radius: 10px; background: #1f1f23; color: inherit; text-decoration: none; border: 1px solid #2f2f35; }
  a:hover { border-color: #9147ff; }
  b { color: #bf94ff; }
  small { display: block; color: #adadb8; margin-top: 4px; }
</style>
</head>
<body>
<main>
  <h1>Hype Train Dreams</h1>
  <p>I441 Project 2 · one prototype per teammate</p>
  <ul>
${built.map((a) => `    <li><a href="${siteBase}${a.dir}/"><b>${esc(a.name)}</b><small>${esc(a.description)}</small></a></li>`).join('\n')}
  </ul>
</main>
</body>
</html>
`,
)

console.log(`\n✓ site/ ready with ${built.length} app(s)${failed.length ? ` — failed: ${failed.join(', ')}` : ''}`)
if (failed.length) process.exit(1)
