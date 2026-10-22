# Avatar Unlock

Owner: Drew Guthrie

A community cosmetic unlock on a Twitch-style watch page. Viewers pool Bits toward the Starfall Wizard Hat; as the goal fills, the hat is revealed, and at 100% everyone can equip it on their avatar. Bits and chat are simulated; there is no backend.

## Run

From the repository root:

```sh
npm install
npm run dev -w @hype/avatar-unlock     # http://localhost:5103
npm run build -w @hype/avatar-unlock
```

## Demo

1. Use the dashed prototype strip at the top to jump between progress states (0%–100%), or **Reset**.
2. Choose **Contribute Bits**, pick an amount, and confirm to see the reveal advance.
3. At 100%, open the reveal and choose **Equip on my avatar**.

## Source

- `index.html`: the whole prototype (markup, styles and script), unchanged from the original `Avatar_Unlock.html` upload.
- Fonts load from Google Fonts, so the page needs an internet connection to look right.
