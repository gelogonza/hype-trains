# Battle Boss

Owner: Ryanna Jelks

A mobile React conversion of the supplied HTML prototype. It preserves the poll, role controls, simulated sign-in and Bits contributions, results, pins, and prototype tools. Twitch sign-in and purchases are simulations; there is no connected backend.

## Run

From the repository root:

```sh
npm install
npm run dev -w @hype/battle-boss
```

Open http://localhost:5102. To check the production build, run `npm run build -w @hype/battle-boss`.

## Demo

Open **Prototype tools**, choose **Quick start**, and then choose a team. You can tap, contribute simulated Bits, switch to streamer or moderator controls, settle results, and inspect pins.

## Source

- `src/BattleBoss.js`: React component with poll state and simulated services.
- `src/TemplateView.js`: renders the exported conditional view markup as React elements.
- `public/template.html`: view markup recovered from the original HTML.
- `src/styles.css`: exported styles with phone viewport adjustments.
- `public/fonts/`: embedded fonts and their license.

The original HTML is included for reference. To connect Twitch for production, replace the simulated service functions and add a backend for trusted contribution events and persistent state.
