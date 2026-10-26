# Community Climb (final prototype)

Owner: Thejas Mirle

An interactive research prototype for the **Community Climb** concept (IDP I-441, "Hype Train Dreams", sponsored by Twitch). It was called the Challenge Train in earlier stages, and the name may change again. It is a research tool, not a product. **Nothing is real:** no payments, accounts, uploads, backend, or Twitch API.

**The concept:** a Community Climb is a **segment the streamer plans and runs** on purpose. Before the stream, the streamer sets up a few **goals**. Each goal pairs a **challenge** the streamer does live for everyone with a **reward** (emote or badge) that supporters earn. The community makes the rewards: fans submit art, mods shortlist it, and the streamer picks. During the stream, the streamer starts the climb, and the community unlocks the goals one by one by supporting: Subs, Gift Subs and Bits all go into one pool, so any purchase counts. The full concept and brainstorm are in [Streamer Donation Incentives.md](Streamer%20Donation%20Incentives.md).

## How it differs from the Hype Train

| | Hype Train | Community Climb |
|---|---|---|
| Who starts it | Contributions trigger it automatically | **The streamer starts it** from Stream Manager |
| When people know about it | When it appears | **Ahead of time**: it's scheduled, and viewers can preview the goals |
| Levels | Generic, a few minutes each | **Distinct goals** the streamer wrote, each with its own challenge and reward |
| Timing | A rush that resets every level | **One countdown for the whole segment**; the streamer can end it early |
| Ending | Times out | Time runs out, the streamer ends it, or the community reaches the summit. **Unreached goals carry over** to the next climb |
| Surprise | None | An optional **mystery final goal**, revealed when the goal before it unlocks |
| Look | Purple bar | A **mountain scene** in Twitch's palette: a climber, a flag per goal, and a sun that sets as the clock runs down |

**Only one runs at a time:** the Hype Train switches off while a Community Climb is live.

**The streamer stays in control.** Reaching a goal only *unlocks* its challenge. The streamer starts each challenge from Stream Manager when it suits the stream. While a challenge is live the clock pauses, the climb card turns red, and the stream shows a "Live challenge" lower-third.

**Creator sparkle.** A fan whose art becomes a reward gets a creator version of it, reserved for them: small white and gold sparkles drift off the art. When an artist posts their own emote in chat, it shows the sparkle; everyone else's copy doesn't. When their goal unlocks, the artist posts it straight away.

**Minimal text.** Every screen uses as few words as possible: short labels and status lines, no explanatory paragraphs.

**The UI follows the Twitch mobile app** (dark theme and Inter). Every color comes from Twitch's UI Starter Kit tokens: violet for the climb and actions, greys for surfaces, yellow for unlocks and the summit, red for live, green for done. Each part sits where Twitch already puts that kind of thing: the climb is pinned at the top of chat, the donor leaderboard is Twitch's pinned chat leaderboard, rewards live in the emote picker, support uses Twitch-style Subscribe / Gift Subs / Bits sheets, and the streamer runs everything from Stream Manager.

The climbing animation is a simple 2D take on **Angelo Gonzalez's** animated Hype Train (`apps/hype-pass` in the team repo).

## Run it

From the repository root:

```sh
npm install                              # once, at the root
npm run dev -w @hype/final-prototype     # http://localhost:5105
npm run build -w @hype/final-prototype   # production build into apps/final-prototype/dist/
```

Requires Node 20.19+ or 22.12+ (a Vite 8 requirement). No other setup or keys. The Inter font loads from Google Fonts; offline it falls back to the system font.

On a desktop the app renders inside a 390 × 844 phone frame. On a phone it fills the screen.

## What this prototype tests

1. **Streamer:** can someone set up goals, request art and pick a submission in about 3 minutes without help, all from one screen? Does running the climb live (start, challenges, end) feel like they're in control?
2. **Fan:** does a fan understand how to contribute and what they get (credit, and a sparkle version of their art only they can use)?
3. **Viewer:** does the preview build anticipation? Is it clear what everyone gets (the challenge) vs what you get (the reward)? Does the mystery goal add excitement? Do viewers notice and value community-made rewards and the creator credit?

## Roles

Use **Prototype: view as** at the top to switch between three roles. They share one state, so what you do in one role shows up in the others.

