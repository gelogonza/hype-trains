# Hype Train Dreams

**I441 Project 2, sponsored by Twitch.** Each teammate builds their own Hype Train concept as a separate app in this repo. Every app has its own folder, dependencies, dev port and build output, so nobody's work collides with anyone else's. One command also publishes all of them together on a single site.

```
hype-train-dreams/
  apps/
    hype-pass/          Angelo: Hype Train Station + Hype Pass   (port 5101)
    <your-app>/         one folder per teammate concept
  packages/             shared code, only once two apps need the same thing (empty for now)
  templates/app/        starter used by `npm run new-app`
  scripts/              new-app.mjs, build-site.mjs
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

## How builds stay separate

- **Folder and package name:** each app has its own (`@hype/<app>`). Run commands with `-w @hype/<app>` so they only touch your app.
- **Dev ports:** each app has a fixed port with `strictPort`, so two dev servers never fight over 5173. If your port is taken, Vite fails loudly instead of silently moving to another.

  | App | Dev | Preview |
  | --- | --- | --- |
  | hype-pass | 5101 | 4101 |
  | *(next app)* | 5102 | 4102 |

- **Build output:** each app builds to its own `apps/<app>/dist`. `npm run build:site` builds them **one at a time**, each with its own base path (`/hype-pass/`, `/boss-fight-train/`…). If one app fails to build, the others still get published.
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
