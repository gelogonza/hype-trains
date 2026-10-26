# Hype Train Dreams

**I441 Project 2, sponsored by Twitch.** Each teammate builds their own Hype Train concept as a separate app in this repo. Every app has its own folder, dependencies, dev port and build output, so nobody's work collides with anyone else's. One command also publishes all of them together on a single site.

```
hype-train-dreams/
  apps/
    hype-pass/          Angelo: Hype Train Station + Hype Pass   (port 5101)
    battle-boss/        Ryanna: Battle Boss poll, mobile          (port 5102)
    avatar-unlock/      Drew: community cosmetic unlock           (port 5103)
    community-reward-run/  Drew: multi-level community reward run (port 5104)
    final-prototype/    Thejas: Community Climb, final prototype (port 5105)
    <your-app>/         one folder per teammate concept
  packages/             shared code, only once two apps need the same thing (empty for now)
  templates/app/        starter used by `npm run new-app`
  scripts/              new-app, import-app, doctor, build-site (+ lib.mjs helpers)
  package.json          npm workspaces root, with the only lockfile
  AGENTS.md             instructions for AI coding agents (CLAUDE.md loads it)
```

> **Using an AI agent?** Point it at `AGENTS.md`. It tells the agent to read this README and the scripts first, then import or create apps without breaking anyone else's build.

## Setup

Requires Node 20.19+ (see `.nvmrc`).

```bash
npm install          # always at the repo root, never inside an app
```

## Everyday commands

| Task | Command |
| --- | --- |
| Run one app | `npm run dev -w @hype/<app>` |
| Build one app | `npm run build -w @hype/<app>` → `apps/<app>/dist` |
| Build every app | `npm run build` |
| Add a dependency to your app | `npm install <pkg> -w @hype/<app>` |
| Start a new app | `npm run new-app -- <name> --title "Concept" --owner "You"` then `npm install` |
| Bring in a project you already built | `npm run import-app -- <folder \| .zip \| git-url> <name> --owner "You"` then `npm install` |
| List something hosted elsewhere | `npm run import-app -- --link <url> <name> --owner "You"` |
| Check apps follow the rules | `npm run doctor` (or `npm run doctor -- <app>`) |
| Build the combined site | `npm run build:site` → `site/` (add `SITE_BASE=/repo-name/` for GitHub Pages) |
| Preview the combined site | `npm run preview:site` |

## Starting your own app

```bash
npm run new-app -- boss-fight-train --title "Boss Fight Train" --owner "Sam"
npm install
npm run dev -w @hype/boss-fight-train
```

This creates `apps/boss-fight-train` from the template, with:
- the package name `@hype/boss-fight-train`
- the next free dev port, printed in the output
- its own README for your demo notes

It's a plain Vite + React + TypeScript app. You can restyle it, swap libraries, or add three.js, and none of it affects anyone else's app.

## Bringing in a project you already built

You don't need to start over. Import your existing project as its own app. The source can be a **folder**, a **.zip** (e.g. downloaded from Canvas, Drive, Bolt or Lovable) or a **git URL**:

```bash
npm run import-app -- ~/path/to/my-project boss-fight-train --owner "Sam"
npm run import-app -- ~/Downloads/my-project.zip boss-fight-train --owner "Sam"
npm run import-app -- https://github.iu.edu/sam/boss-fight.git boss-fight-train --owner "Sam"

npm install
npm run dev -w @hype/boss-fight-train
npm run build -w @hype/boss-fight-train
npm run doctor -- boss-fight-train
```

The importer:
1. **Finds the actual app.** If it's nested (`my-project/frontend/`, `client/`, their own monorepo), it picks the web front end, or asks you to choose with `--subdir <path>`. It also tells you which parts it left behind, such as a `server/` folder.
2. **Copies** the app into `apps/boss-fight-train`. Your original folder is untouched. It leaves out `node_modules`, build output (`dist`/`build`/`out`/`.next`…), the old `.git`, the lockfile (this repo has one shared lockfile) and **secret `.env` files**. `.env.example` is kept.
3. **Renames** the package to `@hype/boss-fight-train`, gives it the next free dev port, and removes a pinned `packageManager` (yarn/pnpm) that would fight npm.
4. **Sets it up for its stack** so it builds on its own and works under `/boss-fight-train/` on the combined site:

