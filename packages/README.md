# packages/

Shared code lives here only once **two or more apps** need it. Until then, keep code inside your own app.

To add one, e.g. shared Twitch design tokens:

```
packages/twitch-tokens/
  package.json   { "name": "@hype/twitch-tokens", "version": "0.1.0", "type": "module", "exports": { ".": "./tokens.css" } }
  tokens.css
```

Then `npm install @hype/twitch-tokens -w @hype/<app>` and `import '@hype/twitch-tokens'` in that app.
Changes here affect every app that uses the package, so give the group a heads-up first.
