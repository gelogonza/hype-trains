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

1. **Streamer:** can someone set up goals, request art, pick a submission, and publish in about 3 minutes without help? Does running the climb live (start, challenges, end) feel like they're in control?
2. **Fan:** does a fan understand how to contribute and what they get (credit, Creator badge)?
3. **Viewer:** does the preview build anticipation? Is it clear what everyone gets (the challenge) vs what you get (the reward)? Does the mystery goal add excitement? Do viewers notice and value community-made rewards and the creator credit?

## Roles

Use **Prototype: view as** at the top to switch between three roles. They share one state, so what you do in one role shows up in the others.

| Role | You play | What you can do |
|---|---|---|
| **Viewer** | "you" | Preview the climb, support it, earn rewards, see who made them. |
| **Streamer** | PixelPaloma | **Stream Manager:** start the climb, start and finish challenges, end it early, schedule the next one. **Climb setup:** segment length, mystery goal, each goal's challenge and reward, art requests, publish. |
| **Fan** | @sketchy_sam | See open art requests, submit placeholder art, track your submissions. |

**Try the full loop:**
1. As **Viewer**, tap the pinned **Community Climb** card to preview the goals. The last one is a mystery.
2. As **Streamer**, in **Stream Manager**, tap **Start Community Climb**. (Or use **dev → Start the climb**.)
3. As **Viewer**, watch the start moment on stream, then support. The climber moves up, flags plant at each goal, and Goal 3 reveals the mystery goal.
4. As **Streamer**, tap an unlocked challenge to start it. As **Viewer**, the stream shows it and the clock is paused. Tap it again as Streamer to finish.
5. Let the clock run out, or **End climb** as Streamer. The recap shows what carries over. As Streamer, **Schedule the next climb**: unreached goals are marked "Back from last climb".

**Fan art loop:** as **Fan**, submit art to the Goal 2 request. As **Streamer**, open Goal 2 → Review submissions → pick yours → Publish climb. As **Viewer**, unlock Goal 2: the card, chat and emote picker credit "art by @sketchy_sam".

## What each part is for

**Viewer**

| Part | Purpose |
|---|---|
| Player | Placeholder video with Twitch's player controls and LIVE tag. Shows the climb's big moments as an on-stream overlay (start, goal unlocked, mystery revealed, summit) and a "Live challenge" lower-third. |
| Channel row | Avatar with live ring, name, title, category, red viewer count, Follow (works locally) and Subscribe (opens the support sheet). |
| Community Climb card | Pinned at the top of chat. A header with the goal count and the clock, over a small mountain scene. It covers each moment: scheduled ("Starts soon"), the next goal, **Almost!** (glows at 85% of a goal), a goal unlocked (gold, with what you got), the mystery reveal, a live challenge (red, clock paused), the summit and the end. Tap it for the full climb (or the recap after). |
| Mountain scene | The climber moves along the trail as hype comes in. Flags: grey = locked, violet = next, yellow and waving = reached, "?" = mystery. The sky goes from violet to an orange dusk to near-black night as the clock runs down, and turns gold at the summit. Respects reduced-motion settings. |
| Chat leaderboard | This climb's top 3, pinned under the card. The Lead Climber (top contributor) gets the mountain badge. Tap for the full list. |
| Chat | Twitch-style rows: badges, colored names, sub/gift/cheer notices, the broadcaster badge, the Lead Climber badge (stamped when the message is sent), and emote codes rendered as emotes. You can type and send messages. |
| Message bar | **Send a message**, the emote button (red dot once you've earned something), **Bits** and **Gift** buttons. |
| Support sheet | Tabs for Subscribe, Gift Subs and Bits, with the time left and what you'd earn. A confirm step labelled "Prototype: no real payment" adds hype. Before the climb starts, it says support won't count yet. |
| Emote picker | Every goal's emote and badge, locked or earned, with "by @fan". The mystery goal's reward stays a "?". Tap an earned emote to add it to your message. |
| Climb panel | A big mountain with labelled goals, the status (or "Starts when PixelPaloma kicks it off" with **Notify me**), what the next goal unlocks for everyone and supporters, Gift a Sub / Cheer, every goal, and the Top climbers. |
| Recap | A sheet when the climb ends: why it ended, the goals reached and whether each challenge has been done on stream, your rewards, thanks to the Lead Climber and artists, what you did, and what comes back next climb (the mystery stays secret). **Back to the stream** closes it; the card reopens it. |

**Streamer**

| Part | Purpose |
|---|---|
| Stream Manager | Stream preview, the climb card, then by phase: **Start Community Climb** (scheduled), the time left and a two-tap **End climb** (live), or **Schedule the next climb** (ended). A Hype Train status row, the challenges as quick-action tiles (tap to start, tap again when done; one at a time, and the clock pauses meanwhile), Top climbers for shout-outs, and an activity feed of support. |
| Climb setup | **Segment length** (3, 5 or 10 minutes, shortened for testing), **Mystery final goal** on/off, and the 4 goals: each goal's challenge, reward and any open request. "Edited" marks unpublished changes. **Publish climb** schedules a new climb; it's disabled while a climb is live. |
| Goal editor | Challenge text (80 characters max) with community questions as prompts instead of templates. Reward controls: request art, review submissions, pick from the vault, or use the default reward. |
| Request art | Choose emote or badge and write a short brief for fans. |
| Pick a reward | Submissions shortlisted by mods, other submissions, and the vault (unused art from earlier requests). Picking closes the request and sends the rest to the vault. |

**Fan**

| Part | Purpose |
|---|---|
| Fan home | Open requests from the streamer, and your submissions with their status (waiting for review, picked, live, or in the vault). |
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

- **There is no Hype Train in the prototype.** "Off while the climb runs" is only a status line in Stream Manager.
- **The crowd is random.** Two runs on *Auto* can end at different goals. Use *Summit* or *Run out* for a repeatable demo.
- **Scheduling is a state, not a time.** "Scheduled" means announced for this stream; there's no calendar or real notification (Notify me and Remind me do nothing yet).
- **Not every Twitch control works.** Settings, More and Minimize on the player are for looks.
- **No Mod role.** Mod shortlisting is shown with fixtures only.
- **No real uploads.** Art is placeholder emoji, so it can't test what real fan art looks like.
- **Creator rewards aren't shown from the fan's side.** The fan screen says they'll get the Creator badge, but there is no fan view of earning it.
- **Voting and mini-games are parked.** The stage 1 version with voting is in Thejas's own prototype repo (tag `stage-1`), not in this one.

## Open design questions

See section 8 ("Parked for later") and section 5 ("Problems I see") in [Streamer Donation Incentives.md](Streamer%20Donation%20Incentives.md). Questions most relevant to this stage:

- Is "Community Climb" the right name?
- How long should a real segment be, and should the streamer be able to extend it?
- Do contributor rewards need a spend threshold, rather than "any support counts"?
- How should fan artists be rewarded beyond credit (revenue share, gifted sub)?
- Who reviews submissions in channels without active mods?
- How often should custom emotes be made before they lose their value?