| Role | You play | What you can do |
|---|---|---|
| **Viewer** | "you" | Preview the climb, support it, earn rewards, see who made them. |
| **Streamer** | PixelPaloma | One **Stream Manager** screen: set the length and mystery goal on the climb card, edit goals in place, request and pick fan art, start the climb, start and finish challenges, end it early, schedule the next one. |
| **Fan** | @sketchy_sam | See open art requests, submit placeholder art, track your submissions. |

**Try the full loop:**
1. As **Viewer**, tap the pinned **Community Climb** card to preview the goals. The last one is a mystery.
2. As **Streamer**, in **Stream Manager**, tap **Start Community Climb**. (Or use **dev → Start the climb**.)
3. As **Viewer**, watch the start moment on stream, then support. The climber moves up, flags plant at each goal, and Goal 3 reveals the mystery goal.
4. As **Streamer**, tap **Start** on an unlocked goal. As **Viewer**, the stream shows it and the clock is paused. Tap **Done** as Streamer to finish.
5. Let the clock run out, or **End climb** as Streamer. The recap shows what carries over. As Streamer, **Schedule next climb**: unreached goals are marked "Back" in the viewer's goal list.

**Fan art loop:** as **Fan**, submit art to the Goal 2 request. As **Streamer**, tap **Review** on Goal 2 and pick yours. As **Viewer**, unlock Goal 2: the card, chat and emote picker credit "art by @sketchy_sam", and the Fan screen shows your sparkle version.

## What each part is for

**Viewer**