| Your project | What the importer does | Anything left for you |
| --- | --- | --- |
| **Vite** (also Bolt, Lovable, v0, Figma Make, most Codespaces starters) | Adds `base` + a fixed port to `vite.config` | Only if your config is unusual (it tells you) |
| **Plain HTML / CSS / JS** | Adds a tiny Vite setup to serve and build it; your files stay as they are | Use relative paths (`./style.css`, not `/style.css`) |
| **Next.js** | Pins the dev port; build output is `out/` | Add `output: 'export'` and `basePath` to `next.config` (it prints the exact lines) |
| **Create React App** | Pins the port, sets `"homepage": "."`; build output is `build/` | Use `HashRouter` if you use React Router |
| **Vue / Svelte / Solid on Vite** | Same as Vite | — |
| **Astro / SvelteKit** | Pins the port and output folder | Set `base` (Astro) or `adapter-static` + `paths.base` (SvelteKit); it prints how |
| **Angular** | Pins the port, builds with `--base-href ./` | Check the output folder (`hype.out`) |
| **Parcel / Webpack** | Pins the port and relative public path | Webpack: `output.publicPath` (it prints how) |
| **Expo / React Native** | Uses the web export | Phone-only features need Expo Go to demo |
| **Has a backend** (Express, Prisma, Mongo…) | Imports the front end and flags the server | Run the server separately for demos, mock the API, or set `"site": false` |
| **Python** (Streamlit, Flask, Jupyter) | Keeps it for code review, off the static site | Host it, then add a link with `--link` |
| **Something else** | Copies it and gives it a port | Follow the checklist it prints |
5. **Scans for things that break later,** like asset paths hard-coded to the domain root (`"/img/logo.png"`). It prints them with file and line numbers.

**Different library versions are fine.** If your project uses another React or Vite version, npm keeps a separate copy just for your app. If `npm install` complains about peer dependencies, try `npm install --legacy-peer-deps` and tell the group.

### Keeping your git history (optional)

If your project is already its own git repo and you want its commit history, pull it in with `git subtree` first, then run the importer **in place**:

```bash
git subtree add --prefix=apps/boss-fight-train https://github.iu.edu/<you>/<your-repo>.git main
npm run import-app -- apps/boss-fight-train boss-fight-train --in-place
npm install
```

`--in-place` makes the same fixes without copying, and removes the subtree's own `node_modules` and lockfile.

### It's hosted somewhere else, or isn't code at all

For a Figma prototype, a deployed Vercel/Netlify site, Streamlit Cloud or Replit, add it as a **link**. It shows up on the combined site's hub page with ↗ and nothing gets built:

```bash
npm run import-app -- --link https://www.figma.com/proto/... boss-fight-proto --owner "Sam"
```

### Troubleshooting: "they didn't build it the way we expected"

Run `npm run doctor -- <app>` first. It checks every rule below and prints a fix next to each problem.

| Symptom | Cause | Fix |
| --- | --- | --- |
| Works on localhost, blank page or broken images on the shared site | Paths hard-coded to the domain root (`"/logo.png"`) | Use `"./logo.png"`, `import logo from './logo.png'`, or `import.meta.env.BASE_URL + 'logo.png'` |
| Deep links 404 on the shared site | `BrowserRouter` on a static host | Use `HashRouter`, or set `basename={import.meta.env.BASE_URL}` and link from the app's home page |
| `npm run build` fails on TypeScript errors in AI-generated code | The build runs `tsc` first | Fix the types, or temporarily change `"build"` to `vite build` and note it in the app README |
| `npm install` fails with ERESOLVE / peer deps | Old or mismatched library versions | `npm install --legacy-peer-deps`, then tell the group; or update the library |
| "Port already in use" | Two apps on the same port | `npm run doctor` shows which; change `hype.port` and `server.port` together |
| App calls `localhost:3000/api` | It needs its own backend | Run the server alongside while demoing, mock the data, or set `"site": false` |
| It needs API keys | `.env` was intentionally not copied | Share keys privately; commit `.env.example`; never commit real keys |
| Settings leak between apps on the shared site | Same `localStorage` key names | Prefix keys with the app name (`my-app:volume`) |
| Uses yarn/pnpm commands in its scripts | Different package manager | Replace them with `npm run …`; the root `npm install` handles everything |
| Several things in one zip / repo | Front end + server + docs together | Re-run with `--subdir <the front end folder>` |
| A file sits loose in `apps/` (e.g. `apps/My_Prototype.html`) and isn't on the site | Uploaded through GitHub's "Add files via upload", so it has no app folder | Put it in a folder as `index.html`, run `npm run import-app -- <that folder> <name> --owner "You"`, then delete the loose file |

