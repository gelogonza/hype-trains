# Hype Train Dreams

**I441 Project 2, sponsored by Twitch.** Each teammate builds their own Hype Train concept as a separate app in this repo. Every app has its own folder, dependencies, dev port and build output, so nobody's work collides with anyone else's. One command also publishes all of them together on a single site.

```
hype-train-dreams/
  apps/
    hype-pass/          Angelo: Hype Train Station + Hype Pass   (port 5101)
    <your-app>/         one folder per teammate concept
  packages/             shared code, only once two apps need the same thing (empty for now)
  templates/app/        starter used by `npm run new-app`
  scripts/              new-app.mjs, import-app.mjs, build-site.mjs
  package.json          npm workspaces root, with the only lockfile
```

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
| Bring in a project you already built | `npm run import-app -- <path> <name> --owner "You"` then `npm install` |
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

You don't need to start over. Import your existing project as its own app:

```bash
npm run import-app -- ~/path/to/my-project boss-fight-train --owner "Sam"
npm install
npm run dev -w @hype/boss-fight-train
npm run build -w @hype/boss-fight-train
```

The importer:
1. **Copies** your project into `apps/boss-fight-train`. Your original folder is untouched. It leaves out `node_modules`, `dist`/`build`/`out`/`.next`, your old `.git`, and your lockfile, because this repo has one shared lockfile.
2. **Renames** the package to `@hype/boss-fight-train` and gives it the next free dev port.
3. **Sets it up for its stack** so it builds on its own and works under `/boss-fight-train/` on the combined site:

| Your project | What the importer does | Anything left for you |
| --- | --- | --- |
| **Vite** (also Bolt, Lovable, v0, Figma Make, most Codespaces starters) | Adds `base` + a fixed port to `vite.config` | Only if your config is unusual (it tells you) |
| **Plain HTML / CSS / JS** | Adds a tiny Vite setup to serve and build it; your files stay as they are | Use relative paths (`./style.css`, not `/style.css`) |
| **Next.js** | Pins the dev port; build output is `out/` | Add `output: 'export'` and `basePath` to `next.config` (it prints the exact lines) |
| **Create React App** | Pins the port, sets `"homepage": "."`; build output is `build/` | Use `HashRouter` if you use React Router |
| **Something else** | Copies it and gives it a port | Follow the checklist it prints |

**Different library versions are fine.** If your project uses another React or Vite version, npm keeps a separate copy just for your app. If `npm install` complains about peer dependencies, try `npm install --legacy-peer-deps` and tell the group.

### Keeping your git history (optional)

If your project is already its own git repo and you want its commit history, pull it in with `git subtree` first, then run the importer **in place**:

```bash
git subtree add --prefix=apps/boss-fight-train https://github.iu.edu/<you>/<your-repo>.git main
npm run import-app -- apps/boss-fight-train boss-fight-train --in-place
npm install
```

`--in-place` makes the same fixes without copying, and removes the subtree's own `node_modules` and lockfile.

## How builds stay separate

- **Folder and package name:** each app has its own (`@hype/<app>`). Run commands with `-w @hype/<app>` so they only touch your app.
- **Dev ports:** each app has a fixed port (also recorded as `hype.port` in its `package.json`), so two dev servers never fight over 5173. If your port is taken, Vite fails loudly instead of silently moving to another.

  | App | Dev | Preview |
  | --- | --- | --- |
  | hype-pass | 5101 | 4101 |
  | *(next app)* | 5102 | 4102 |

- **Build output:** each app builds to its own folder (`dist/`, or `build/` / `out/` for Create React App / Next.js, set as `hype.out`). `npm run build:site` builds them **one at a time**, each with its own base path (`/hype-pass/`, `/boss-fight-train/`…). If one app fails to build, the others still get published.
- **Styles:** CSS Modules scope class names per app. Keep global CSS (tokens, resets) inside your own app.
- **Browser storage:** apps hosted on the same domain share `localStorage`, so **prefix your keys with your app name** (e.g. `hype-pass:sound-muted`).
- **Dependencies:** there's one root lockfile, and npm workspaces deduplicate shared packages. Keep **React on the same version** across apps so there's only one copy. If you need something unusual, install it with `-w` so it only lands in your app's `package.json`.
- **Shared code:** don't import from another app's folder. If two apps need the same thing (Twitch tokens, a chat mock), move it to `packages/<name>` with its own `package.json` (e.g. `@hype/twitch-tokens`) and depend on it like any other package.

## Team workflow

- **Branches:** one branch per feature or app, e.g. `sam/boss-fight-train`, merged with a pull request. Keep changes inside your own `apps/<app>` folder. Changes to the root `package.json`, `scripts/` or `packages/` need a heads-up in the group chat.
- **Before you push:** run `npm run build -w @hype/<app>`. Optionally run `npm run build` to check you didn't break the shared lockfile for others.
- **Canvas upload:** zip your own `apps/<app>` folder (without `node_modules` or `dist`), or share the combined `site/`.

## Deploying (optional)

- **One site for everything (GitHub Pages, Netlify, etc.):** run `npm run build:site` and publish `site/`. The root page links to every prototype.
- **One deployment per app (e.g. Vercel):** create a project per app with **Root Directory** set to `apps/<app>`, install command `npm install` (run from the repo root by the platform), and build command `npm run build`.
