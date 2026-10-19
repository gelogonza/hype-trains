# AGENTS.md

Instructions for any AI coding agent (Claude Code, Codex, Copilot, Cursor, etc.) working in this repo.

This is the **Hype Train Dreams** monorepo for I441 Project 2. Each teammate's prototype is a **separate app** under `apps/`. Most requests you'll get are about **adding a teammate's app**, either a project they already built or a new one. Your top priority is keeping every app's build separate from every other app's.

## Read before you change anything

Read these first, in this order. Don't guess from the folder names.

1. **`README.md`**: how the repo works, the port table, "Bringing in a project you already built", "How builds stay separate", and the team workflow.
2. **`scripts/lib.mjs`**: how ports (`hype.port`) and build output folders (`hype.out`) are found.
3. **`scripts/import-app.mjs`**: exactly what the importer accepts (folder, .zip, git URL, `--link`), how it finds a nested app, what it skips (deps, builds, `.git`, lockfiles, `.env` secrets), and what it rewrites per stack.
4. **`scripts/doctor.mjs`**: the rule checker. Its checks are the definition of "done" for an app.
5. **`scripts/new-app.mjs`** and **`templates/app/`**: what a freshly scaffolded app looks like. Imported apps should end up following the same conventions.
6. **`scripts/build-site.mjs`**: how every app is built with its own `BASE_PATH` and collected into `site/` (`hype.external` = link only, `hype.site: false` = skipped).
7. **`package.json`** at the root: the workspaces and scripts.
8. **`apps/hype-pass/`** (its `package.json`, `vite.config.ts` and `README.md`): a working reference app.

## Importing a project someone already built

Always use the script. Don't hand-copy folders.

```bash
npm run import-app -- <folder | file.zip | git-url> <app-name> --owner "<Name>"   # add --subdir <path> if asked
npm install                                  # always from the repo root
npm run doctor -- <app-name>                 # fix every ✗, then every ⚠ you can
npm run dev -w @hype/<app-name>              # confirm it starts on its assigned port
npm run build -w @hype/<app-name>            # confirm it builds on its own
npm run build:site                           # confirm the combined site still builds
```

- **`<app-name>`** must be lowercase kebab-case and must not already exist in `apps/`.
- **Keeping git history:** if the project is its own git repo and the user wants its history, use `git subtree add --prefix=apps/<app-name> <repo-url> <branch>`, then `npm run import-app -- apps/<app-name> <app-name> --in-place`.
- **Read the importer's output.** If it prints **"Still to do"**, finish every item:
  - **Next.js:** add `output: 'export'` and `basePath`.
  - **Vite config it couldn't patch:** add `base` and a fixed `server.port` by hand.
  - **Unknown stack:** make `dev` use the assigned port, and make `build` output static files that work under `/<app-name>/`, with `hype.out` set.
- **Check the result** against the rules below before you report success.

For a brand-new app, use `npm run new-app -- <name> --title "..." --owner "..."` instead.

## When it wasn't built the way we expected

Don't force a project into a shape it isn't. Work out what it is, then choose the lightest path that gets it running here and listed on the combined site:

1. **Inspect it first.** Read its `package.json`, config files and README, and look for a `server/` or `api/` folder, `.env` usage, a `requirements.txt`, or hard-coded `localhost` URLs.
2. **Several parts in one place** (front end + server, or their own monorepo): import only the web front end with `--subdir`. Tell the user what was left out and how the demo will work without it.
3. **Needs a backend:** prefer, in order:
   1. mocking the API in the front end, if that's enough for a class demo
   2. running the server alongside during demos (document the command in the app README)
   3. setting `"hype": { ..., "site": false }`

   Don't add a backend to the shared site.
4. **Not a web app, or hosted elsewhere** (Figma, Streamlit, Replit, Vercel): use `--link <url>`. If the code should still be in the repo, import it as well with `"site": false`.
5. **Unknown build tool:** make `dev` run on the assigned port, make `build` emit static files that work under `/<app-name>/`, and set `hype.out`. Then run `npm run doctor -- <app-name>` until it has no ✗.
6. **Build fails on type errors in generated code:** fix them if they're small. Otherwise ask the user before changing `"build"` to skip `tsc`, and note the change in the app README.
7. **Secrets:** never copy, commit or print real `.env` values. Create a `.env.example` with the variable names and tell the user to share keys privately.

The README's **Troubleshooting** table lists the common symptoms and fixes. Use it, and add a row when you find a new case.

## Rules every app must follow (don't break these)

- **Separate folder and package name:** `apps/<app-name>`, with the package named `@hype/<app-name>`. Never import from another app's folder.
- **Its own fixed dev port:** set as `hype.port` in its `package.json` and as `server.port` with `strictPort: true`. Don't reuse a port, and don't change other apps' ports.
- **Works under a sub-path:** the build must respect `process.env.BASE_PATH` (Vite `base`, Next `basePath`, CRA `"homepage": "."`). Use relative or base-aware asset paths, not hard-coded `/…` URLs.
- **One lockfile, at the root.** Delete any app-level `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`, and never run `npm install` inside an app folder. Add dependencies with `npm install <pkg> -w @hype/<app-name>`.
- **No global collisions:** scope styles (CSS Modules or app-specific class prefixes), and prefix `localStorage` / `sessionStorage` keys with the app name (e.g. `hype-pass:sound-muted`).
- **Shared code goes in `packages/`,** and only once two or more apps need it. See `packages/README.md`.
- **Stay inside the app you were asked about.** Changes to the root `package.json`, `scripts/`, `templates/`, `packages/` or another teammate's app need the user's explicit OK.

## Before you say you're done

- **Commands pass:** `npm install` (root), `npm run doctor -- <app-name>` (no ✗), `npm run build -w @hype/<app-name>` and `npm run build:site` all succeed. Report any failure with its output, and don't paper over it.
- **The app runs:** `npm run dev -w @hype/<app-name>` serves on the assigned port. If you can, open `site/<app-name>/` after `build:site` to confirm it works under its sub-path.
- **Docs are updated:**
  - the port table in `README.md` (the "How builds stay separate" section) has a row for the new app
  - the app has a `README.md` with its owner, how to run it, and how to demo it
- **Only expected files changed:** `git status` shows just the new app plus any doc updates. Don't commit or push unless the user asks.
