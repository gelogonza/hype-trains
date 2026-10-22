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
const skipped = []

for (const dir of readdirSync(join(root, 'apps')).sort()) {
  const pkgPath = join(root, 'apps', dir, 'package.json')
  if (!existsSync(pkgPath)) continue
  if (only.length && !only.includes(dir)) continue
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  // Hosted elsewhere (import-app --link): just link to it from the hub.
  if (pkg.hype?.external) {
    built.push({ dir, name: pkg.name, description: pkg.description ?? '', href: pkg.hype.external })
    continue
  }
  // Opted out (e.g. a Python app or one that needs its own server).
  if (pkg.hype?.site === false || !pkg.scripts?.build) {
    skipped.push(pkg.name)
    continue
  }

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

// Add a floating "Prototypes" switcher to each built app's index.html so you can jump between
// apps without going back to the hub. It lives in a Shadow DOM, so app CSS can't touch it (or vice versa),
// and only the copy in site/ changes. Each app's own dist/ stays as it was.
const links = [
  { dir: '', label: 'All prototypes', href: siteBase },
  ...built.map((a) => ({ dir: a.dir, label: a.dir, href: a.href ?? `${siteBase}${a.dir}/`, external: !!a.href })),
]
for (const a of built) {
  if (a.href) continue
  const indexPath = join(out, a.dir, 'index.html')
  if (!existsSync(indexPath)) continue
  const html = readFileSync(indexPath, 'utf8')
  const tag = `<script>${switcherScript(links, a.dir)}</script>`
  const at = html.toLowerCase().lastIndexOf('</body>')
  writeFileSync(indexPath, at === -1 ? html + tag : html.slice(0, at) + tag + html.slice(at))
}

function switcherScript(links, current) {
  // Escape "<" so a label can never close the <script> tag early.
  const data = JSON.stringify({ links, current }).replace(/</g, '\\u003c')
  return `(function(){var d=${data};if(document.querySelector('hype-site-switcher'))return;
var host=document.createElement('hype-site-switcher');var r=host.attachShadow({mode:'open'});
r.innerHTML='<style>:host{all:initial;position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483647;font:500 13px/1.3 Inter,system-ui,sans-serif}'
+'button{all:unset;cursor:pointer;padding:8px 12px;border-radius:999px;background:#1f1f23e6;color:#efeff1;border:1px solid #9147ff;box-shadow:0 2px 10px #0008}'
+'button:focus-visible,a:focus-visible{outline:2px solid #bf94ff;outline-offset:2px}'
+'nav{display:none;position:absolute;right:0;bottom:calc(100% + 8px);min-width:180px;padding:6px;border-radius:10px;background:#1f1f23;border:1px solid #2f2f35;box-shadow:0 4px 18px #000a}'
+':host([open]) nav{display:block}a{display:block;padding:8px 10px;border-radius:6px;color:#efeff1;text-decoration:none}'
+'a:hover{background:#2f2f35}a[aria-current]{color:#bf94ff;font-weight:700}</style><nav aria-label="Prototypes"></nav><button type="button" aria-expanded="false">\\u2630 Prototypes</button>';
var nav=r.querySelector('nav'),btn=r.querySelector('button');
d.links.forEach(function(l){var a=document.createElement('a');a.href=l.href;a.textContent=l.label+(l.external?' \\u2197':'');
if(l.external){a.target='_blank';a.rel='noopener'}if(l.dir===d.current)a.setAttribute('aria-current','page');nav.appendChild(a)});
function set(o){o?host.setAttribute('open',''):host.removeAttribute('open');btn.setAttribute('aria-expanded',String(o))}
btn.addEventListener('click',function(e){e.stopPropagation();set(!host.hasAttribute('open'))});
document.addEventListener('click',function(e){if(!e.composedPath().includes(host))set(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
document.body.appendChild(host)})();`
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
${built.map((a) => `    <li><a href="${a.href ?? `${siteBase}${a.dir}/`}"${a.href ? ' target="_blank" rel="noopener"' : ''}><b>${esc(a.name)}${a.href ? ' ↗' : ''}</b><small>${esc(a.description)}</small></a></li>`).join('\n')}
  </ul>
</main>
</body>
</html>
`,
)

console.log(`\n✓ site/ ready with ${built.length} app(s)${skipped.length ? ` · skipped (site: false / no build): ${skipped.join(', ')}` : ''}${failed.length ? ` · FAILED: ${failed.join(', ')}` : ''}`)
if (failed.length) process.exit(1)