| Part | Purpose |
|---|---|
| Player | Placeholder video with Twitch's player controls and LIVE tag. Shows the climb's big moments as an on-stream overlay (start, goal unlocked, mystery revealed, summit) and a "Live challenge" lower-third. |
| Channel row | Avatar with live ring, name, title, category, red viewer count, Follow (works locally) and Subscribe (opens the support sheet). |
| Community Climb card | Pinned at the top of chat: the goal count and clock over a small mountain scene, with one short status line ("4 goals · 5:00", "Goal 2: …", "Almost! 400 to go", "Goal 1 unlocked! You got HypeHeart", "Revealed: …", "Live: …", "Summit!"). It glows near a goal, turns yellow on unlocks, and red while a challenge is live. Tap it for the full climb (or the recap after). |
| Mountain scene | The climber moves along the trail as hype comes in. Flags: grey = locked, violet = next, yellow and waving = reached, "?" = mystery. The sky goes from violet to an orange dusk to near-black night as the clock runs down, and turns gold at the summit. Respects reduced-motion settings. |
| Chat leaderboard | This climb's top 3, pinned under the card. The Lead Climber (top contributor) gets the mountain badge. Tap for the full list. |
| Chat | Twitch-style rows: badges, colored names, sub/gift/cheer notices, the broadcaster badge, the Lead Climber badge (stamped when the message is sent), and emote codes rendered as emotes. You can type and send messages. |
| Message bar | **Send a message**, the emote button (red dot once you've earned something), **Bits** and **Gift** buttons. |
| Support sheet | Tabs for Subscribe, Gift Subs and Bits, with the clock and what you'd earn. A confirm step labelled "Prototype: no real payment" adds hype. |
| Emote picker | Every goal's emote and badge, locked or earned, with "by @fan". The mystery goal's reward stays a "?". Tap an earned emote to add it to your message. |
| Climb panel | A big mountain with labelled goals, the status (or "Starts soon" with **Notify**), the next goal (what everyone and you get), Gift a Sub / Cheer, every goal, and the Top climbers. |
| Recap | A sheet when the climb ends: the mountain, how far it got, the Lead Climber, the unlocked challenges (✅ done, ⏳ owed, 🔴 live), what you got, and what comes back next climb with **Remind me**. |

**Streamer**

| Part | Purpose |
|---|---|
| Stream Manager | The streamer's only screen. Stream preview; the **climb card** with its settings attached underneath (**3 / 5 / 10 min** and **Mystery**, editable until the climb starts); then **Start Community Climb**, a two-tap **End climb**, or **Schedule next climb**. Then the **Goals**, top to bottom: each shows its challenge (with **Start** / **Done** while the climb runs), its reward with the fan art action (**Request art**, **Requested** or **Review (n)**), and **✎ Edit**, which opens the challenge text, ideas and reward options in place. Edits apply straight away; goals and settings lock while a climb is live. Then Top climbers and an activity feed. |
| Art sheets | **Request art** (emote or badge, and a short brief for fans) and **Pick a reward** (shortlisted by mods, other submissions, and the vault). They open over Stream Manager, so you never leave it. |

**Fan**

| Part | Purpose |
|---|---|
| Fan home | Open requests, and your submissions with their status (waiting for review, picked, live, or in the vault). Picked art shows your **creator version**, with the sparkle. |
| Submit art | Pick a placeholder picture and background, name it, submit. Nothing is uploaded. |

**`dev` button** (in the role bar): prototype controls.
- **Crowd:** *Auto* usually stalls around Goal 2 or 3, so your support decides it. *Summit* reaches the top. *Run out* stalls early, to show the time-up path.
- **Speed:** 1×, 2× or 4× for the clock and the crowd.
- **Start the climb (as streamer)**, without switching roles.
- **Skip 30 seconds** on the clock.
- **Reset everything** to the fixtures, keeping your role and these controls.

The clock and the crowd only run while the climb is on screen (the **Viewer** role, or the Streamer's **Stream Manager**), so nothing happens off-screen. Before the climb starts, the crowd only chats.

## Fixture data (all fake)

Everything lives in [`src/data/climb.js`](src/data/climb.js):

- **Goals** (from the "last climb"):
  - Goal 1 (1,000 hype): "Do an impression of chat's favorite NPC", HypeHeart emote, fan art by @kiwi_kat
  - Goal 2 (3,000): "Sing the cozy crew theme song", Trailblazer badge (default)
  - Goal 3 (6,000): "Eat The Pepper live", PepperFace emote, fan art by @LoafBoss
  - Goal 4 (10,000, mystery): "Dye my hair live, in chat's color", Hair Raiser gold badge (default)
- **Settings:** 5-minute segment, mystery final goal on.
- **Open request:** Goal 2 badge, "Badge for the 'cozy crew'", with 3 seeded submissions. Two are marked "shortlisted by @mod_rae". There is no Mod role; mod shortlists are fixtures.
- **Vault:** one seeded emote (PalomaWave by @kiwi_kat).
- **Art** is an emoji on a colored tile (square = emote, circle = badge). No real images.
- **Crowd:** 7 fake viewers. What they spend and how often is in `CROWD_MIX` and `CROWD_RATE`.
- **Support hype values:** Tier 1 Sub 500, Tier 2 1,000, Tier 3 2,500, Gift Sub 500 each, Bits 1 per Bit. All pooled.
- **Reward rule:** a reward is earned only if you supported during the climb that reached it. Earned rewards stay yours in later climbs.
- The streamer, fans, mods, chat messages and streamer lines are invented.

Each goal in the data is `{ level, threshold, challenge, reward }` (a goal is called a `level` in the code), and each reward is `{ kind: 'emote' | 'badge', name, art, credit }`.

State is a single `useReducer`: [`src/state/reducer.js`](src/state/reducer.js) for roles, goals, settings, requests and submissions, and [`src/state/climbReducer.js`](src/state/climbReducer.js) for the climb. It has no persistence, so reloading the page resets everything.

## Known limits

- **There is no Hype Train in the prototype.** "Only one runs at a time" is a rule of the concept; nothing in the UI shows it, since streamers don't usually manage Hype Trains.
- **The crowd is random.** Two runs on *Auto* can end at different goals. Use *Summit* or *Run out* for a repeatable demo.
- **Scheduling is a state, not a time.** "Scheduled" means announced for this stream; there's no calendar or real notification (Notify me and Remind me do nothing yet).
- **Not every Twitch control works.** Settings, More and Minimize on the player are for looks.
- **No Mod role.** Mod shortlisting is shown with fixtures only.
- **No real uploads.** Art is placeholder emoji, so it can't test what real fan art looks like.
- **The creator sparkle is only shown, not earned.** It appears in chat when an artist posts their own emote, and on a fan's picked art; there is no real per-user emote variant behind it.
- **Voting and mini-games are parked.** The stage 1 version with voting is in Thejas's own prototype repo (tag `stage-1`), not in this one.

## Open design questions

See section 8 ("Parked for later") and section 5 ("Problems I see") in [Streamer Donation Incentives.md](Streamer%20Donation%20Incentives.md). Questions most relevant to this stage:

- Is "Community Climb" the right name?
- How long should a real segment be, and should the streamer be able to extend it?
- Do contributor rewards need a spend threshold, rather than "any support counts"?
- How should fan artists be rewarded beyond credit (revenue share, gifted sub)?
- Who reviews submissions in channels without active mods?
- How often should custom emotes be made before they lose their value?
