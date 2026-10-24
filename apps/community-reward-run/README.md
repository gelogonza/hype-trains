# Community Reward Run

Owner: Drew Guthrie

A multi-level community reward run on a Twitch-style watch page. Viewers pool Bits to climb reward levels (Warm-Up → Community Challenge → Chat Takes Control → Grand Finale). One level's reward is decided by a free chat poll. The streamer can customize the event: its title, number of levels, goals, rewards and the poll. Bits, chat and votes are simulated; there is no backend.

## Run

From the repository root:

```sh
npm install
npm run dev -w @hype/community-reward-run     # http://localhost:5104
npm run build -w @hype/community-reward-run
```

## Demo

1. Use the dashed prototype strip at the top to jump between levels and progress, or reset.
2. Choose **Contribute Bits**, pick an amount, and confirm to move the community forward.
3. Vote in the chat poll for the linked level's reward (free, no Bits needed).
4. Open **Customize Event** to change the levels, rewards and poll as the streamer.
5. Finish the last level to see the Community Event Complete recap.

## Source

- `index.html`: the whole prototype (markup, styles and script), unchanged from the original `Community Reward Run.html` upload.
- Fonts load from Google Fonts, so the page needs an internet connection to look right.