Still stuck? Open the app in an AI agent and point it at `AGENTS.md`. It knows these rules and the scripts.

## How builds stay separate

- **Folder and package name:** each app has its own (`@hype/<app>`). Run commands with `-w @hype/<app>` so they only touch your app.
- **Dev ports:** each app has a fixed port (also recorded as `hype.port` in its `package.json`), so two dev servers never fight over 5173. If your port is taken, Vite fails loudly instead of silently moving to another.

  | App | Dev | Preview |
  | --- | --- | --- |
  | hype-pass | 5101 | 4101 |
  | battle-boss | 5102 | 4102 |
  | avatar-unlock | 5103 | 4103 |
  | community-reward-run | 5104 | 4104 |
  | final-prototype | 5105 | 4105 |
  | *(next app)* | 5105 | 4105 |

- **Build output:** each app builds to its own folder (`dist/`, or `build/` / `out/` for Create React App / Next.js, set as `hype.out`). `npm run build:site` builds them **one at a time**, each with its own base path (`/hype-pass/`, `/boss-fight-train/`…). If one app fails to build, the others still get published.
- **Styles:** CSS Modules scope class names per app. Keep global CSS (tokens, resets) inside your own app.
- **Browser storage:** apps hosted on the same domain share `localStorage`, so **prefix your keys with your app name** (e.g. `hype-pass:sound-muted`).
- **Dependencies:** there's one root lockfile, and npm workspaces deduplicate shared packages. Keep **React on the same version** across apps so there's only one copy. If you need something unusual, install it with `-w` so it only lands in your app's `package.json`.
- **Shared code:** don't import from another app's folder. If two apps need the same thing (Twitch tokens, a chat mock), move it to `packages/<name>` with its own `package.json` (e.g. `@hype/twitch-tokens`) and depend on it like any other package.

## Team workflow

- **Branches:** one branch per feature or app, e.g. `sam/boss-fight-train`, merged with a pull request. Keep changes inside your own `apps/<app>` folder. Changes to the root `package.json`, `scripts/` or `packages/` need a heads-up in the group chat.
- **Uploading on the GitHub website:** upload into your own `apps/<app>/` folder (e.g. replace `apps/avatar-unlock/index.html`), not into `apps/` itself. A loose file there isn't an app and won't show up on the site.
- **Before you push:** run `npm run build -w @hype/<app>`. Optionally run `npm run build` to check you didn't break the shared lockfile for others.
- **Canvas upload:** zip your own `apps/<app>` folder (without `node_modules` or `dist`), or share the combined `site/`.

## Deploying (optional)

- **Live site (Vercel):** **https://hype-trains.vercel.app**, with each app at `/<app>/` (e.g. `/hype-pass/`). The Vercel project `hype-trains` is connected to `github.com/gelogonza/hype-trains` (build command `npm run build:site`, output `site`, Node 22) and redeploys on every push to `main`. Branches and pull requests get preview links, which need a Vercel login with access to the team.
- **One site for everything (GitHub Pages, Netlify, etc.):** run `npm run build:site` and publish `site/`. The root page links to every prototype, and every app gets a floating **☰ Prototypes** button (bottom-right) for jumping straight to another app or back to the hub. It's added only to the copies in `site/`, so `npm run dev` and each app's own `dist/` are unchanged.
- **One deployment per app (e.g. Vercel):** create a project per app with **Root Directory** set to `apps/<app>`, install command `npm install` (run from the repo root by the platform), and build command `npm run build`.
