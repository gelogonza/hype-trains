# Challenge Train (final prototype)

Owner: Thejas Mirle

An interactive research prototype for the **Challenge Train** concept (IDP I-441, "Hype Train Dreams", sponsored by Twitch). It is a research tool, not a product. **Nothing is real:** no payments, accounts, uploads, backend, or Twitch API.

The concept: each level of the train pairs a **challenge** that the streamer writes for the whole group with a **reward** (emote or badge) that supporters earn. The community makes the rewards: fans submit art, mods shortlist it, and the streamer picks and publishes. **Supporting (paid: Subs, Gift Subs, Bits)** powers the meter and earns the rewards. The full concept and brainstorm are in [Streamer Donation Incentives.md](Streamer%20Donation%20Incentives.md).

Like the current Hype Train, it's a **timed group rush**: the train departs once 3 people support, each level has a countdown that resets when the level is reached, and it can **run out of time**. When it does, everything already reached still counts, and the levels that weren't reached wait for the next train. A simulated crowd supports and chats alongside you.

**The UI follows the Twitch mobile app** (dark theme, Twitch's colors and Inter). Each new feature sits where Twitch already puts that kind of thing:

- The Challenge Train is the **pinned Hype Train banner at the top of chat**.
- The **donor leaderboard** is Twitch's pinned chat leaderboard. As on the current Hype Train, the top Bits and top Subs contributors are the **Conductors** and wear a crown badge in chat.
- Rewards live in the **emote picker**. Earned fan-made emotes go into your messages and render as emotes in chat.
- Support uses Twitch-style **Subscribe / Gift Subs / Bits** sheets, opened from the message bar and the train.
- The streamer runs challenges from **Stream Manager** quick actions.

Angelo Gonzalez's animated runner train (ported from `apps/hype-pass` in the team repo) is **turned off for now**. Its files are still in [`src/components/viewer/train/`](src/components/viewer/train/), and `three` and `@react-three/fiber` are still installed, so it can come back.

**The streamer stays in control.** Reaching a level only *unlocks* its challenge. The streamer starts it from **Stream Manager** when it suits the stream. While a challenge is live, the train **holds** (the clock stops), the banner turns red, and the stream shows a "Live challenge" lower-third. The streamer taps the challenge again when done to send the train off.

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

1. **Streamer:** can someone edit a challenge, request art, pick a submission, and publish in about 3 minutes without help? Does it feel like little work?
2. **Fan:** does a fan understand how to contribute and what they get (credit, Creator badge)?
3. **Viewer:** is it clear what the group gets (the challenge) vs what you get (the reward)? Do viewers notice and value community-made rewards and the creator credit?

## Roles

Use **Prototype: view as** at the top to switch between three roles. They share one state, so what you do in one role shows up in the others.

| Role | You play | What you can do |
|---|---|---|
| **Viewer** | "you" | Watch the stream, support the train, earn rewards, see who made them. |
| **Streamer** | PixelPaloma | **Stream Manager:** start and finish unlocked challenges, see the leaderboard and activity. **Challenge Train setup:** write each level's challenge, request art from fans, review submissions, pick a reward, publish. |
| **Fan** | @sketchy_sam | See open art requests, submit placeholder art, track your submissions. |

**Try the full loop:**
1. As **Fan**, submit art to the Level 2 request.
2. As **Streamer**, open Level 2 → Review submissions → pick yours → Publish train.
3. As **Viewer**, support until Level 2. The banner, chat and emote picker credit "art by @sketchy_sam".
4. As **Streamer**, in **Stream Manager**, tap an unlocked challenge to start it. Back as **Viewer**, the stream shows it and the train is held. Tap it again as Streamer to finish.

## What each part is for

**Viewer**

| Part | Purpose |
|---|---|
| Player | Placeholder video with Twitch's player controls and LIVE tag. Shows a "Live challenge" lower-third while the streamer does a challenge. |
| Channel row | Avatar with live ring, name, title, category, red viewer count, Follow (works locally) and Subscribe (opens the support sheet). |
| Challenge Train banner | Pinned at the top of chat, like the Hype Train. Boarding (3 pips), then level, next challenge and countdown (red under 15s). It turns gold when a level completes ("You got PepperFace · art by @LoafBoss"), red while a challenge is live, and shows the ending. Tap it for the panel (or the recap after). |
| Chat leaderboard | This train's top 3, pinned under the banner. Conductors get the crown. Tap for the full list. |
| Chat | Twitch-style rows: badges, colored names, sub/gift/cheer notices with a purple bar, the broadcaster badge, Conductor crowns, and emote codes rendered as emotes. You can type and send messages. |
| Message bar | **Send a message**, the emote button (red dot once you've earned something), **Bits** and **Gift** buttons. |
| Support sheet | Tabs for Subscribe (Tier 1/2/3), Gift Subs (1/5/10, 5 "Most popular") and Bits (100/500/1000), with the time left and what you'd earn. A confirm step labelled "Prototype: no real payment" adds hype. |
| Emote picker | The Challenge Train section: every level's emote, locked or earned, with "by @fan". Tap an earned one to add it to your message. Badges are listed below. |
| Challenge Train panel | Progress and clock, what the next level unlocks for everyone (challenge) and supporters (reward), Gift a Sub / Cheer, the two Conductors, the top 5 (plus your rank if lower), and each challenge's status. |
| Recap | A sheet after Level 4 or when time runs out: challenges and whether they've been done on stream, your rewards, the community creators, what you did, and a "Next train" card with the levels still waiting and a Remind me toggle (it does nothing yet). **Back to the stream** closes it; the banner reopens it. |

**Streamer**

| Part | Purpose |
|---|---|
| Stream Manager | Stream preview, the Challenge Train banner, the challenges as quick-action tiles (tap to start, tap again when done; one at a time, and starting one holds the train), the leaderboard for shout-outs, and an activity feed of support. Opens after publishing. |
| Setup home | The 4-level ladder: each level's challenge, reward and any open request. "Edited" marks unpublished changes. **Publish train** sends the draft to viewers and starts a new train. |
| Level editor | Challenge text (80 characters max) with community questions as prompts instead of templates. Reward controls: request art, review submissions, pick from the vault, or use the default reward. |
| Request art | Choose emote or badge and write a short brief for fans. |
| Pick a reward | Submissions shortlisted by mods, other submissions, and the vault (unused art from earlier requests). Picking closes the request and sends the rest to the vault. |

**Fan**

| Part | Purpose |
|---|---|
| Fan home | Open requests from the streamer, and your submissions with their status (waiting for review, picked, live, or in the vault). |
| Submit art | Pick a placeholder picture and background, name it, submit. Nothing is uploaded. |

**`dev` button** (in the role bar): prototype controls.
- **Crowd:** *Auto* usually stalls around Level 2 or 3, so your support decides it. *Make it* reaches Level 4. *Run out* stalls early, to show the recovery path.
- **Speed:** 1×, 2× or 4× for the clock and the crowd.
- **Skip 15 seconds** on the level clock.
- **Reset everything** to the fixtures, keeping your role and these controls.

The clock and the crowd only run while the train is on screen (the **Viewer** role, or the Streamer's **Stream Manager**), so nothing happens off-screen.

## Fixture data (all fake)

Everything lives in [`src/data/train.js`](src/data/train.js):

- **Starting ladder** (the "last train"):
  - L1: "Do an impression of chat's favorite NPC", HypeHeart emote, fan art by @kiwi_kat
  - L2: "Sing the cozy crew theme song", Train Rider badge (default)
  - L3: "Eat The Pepper live", PepperFace emote, fan art by @LoafBoss
  - L4: "Dye my hair live, in chat's color", Hair Raiser gold badge (default)
- **Open request:** Level 2 badge, "Badge for the 'cozy crew'", with 3 seeded submissions. Two are marked "shortlisted by @mod_rae". There is no Mod role; mod shortlists are fixtures.
- **Vault:** one seeded emote (PalomaWave by @kiwi_kat).
- **Art** is an emoji on a colored tile (square = emote, circle = badge). No real images.
- **Start:** the train is boarding with 1 of 3 supporters (mossy_toad's Tier 1 Sub, 500 points).
- **Timing:** 60 seconds per level (shortened from Twitch's 5 minutes for testing). It resets when a level is reached.
- **Crowd:** 7 fake viewers. What they spend and how often is in `CROWD_MIX` and `CROWD_RATE`.
- **Level thresholds (cumulative):** L1 1,000 · L2 3,000 · L3 6,000 · L4 10,000.
- **Support point values:** Tier 1 Sub 500, Tier 2 1,000, Tier 3 2,500, Gift Sub 500 each, Bits 1 point per Bit.
- **Reward rule:** a reward is earned only if the user has supported at least once during this train.
- The streamer, fans, mods, chat messages and streamer reactions are invented.

Each level in the data is `{ level, threshold, challenge, reward }`, and each reward is `{ kind: 'emote' | 'badge', name, art, credit }`.

State is a single `useReducer` ([`src/state/reducer.js`](src/state/reducer.js) for roles, ladder, requests and submissions, and [`src/state/trainReducer.js`](src/state/trainReducer.js) for the viewer's train). It has no persistence, so reloading the page resets everything.

## Known limits

- **The crowd is random.** Two runs on *Auto* can end at different levels. Use *Make it* or *Run out* for a repeatable demo.
- **Not every Twitch control works.** Settings, More, Minimize and the channel points area are for looks.
- **No Mod role.** Mod shortlisting is shown with fixtures only.
- **No real uploads.** Art is placeholder emoji, so it can't test what real fan art looks like.
- **Creator rewards aren't shown from the fan's side.** The fan screen says they'll get the Creator badge, but there is no fan view of earning it.
- **Voting and mini-games are parked.** The stage 1 version with voting is in Thejas's own prototype repo (tag `stage-1`), not in this one.

## Open design questions

See section 8 ("Parked for later") and section 5 ("Problems I see") in [Streamer Donation Incentives.md](Streamer%20Donation%20Incentives.md). Questions most relevant to this stage:

- Do contributor rewards need a spend threshold, rather than "any support counts"?
- How should fan artists be rewarded beyond credit (revenue share, gifted sub)?
- Who reviews submissions in channels without active mods?
- How often should custom emotes be made before they lose their value?
