# Hype Train Station + Hype Pass

**I441 Project 2: Hype Train Dreams (sponsored by Twitch).** This is a vibecoded prototype that reimagines the mobile Hype Train.

Every Hype Train is a one-night event with its own collectible **stamp**. Anyone who rides it gets that stamp, even if they only chatted. Stamps live in a viewer's **Hype Pass**, a profile card styled as a train ticket that flips over into a passport. The train itself is a Geometry Dash-style runner in chat. It gets faster, dirtier and more decked out with every level.

It's built mobile-first, and on desktop it matches Twitch's web layout. All data is simulated, and no real purchases happen.

---

## Run it

This app lives in the `hype-train-dreams` monorepo. From the **repo root**:

```bash
npm install                        # once, at the root
npm run dev -w @hype/hype-pass     # http://localhost:5101
```

Open the local URL on a phone-sized viewport, or on desktop for the Twitch web layout.

| URL option | What it does |
| --- | --- |
| `?demo=1` | Shows the ⚙ presenter panel: viewer's Dark Theme, streamer setup (game, scene, custom backdrop), forced outcome, 1×/2×/4× speed, Kick off, Reset |
| `?game=fortnite` | Opens on Fortnite, which switches to the Battle Royale scene |
| `?scene=battle` / `?scene=spooky` | Forces a scene, whatever the game |

Example: `http://localhost:5101/?game=fortnite&demo=1`

**Other commands** (from the root): `npm run build -w @hype/hype-pass` (type-check + production build to `apps/hype-pass/dist/`), `npm run preview -w @hype/hype-pass` (port 4101), `npm run lint -w @hype/hype-pass`.

---

## Demo script (about 2 minutes)

1. **Open the pass.** Tap any username in chat. Their **Hype Pass** spins in. Hover over the featured stamps to see what they are. Tap the card to flip it to the passport, and tap a stamp for its details and clips.
2. **Start a train.** Open `?demo=1`, then ⚙ → **Kick off** three times (the train needs 3 supporters to depart).
3. **Tap the train strip.** The support dropdown opens: what's left, unlockable rewards, info, and **Gift 1 sub**. **Double-tap** for the full view.
4. **Ride for free.** Type anything in chat. You get "🚃 Your carriage joined the train!", a +hype pop, and your name rolls by on a carriage.
5. **Watch the levels.** Each clear slams your stamp to a better rim and fires a **LEVEL CLEARED** burst. The train hops, speeds up, gets muddier and bolts on an upgrade.
6. **Finish.** The **badge reveal** rolls the tier up to what you earned. Then use **View in passport** to see it pressed onto the channel's visa page.
7. **Switch scenes.** ⚙ → Playing: **Fortnite**. Everything re-themes to the Battle Bus.
8. **Recovery path.** ⚙ → Outcome: **Force delay**, then Reset and Kick off. The train stops early, and riders still keep a lower-tier stamp.

---

## What's in it

### The Hype Train in chat: one surface, two gestures

- An animated strip sits at the top of chat, with a status overlay on top of the moving train:
  - your stamp inside a ring that fills as the level fills
  - the level, five station pips, the timer and a 🔥 combo counter
  - a line with the next concrete goal, e.g. "2 subs or 1.6K Bits → Silver"
