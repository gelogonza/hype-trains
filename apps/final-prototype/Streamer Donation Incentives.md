# Challenge Train: concept and brainstorm

IDP I-441, "Hype Train Dreams" (sponsored by Twitch). This is a working design doc for the team. The stage 1 prototype in this folder was built from an earlier prompt, which is kept unchanged in the [appendix](#appendix-stage-1-build-prompt-original-unchanged). Note that the stage 1 prototype still includes voting, which is now out of scope (see section 8).

## 1. Concept

Challenge Train is a Hype Train where **the streamer and their community decide what each level unlocks**. Every level pairs two things:

- **A challenge** for the whole group: something the streamer does on stream when the level is reached, written by the streamer in their own words. This creates direct interaction between the streamer and the community.
- **A reward** for the people who contributed: an emote or badge built around the community's own symbols, inside jokes and memorable moments. This makes the reward exclusive and meaningful.

**The community builds the rewards.** Fans already make fan art for streamers they love. Challenge Train gives that work a home: fans and mods create emotes and badges, the streamer approves them, and the creator is credited every time their work unlocks. The streamer outsources most of the work to the community, and the community becomes part of the project instead of just watching it.

**Current scope:** challenges, emotes and badges, and how the streamer and community create them.
**Out of scope for now:** voting and mini-games (see section 8).

## 2. Research grounding

What made people feel they belonged in an online community:

1. Being able to interact with the streamer
2. Shared experiences and interests with other members
3. Community recognition
4. Shared goals and values

Why people donated:

1. To get a reaction from the streamer
2. Social recognition
3. Exclusive rewards
4. To reach shared community milestones

Today's Hype Train already covers recognition of top donors and shared milestones, so we keep those. Challenge Train adds features for the other motivations:

| Research finding | Feature that serves it |
|---|---|
| Interact with the streamer / get a reaction | Streamer-written challenges at each level |
| Shared experiences and interests | Emotes and badges about the community's inside jokes and moments |
| Community and social recognition | Donor name and badge in chat; creator credit on fan-made rewards |
| Shared goals and milestones | The meter and levels (kept from Hype Train) |
| Exclusive rewards | Custom emotes and badges earned only by contributors |

### How streamers run challenge streams today

Challenge Train is modeled on things streamers already do:

- **Goal ladders.** "At 10 subs I'll do X, at 25 I'll do Y." Streamers write these in their own words, with stakes that rise at each step, and post them in panels, overlays or titles. Common rewards include party games with chat, horror nights, karaoke, IRL streams and marathons ([Streamlabs](https://streamlabs.com/content-hub/post/top-twitch-sub-goal-ideas), [Eklipse](https://blog.eklipse.gg/streaming-tips/twitch-subs-ideas.html)).
- **Subathon milestones.** Each milestone triggers a stunt, sometimes picked by a spin wheel. Guides advise keeping challenges "entertaining and harmless" ([Streamlabs](https://streamlabs.com/content-hub/post/how-to-host-twitch-subathon)).
- **Games Done Quick incentives.** Donations unlock a change to a run, such as playing blindfolded. Incentives can drive a large share of giving ([Hit Point](https://digitalwriting.cornellcollege.edu/hit-point/?p=236), [minimaxir](https://minimaxir.com/2016/01/agdq-2016/)).
- **Channel Points custom rewards.** Streamers write their own stunts, which go into a queue they mark *Complete* or *Reject*, and rejecting refunds the viewer ([Streamlabs](https://streamlabs.com/content-hub/post/how-to-set-up-customize-twitch-channel-points)).

**Takeaway:** streamers already write custom challenges willingly, because it's just a sentence. The hard part is the art: emotes and badges. That's the part the community can take on.

## 3. How customization works

### 3.1 Roles

| Role | What they do |
|---|---|
| **Streamer** | Writes the challenge ladder, opens requests for art, makes final picks, publishes. Owns the veto. |
| **Mods** | Draft the ladder with the streamer, review submissions, shortlist the best, filter out anything unsafe or stolen. |
| **Fans** | Submit emote and badge art for open requests. Suggest moments worth turning into a reward. |
| **Viewers** | Support the train during the stream, earn the rewards, see who made them. |

### 3.2 The flow

1. **Streamer writes the ladder.** One challenge per level, in their own words. Instead of templates, the setup screen asks questions about the community to get them started:
   - "What does your chat always beg you to do?"
   - "What's a running joke in your stream?"
   - "What would make your chat lose its mind?"
   The previous train's ladder can be copied over, so later trains take less time.
2. **Streamer opens art requests.** For each level's reward, the streamer posts a short brief: "Emote for the time the cat knocked over the mic". A mod can also tag a clip as inspiration.
3. **Fans submit.** Between streams, fans upload emote or badge art for open requests.
4. **Mods shortlist.** Mods filter and narrow submissions down to a few.
5. **Streamer picks and publishes.** The chosen art goes through Twitch's normal emote review, then into the ladder slot.
6. **The train runs.** Support moves the meter, each level triggers its challenge, and contributors earn that level's reward.
7. **Creators get credit.** When a fan-made reward unlocks, chat shows it with the creator's name: "You earned HypeHeart (art by @kiwi_kat)". The creator gets a "Creator" badge and always gets their own emote.

### 3.3 Fallbacks so the train never waits on the community

- If no art is ready for a level, the reward falls back to a train-dated badge or one of the channel's existing emotes.
- Submissions that weren't picked stay in a **reward vault** for future trains, so fans' work isn't wasted and later trains are faster to set up.
- A ladder with challenges and no custom art is still a complete train.

### 3.4 How do non-donors participate?

With voting out of scope, **creating is the main way to take part without paying.** Fans who make art, mods who curate, and viewers who suggest moments all shape the train before it starts. Donors power it during the stream. The two kinds of contribution complement each other instead of competing for control.

Other light ways in:
- **Gift sub recipients** are pulled into the train: "@kiwi_kat gifted you a sub. You're on the train."
- **The recap** lists creators as well as top contributors.

### 3.5 How is the train triggered?

- **Organic (default):** like today's Hype Train, enough contributions in a short window start it, and the streamer's published ladder applies.
- **Scheduled launch (optional):** "Challenge Train, Friday at 8pm" for planned events, so anticipation can build.
- **Teaser card:** when no train is running, the channel shows the next ladder's first challenge and reward, so newcomers know the stakes before it starts.
- **Cooldown:** a per-channel limit so the train isn't constant pressure to spend.

### 3.6 What is the end goal?

- **For one train:** reach the final level before the timer runs out. End with a recap card showing challenges unlocked, top contributors, rewards earned, and the fans who created them.
- **For the community:** challenges actually happen. A **"challenges owed" tracker**, modeled on the Channel Points Complete/Reject queue, shows unlocked challenges until the streamer marks them done.
- **For Twitch (from the brief):** more Hype Train revenue, more new and returning spenders, more 5+ Gift Sub bundles, more Tier 2/3 Subs.

### 3.7 How do the rewards work?

- **Group reward:** the level's challenge. Everyone watching gets it.
- **Personal reward:** the level's emote or badge, earned by contributing during the train. Open question: does any amount count, or is there a threshold?
- **Creator reward:** the fan who made the art gets a "Creator" badge, their own emote, and credit whenever it unlocks.
- **Duration:** train emotes stay with the people who earned them, because exclusivity is the value. Badges carry the train's date or name ("Train Rider, Oct '26").
- **Recognition:** donor name and badge in chat, plus a mention in the recap.

## 4. Essential rules

The structure is the same in every channel. Only the content changes, the way Channel Points work everywhere even though every channel's rewards are different.

1. **Same shape everywhere:** a fixed number of levels, one meter, one finale.
2. **Every level is a challenge plus a reward.** No other slot types in this version.
3. **Only support moves the meter.**
4. **Challenges are for everyone; rewards are for contributors.**
5. **Creators are always credited.**
6. **The streamer approves everything** that gets published, within Twitch's safety rules.
7. **Every unlocked challenge is a public promise,** tracked until done or swapped publicly.

## 5. Problems I see, with mitigations

- **Unpaid creative work.** Asking fans for art can feel exploitative. *Mitigation:* visible credit, the Creator badge, the creator keeps their emote, and possibly a gifted sub or revenue share.
- **Stolen or unsafe art.** Copyrighted characters, traced art or offensive content. *Mitigation:* mod shortlist, Twitch's existing emote review, and a reporting path.
- **Mod workload.** Reviewing submissions could become a burden in big channels. *Mitigation:* cap submissions per request and close requests when the streamer has enough.
- **No submissions in small channels.** *Mitigation:* the fallbacks in 3.3. A challenge-only train is still complete.
- **Timeline mismatch.** Art takes days, but trains can start at any moment. *Mitigation:* requests run between streams, and the reward vault builds a backlog ahead of time.
- **Hurt feelings.** Fans whose art isn't picked may feel rejected. *Mitigation:* the vault keeps their work for future trains, and declines are gentle and private.
- **Safety and liability.** Hot peppers, hair dye and pushups carry real risk. *Mitigation:* streamer approval, Twitch safety rules, and the ability to swap a challenge publicly.
- **Follow-through.** A challenge the streamer never does breaks trust. *Mitigation:* the "challenges owed" tracker.
- **Reward inflation.** A new emote every train cheapens all of them. *Mitigation:* limit custom emotes to some levels, such as the finale, and use dated badges elsewhere.

## 6. Critique, and how to test it

- **"It's a safe option."** My mentor disagreed: this isn't one more Hype Train game, it's a framework that lets each community build its own experience. The new part is **community-made rewards plus streamer-written challenges inside a fixed structure.**
- **"Streamers won't put in the work."** Streamers already write challenge ladders. The heavy work, art, moves to fans who already make fan art. To test this, interview 3–5 streamers, mods and fan artists. Show them the prototype and a mockup of the request and review flow. Ask whether they would use it and what would stop them.
- **"Building it isn't testing it."** The stage 1 prototype passed its acceptance checks, but nobody outside the team has used it yet. Put the next version in front of real people.

## 7. Research to do

- **Fan art communities around streamers:** how they share work today, and whether they would want to make official emotes.
- **Twitch emote rules:** emote slot limits, review times, and whether non-owners can submit.
- **Challenge stream follow-through:** how streamers track and deliver on goal ladders today.
- **Today's Hype Train:** trigger rules, difficulty settings and participant rewards.

## 8. Parked for later

These are out of the current scope. Revisit them once the customization framework is clear.

- **Voting.** Should the community choose between challenges? Ideas to test later:
  - *Free vote:* donors unlock, everyone chooses (what stage 1 does now).
  - *Bid war:* donations choose, like Games Done Quick.
  - *Hybrid:* donations unlock options, the community picks among them.
  - Ask donors whether free voters choosing diminishes their contribution.
- **Mini-games** such as Tug of War. Watch out: teams divide chat, and team spending pressure can feel like gambling.
- **Top-donor privilege** ("Conductor"), which depends on how voting turns out.
- **Channel Points extra votes**, which also depend on voting.

## 9. Prototype roadmap

- **Stage 1 (built, see README.md):** single viewer. Includes voting, which is now parked.
- **Stage 2 (next):** streamer and community customization. Write the ladder, request art, review submissions, publish, then see it on the viewer screen with creator credit. Voting is removed from the viewer screen.
- **Later:** crowd simulation, timer, and the parked items above.

---

## Appendix: stage 1 build prompt (original, unchanged)

# Claude Code prompt: Challenge Train prototype (stage 1)

Paste everything below the line into Claude Code, in plan mode.

---

You are in plan mode. Do not write or change any code until I approve your plan. Your plan should include: the file tree, the state shape, the component list, how you will verify each acceptance item below, and the one step you think is riskiest. If anything below is ambiguous or contradicts itself, list it as a question at the end of the plan instead of guessing.

## Context

I am a designer on a four-person team in a course project (IDP I-441, "Hype Train Dreams"), sponsored by Twitch. The brief: reimagine the mobile Twitch Hype Train, a timed burst of community support where viewers buy Subs, Gift Subs, and Bits together to push a shared meter through levels and unlock rewards. Today's version feels stale and is hard for newcomers to join on mobile. The business goals are more Hype Train revenue, more new and returning spenders, more 5+ Gift Sub bundles, and more Tier 2/3 Subs.

My team came up with ten concepts and I was assigned one: **Challenge Train**. I am vibecoding it as an interactive prototype so we can feel the interaction, not just see screens. This prototype is a research tool, not a product. Nothing is real: no payments, no accounts, no backend, no Twitch API.

**The concept:** the streamer pre-sets what each level of the train unlocks. Free viewers vote on which consequence happens at each level. Spending (Subs, Gift Subs, Bits) moves the meter toward the next level. Donors in this train also earn personal rewards (emotes and badges). The key distinction to make legible:

- **Vote (free)** steers what the group gets.
- **Donate (paid)** powers the train and earns the donor personal rewards.

## What this prototype must test

1. Can a first-time user work out what the group is doing and choose a role within about 20 seconds?
2. Is the difference between voting (free, steers) and donating (paid, powers) clear without anyone explaining it?
3. Is it clear what a donor gets personally versus what the group gets?

Make the UI serve these three questions. Do not add anything that doesn't.

## What to build (stage 1: single user, no crowd, no timer)

A React web app that renders a phone-sized viewport (390 x 844, centered with rounded corners on desktop, full viewport on an actual phone) containing a mock Twitch stream screen.

**Screen layout, top to bottom:**
- **Stream area:** a placeholder video block (gradient or simple illustration is fine) with a streamer name and avatar, a LIVE tag, and a viewer count.
- **Hype-o-meter** pinned at the top of the chat: current level, a progress bar toward the next level, and a one-line preview of the next unlock.
- **Chat:** a scrolling list with seeded messages from fake viewers, plus system lines when things happen (for example "Level 2 reached", "You voted for ...", "You earned the HypeHeart emote").
- **Bottom action bar:** two clearly distinct buttons, **Vote (free)** and **Support**. Add a small icon button for **Your rewards**.

**Vote sheet (bottom sheet)**
- Shows the three candidate consequences for the level currently being climbed.
- Each option shows a seeded tally, for example 34 / 31 / 12, plus the user's vote when cast.
- The user can vote once per level and can change their vote until that level is reached.
- No payment is required and the sheet never mentions spending.
- The seeded tallies are fixtures and close enough that the user's vote can tip the winner. State clearly in the README that they are fixtures.

**Support sheet (bottom sheet)**
- Options: Sub (Tier 1, Tier 2, Tier 3), Gift Sub (1, 5, 10; highlight the 5-bundle), Bits (100, 500, 1000).
- Tapping an option shows a short confirm step labeled "Prototype: no real payment", then adds hype points to the meter with a quick animation.
- Fixture point values: Tier 1 Sub 500, Tier 2 1000, Tier 3 2500, Gift Sub 500 each, Bits 1 point per Bit.

**Levels (fixtures, defined in one data file)**
- Cumulative thresholds: L1 1000, L2 3000, L3 6000, L4 10000. The train starts at 600 points ("from earlier supporters", labeled as seeded) so a first action can reach L1.
- Each level has a pool of three consequences (low to high stakes as levels rise) and one contributor reward.
- Reaching a level locks in the winning consequence for that level (highest tally) and shows a level-up moment: overlay or toast, a chat system line, and a one-line streamer reaction in chat.
- Consequence pools (copy can be tweaked, structure should stay):
  - L1: Chat picks the next game / Streamer does an impression of chat's pick / Streamer wears the hat chat picks
  - L2: The Pepper (eat a hot pepper live) / Streamer sings chat's pick / Chat picks the next 30 minutes of gameplay
  - L3: Hair dye, chat picks the color / Streamer plays in the outfit chat picks / Streamer does 50 pushups
  - L4 (finale): Live hair dye with chat picking the color / Streamer streams outside / Chat designs the streamer's next thumbnail
- Contributor rewards (placeholder art only, use emoji or simple inline SVG, no real Twitch assets): L1 emote "HypeHeart", L2 badge "Train Rider", L3 emote "PepperFace", L4 badge "Hair Raiser" (gold).
- **A contributor reward is awarded only if the user donated at least once during this train.** Voting alone never earns one. This is deliberate. When a reward unlocks, post a chat line from "you" that displays the badge and emote so recognition is visible.

**Your rewards sheet**
- Two sections: **For you** (emotes and badges; locked or earned) and **For the group** (consequences unlocked so far).
- Locked items show what level unlocks them and that donating earns them.

**Ending**
- After L4 is reached, show a summary: consequences the group unlocked, your rewards, and a "what you did" line (votes cast, support given). Include a Reset button. Add a Reset control to the dev area too.

## Technical constraints

- Vite + React, plain JavaScript (no TypeScript), plain CSS (one stylesheet or CSS modules), no UI library, no Tailwind, no router, no backend.
- State via `useReducer` or small context. Fixtures and unlock definitions live in a single data file (for example `src/data/train.js`).
- **Data shape for later:** each unlock in the data file has a `type` field (`consequence`, `emote`, `badge`) and a `requiresVote` boolean. We will later swap consequences for other unlock types, some requiring a vote and some not. Build only this data shape. Do not build the other types or any logic for them.
- Self-contained: `npm install && npm run dev` must work on a fresh clone. No absolute paths, no secrets, no external API calls, no CDN dependencies. `.gitignore` includes `node_modules` and `dist`.
- The project folder will be uploaded to Canvas later. Export instructions have not been issued yet, so keep it plain and portable.

**Look and feel:** consistent with Twitch, not an exact copy. Dark theme: background `#0e0e10`, surface `#18181b`, text `#efeff1`, accent `#9146FF`. System sans-serif. Do not use Twitch logos or trademarks in the UI. Meter movement and level-ups should feel good: ease, a short glow, a small celebration. Keep all touch targets at least 44px.

## Out of scope: do not build

Crowd simulation, countdown timer, scripted contributions, a near-miss ending, a sequel hint (these are stage 2 and optional), weighted or members-only voting, streamer settings, streamer or mod authoring, multiple user roles, a backend, real payments, desktop layouts, or anything not listed above.

## Acceptance checklist (verify each in your plan)

- [ ] Opens at 390px wide with no horizontal scroll and all controls reachable.
- [ ] A user can vote without ever opening the Support sheet, and nothing in the vote flow mentions spending.
- [ ] A user can reach L1 and L2 with a few Support taps, with visible meter movement and a level-up moment each time.
- [ ] The user's vote can change which consequence wins a level.
- [ ] A user who only votes earns no emotes or badges, and the Your rewards sheet explains why.
- [ ] A user who donates earns the level's emote or badge, and it appears in chat next to their name.
- [ ] Reaching L4 shows the summary, and Reset returns to the initial state.
- [ ] `npm run build` passes.

## Process rules

1. Plan first. Wait for my approval before writing code.
2. If you hit a decision that changes scope (a new feature, a different data model, a library), stop and tell me the delta. Do not silently expand.
3. Run `git init` locally and commit in small steps. **Do not create a remote and do not push.** I will do that separately.
4. Write a short README: how to run, what each part is for, the fixture data and which parts are fake, and an "Open design questions" list with these items: weighted voting for consistent payers, members-only voting as a streamer setting, whether contributor rewards need a spend threshold, swapping consequences for other unlock types (some voted, some not), and how non-donors participate when an opportunity arises.
5. When done, tell me what you built, what you could not verify, and anything you left out.