- **Tap** it to open the support dropdown. It follows Twitch's native layout: what's left, *Unlockable Rewards* (the stamp's rim upgrades per level), *Info*, and a purple **Gift 1 sub** button.
- **Double-tap** (or double-click) it to open the **full view**: a big runner scene, departure board, meter, every way to contribute, and a live feed.
- **Free riding:** chatting during a train counts you aboard. Free chat hype can fill at most 30% of a level (the striped part of the meter), so paid support is what actually completes levels.
- **Feedback:**
  - *When a level clears:* a **LEVEL CLEARED** burst with confetti, haptics and a chime. Your stamp slams and its rim visibly upgrades.
  - *When you contribute:* a +hype pop and a stamp wiggle.
  - *Pressure:* an "Almost there!" glow at 85%, and a combo counter when chat contributes quickly.
  - Sounds can be muted from the dropdown.

### The runner scene (2D world, 3D train)

- **The world is flat 2D parallax:**
  - grid sky, silhouettes, blocks and spikes (or trees and houses)
  - a tiled ground whose edge pulses to the beat
  - the palette shifts on every level, like Geometry Dash's color changes
- **The only 3D object is the train,** seen side-on: a 4-4-0 locomotive with working side and piston rods, followed by carriages on bogies that carry riders' names. It stays put while the world rushes past.
- **Every level clear** makes the run faster (speed lines, camera shake), makes the train hop, adds mud, and bolts on an upgrade:

  | Level cleared | Upgrade |
  | --- | --- |
  | 1 | Roof spoiler |
  | 2 | Side boosters with flames |
  | 3 | Rocket thruster (the carriages drop back to make room) |
  | 4 | Swept wings, tail fin, neon underglow |
  | Arrival | Polished gold with blue afterburners |

### Scenes, by game or by the streamer's choice

| | Spooky Night (Hollow Lantern) | Battle Royale (Fortnite) |
| --- | --- | --- |
| Vehicle | Haunted Express locomotive + carriages | Battle Bus under a gored balloon + gliders |
| Live stamp | 🎃 *Spooky Special* (scalloped, flickering) | 🚌 *Storm Night* (shield, floating) |
| Levels | Spawn Point → … → Victory Terminal | Jump Zone → … → Victory Royale |
| Intensity | Bats multiply, the moon turns red | The storm creeps in from the left |
| Copy | "LEVEL CLEARED!", pumpkin chat | "ZONE CLEARED!", "VICTORY ROYALE!", bus-drop chat |

The streamer can override the scene or upload a custom backdrop image (⚙ → Streamer setup). The full view also has a scene picker labeled *streamer's pick (preview)*.

### Badge reveal

When a train ends and you rode it, a full-screen reveal takes over:
1. The stamp slams in over spinning light rays.
2. The tier climbs Bronze → Silver → … to the tier you earned, with a tick and a buzz at each step.
3. It lands with confetti, the event name, tier, how you rode, how many riders hold it, and "one night only".

It has **View in passport** and **Nice!** buttons, and it closes itself after 30 seconds (with a countdown bar).

### The Hype Pass

- **It behaves like a physical card** (motion inspired by ramp.design):
  - It floats and sways, has a visible edge, and spins in when it opens.
  - **Tap** it to flip, or **drag/flick** to spin it with momentum. Throw it past halfway and it flips to the other side.
  - The holo glare follows the card's angle.
- **It shows only the card,** floating over a dimmed page. **Gift a Sub / Whisper / Follow** are built into the ticket stub. Gifting from a pass also counts toward a running train.
- **Front (ticket):**
  - a round passenger photo, and a FROM → TO route between channel codes
  - **up to 5 featured stamps**, shown bare: name, date and tier appear only on hover or keyboard focus
  - a punch row for rides, stats, a passport-style code strip, and a barcode
- **Back (passport):** one visa page per channel, with stamps laid out as a collage. Tap a stamp for its details, tier, role, holder count and clips.
- **Choose your five:** on your own pass, open a stamp and use **☆ Feature on Hype Pass** (max 5). Other people's passes show their best five.

### Stamps

- **Nine shapes:** circle, postage, ticket, pennant, hex, scallop, shield, poster, starburst.
- **Motion is per event:** some stamps move (snowfall, flicker, heartbeat, float, twinkle, spin) and some stay still.
- **Tiers:**
  - The rim tier is Bronze → Silver → Gold → Platinum → Legend, set by how far chat got.
  - Level 4 and up adds a foil sheen.
  - A Legend stamp takes up more room on the passport page.

### Twitch shell

- **Desktop** matches Twitch web: top nav with a user menu, followed/live sidebar, a channel info bar (Follow / Gift a Sub / Subscribe, red viewer count, uptime), an About panel, and a chat column with top gifters, timestamps, channel points and the **Chat** button.
- **Phones** get the mobile app layout.
- **Dark / light** follows the viewer's Twitch **Dark Theme** setting (in the avatar menu, or ⚙ in demo mode) and is remembered. The Hype Pass has its own dark and light versions. The full 3D view stays dark in both.

---

## Research → design

| Insight | Design response |
| --- | --- |
| People want to feel like a member, not a customer | Chatting counts as riding; every rider gets the stamp |
| Donations are driven by exclusive rewards; today's rewards feel minimal | Each stamp belongs to one event and retires when it ends |
| The Hype Train is hard to find and blends in on mobile | An always-moving train at the top of chat, one tap to support |
| Recognition from the creator and community matters | Stamps show next to names in chat and on a public Hype Pass |
| It can feel like begging or pressure | The goal is a shared ride and a collectible, not a donation ask |
| Q4 goals: new and returning spenders, 5-gift-sub bundles | Free entry gets new people aboard; rim tiers reward coming back; "Gift 5 Subs" is the featured Conductor ticket |

---

## Project structure

```
src/
  App.tsx                     Shell: nav, sidebar, player, chat, modals, badge reveal
  data/                       Mock data: viewers, badges (stamps), themes (scenes), types
  state/
    station.ts                Hype Train reducer: phases, levels, points, riders, featured stamps
    useStation.tsx            Provider + simulated crowd/chat loop
    feedback.ts               Chime + haptics (mutable)
    uiTheme.ts                Twitch "Dark Theme" setting
  components/
    layout/                   Twitch shell: TopNav, Sidebar, ChannelHeader/About, ChatPanel, StreamPlayer
    hypetrain/
      HypeTrainBanner.tsx     The in-chat strip + dropdown (tap / double-tap)
      HypeMeter.tsx           Stamp ring, pips, combo, nudge line, LEVEL CLEARED burst
      StationView.tsx         Full view (double-tap)
      Train3D.tsx             Runner scene: 2D backdrop + 3D train, camera, upgrades
      scene/                  Backdrop2D (canvas), vehicles (3D models), Upgrades, core helpers
    profile/                  Hype Pass: HoloCard (physics), Ticket, Passport, BadgeDetail, StampTip
    ui/                       Stamp + shapes + motifs, Sheet, Avatar
    BadgeReveal.tsx           Full-screen "badge earned" moment
    DemoPanel.tsx             Presenter / streamer controls (?demo=1)
  styles/                     Twitch tokens (dark + light) and globals
```

## Stack

Vite · React 19 · TypeScript · CSS Modules · Framer Motion · three.js via @react-three/fiber (lazy-loaded) · Canvas 2D for the runner background. Colors come from the Twitch UI Starter Kit in Figma (`src/styles/tokens.css`).

## Known limitations

- **Simulated data:** everything is mocked, including the crowd, chat, purchases and clips.
- **Load size:** the 3D chunk is about 250 KB gzipped and loads after the page, so on a slow connection the strip can be empty for a moment.
- **Sound:** the chime only plays after the first click or tap, because browsers require one.
- **Phones have no hover,** so tapping a stamp opens its full details instead of the tooltip.
- **Live stamp follows the scene:** the live event's stamp is dressed by the current scene, so switching scenes mid-demo re-skins a stamp you already earned.
- **Stored settings:** the Dark Theme and sound settings are saved under `hype-pass:` keys, so they don't clash with teammates' apps hosted on the same domain.
