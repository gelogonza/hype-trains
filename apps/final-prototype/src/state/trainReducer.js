import {
  KICKOFF_NEEDED,
  LEVEL_SECONDS,
  SEED_CHAT,
  STREAMER,
  STREAMER_REACTIONS,
  STREAMER_TIMEOUT,
  SUPPORT_OPTIONS,
  USER_NAME,
} from '../data/train.js';

// The viewer's train. Level content (challenge + reward) comes from the published ladder.
//
// Phases, like the current Hype Train:
//   boarding  waiting for KICKOFF_NEEDED supporters before it departs (one is seeded)
//   running   each level has LEVEL_SECONDS; reaching a level resets the clock
//   complete  every level reached
//   ended     time ran out; levels already reached still count
//
// Reaching a level unlocks its challenge; the streamer decides when to do it. While a challenge
// is live the train holds at the station: the clock stops until the streamer finishes.

export function makeTrainState(extraChat = []) {
  return {
    phase: 'boarding',
    timeLeft: LEVEL_SECONDS,
    boarded: 1,
    points: 500,
    levelReached: 0,
    earnedLevels: [],
    donations: [],
    // The donor leaderboard: hype per person, split into Bits and subs (gift subs count as subs).
    contributors: [{ name: 'mossy_toad', bits: 0, subs: 500, me: false }],
    // Status of each reached level's challenge: 'live' or 'done'. Reached levels not listed are owed.
    challenges: {},
    recapOpen: true,
    chat: [...SEED_CHAT, ...extraChat],
    nextId: 1,
    levelUpQueue: [],
    activeLevelUp: null,
    lastGain: null,
    sheet: null,
    pendingSupport: null,
    reminder: false,
  };
}

// ---------- selectors ----------

export const getLevel = (ladder, n) => ladder.find((l) => l.level === n);
export const maxLevel = (ladder) => ladder.length;
export const hasDonated = (train) => train.donations.length > 0;
export const climbingLevel = (train, ladder) => getLevel(ladder, train.levelReached + 1) || null;
export const isLive = (train) => train.phase === 'boarding' || train.phase === 'running';

export function isFinished(train) {
  return !isLive(train) && !train.activeLevelUp && train.levelUpQueue.length === 0;
}

// ----- the streamer's challenges -----

export function challengeStatus(train, level) {
  if (level > train.levelReached) return 'locked';
  return train.challenges[level] || 'owed';
}
export const liveChallenge = (train) => Number(Object.keys(train.challenges).find((l) => train.challenges[l] === 'live')) || null;
export const isHeld = (train) => liveChallenge(train) !== null;

// ----- the donor leaderboard -----

const total = (c) => c.bits + c.subs;
// Highest total first; ties keep whoever got there first.
export const leaderboard = (train) => [...train.contributors].sort((a, b) => total(b) - total(a));

// Like the current Hype Train: the top Bits and top Subs contributors are the Conductors.
export function conductors(train) {
  const top = (key) => train.contributors.reduce((best, c) => (c[key] > (best?.[key] || 0) ? c : best), null);
  return { bits: top('bits'), subs: top('subs') };
}

// Levels the train didn't reach. They come back on the next train.
export const missedLevels = (train, ladder) => ladder.filter((l) => l.level > train.levelReached);

export function progress(train, ladder) {
  const next = climbingLevel(train, ladder);
  if (!next) return { to: 1, pct: 100 };
  const prev = getLevel(ladder, train.levelReached);
  const from = prev ? prev.threshold : 0;
  const pct = Math.max(0, Math.min(100, ((train.points - from) / (next.threshold - from)) * 100));
  return { to: next.threshold, pct };
}

export const earnedRewards = (train, ladder) =>
  train.earnedLevels.map((n) => getLevel(ladder, n).reward);

// Snapshot of a badge for a chat line, so the line keeps its look if the ladder changes later.
const badgeSnapshot = (r) => ({ name: r.name, art: r.art, gold: !!r.gold });

export const creditText = (reward) => (reward.credit ? `art by ${reward.credit}` : 'Default reward');

export const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------- reducer ----------

function addChat(train, line) {
  return { ...train, chat: [...train.chat, { id: `c${train.nextId}`, ...line }], nextId: train.nextId + 1 };
}

// Worded like Twitch's own chat notices.
function supportVerb(option) {
  if (option.group === 'bits') return `cheered ${option.label}`;
  if (option.group === 'gift') {
    const n = parseInt(option.label, 10);
    return n === 1 ? 'gifted a Tier 1 Sub to the community' : `is gifting ${n} Tier 1 Subs to the community`;
  }
  return `subscribed at ${option.short}`;
}

// One support from you or the crowd: points, a chat line, departure, and any levels it reaches.
function addSupport(train, ladder, option, who) {
  const me = !who;
  const name = me ? USER_NAME : who.author;
  const key = option.group === 'bits' ? 'bits' : 'subs';
  const before = conductors(train);
  const existing = train.contributors.find((c) => c.name === name);
  const contributors = existing
    ? train.contributors.map((c) => (c === existing ? { ...c, [key]: c[key] + option.points } : c))
    : [...train.contributors, { name, bits: 0, subs: 0, me, [key]: option.points }];
  let next = { ...train, points: train.points + option.points, contributors };
  const myBadges = () => earnedRewards(next, ladder).filter((r) => r.kind === 'badge').map(badgeSnapshot);

  if (me) {
    next = {
      ...next,
      donations: [...next.donations, { optionId: option.id, points: option.points }],
      lastGain: { amount: option.points, key: next.nextId },
    };
    next = addChat(next, { kind: 'support', me: true, author: USER_NAME, text: supportVerb(option), hype: option.points });
  } else {
    next = addChat(next, { kind: 'support', author: who.author, color: who.color, text: supportVerb(option), hype: option.points });
  }
  const leader = conductors(next)[key];
  if (leader.name !== before[key]?.name) {
    const title = key === 'bits' ? 'Bits Conductor' : 'Subs Conductor';
    next = addChat(next, { kind: 'system', text: me ? `👑 You're the new ${title}!` : `👑 ${leader.name} is the new ${title}` });
  }

  if (next.phase === 'boarding') {
    const boarded = next.boarded + 1;
    next = { ...next, boarded };
    if (boarded < KICKOFF_NEEDED) return next;
    next = { ...next, phase: 'running', timeLeft: LEVEL_SECONDS };
    next = addChat(next, { kind: 'system', text: `The Challenge Train departed! ${LEVEL_SECONDS}s to reach Level 1.` });
  }

  // Cross every threshold this support reaches, in order.
  while (next.levelReached < maxLevel(ladder) && next.points >= getLevel(ladder, next.levelReached + 1).threshold) {
    const level = getLevel(ladder, next.levelReached + 1);
    next = { ...next, levelReached: level.level, levelUpQueue: [...next.levelUpQueue, level.level], timeLeft: LEVEL_SECONDS };
    next = addChat(next, {
      kind: 'system',
      text: `Level ${level.level} reached! Challenge unlocked: "${level.challenge}". ${STREAMER.name} will do it when they're ready.`,
    });

    // Contributor reward: only for users who supported during this train.
    const reward = level.reward;
    if (hasDonated(next) && !next.earnedLevels.includes(level.level)) {
      next = { ...next, earnedLevels: [...next.earnedLevels, level.level] };
      const credit = reward.credit ? ` (art by ${reward.credit})` : '';
      next = addChat(next, { kind: 'system', text: `You earned the ${reward.name} ${reward.kind}${credit}` });
      next = addChat(next, {
        kind: 'you',
        author: USER_NAME,
        badges: myBadges(),
        // Emote codes render as the emote in chat.
        text: reward.kind === 'emote' ? `${reward.name} ${reward.name} ${reward.name}` : `new badge just dropped 🎉`,
      });
    }
  }
  if (next.levelReached >= maxLevel(ladder)) next = { ...next, phase: 'complete' };
  return next;
}

// Time ran out: the train stops where it is. Reached levels count; the rest wait for the next train.
function endTrain(train, ladder) {
  let next = { ...train, phase: 'ended', timeLeft: 0, sheet: null, pendingSupport: null };
  const missed = missedLevels(next, ladder)[0];
  next = addChat(next, {
    kind: 'system',
    text:
      train.levelReached > 0
        ? `Time's up! The train stopped at Level ${train.levelReached}. Level ${missed.level} comes back next train.`
        : "Time's up! The train didn't reach Level 1. It comes back next train.",
  });
  return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_TIMEOUT[train.levelReached] });
}

export function trainReducer(train, action, ladder) {
  switch (action.type) {
    case 'OPEN_SHEET':
      return { ...train, sheet: action.sheet, sheetTab: action.tab || null, pendingSupport: null };

    case 'SEND_CHAT': {
      const text = action.text.trim().slice(0, 200);
      if (!text) return train;
      const badges = earnedRewards(train, ladder).filter((r) => r.kind === 'badge').map(badgeSnapshot);
      return addChat(train, { kind: 'you', author: USER_NAME, badges, text });
    }

    case 'CLOSE_SHEET':
      return { ...train, sheet: null, pendingSupport: null };

    case 'SELECT_SUPPORT':
      return { ...train, pendingSupport: action.optionId };

    case 'CANCEL_SUPPORT':
      return { ...train, pendingSupport: null };

    case 'CONFIRM_SUPPORT': {
      const option = SUPPORT_OPTIONS.find((o) => o.id === train.pendingSupport);
      if (!option) return train;
      const closed = { ...train, sheet: null, pendingSupport: null };
      // Outside a train, support still shows in chat but doesn't move anything.
      if (!isLive(train)) return addChat(closed, { kind: 'support', me: true, author: USER_NAME, text: supportVerb(option) });
      return addSupport(closed, ladder, option, null);
    }

    case 'CROWD_SUPPORT': {
      const option = SUPPORT_OPTIONS.find((o) => o.id === action.optionId);
      if (!option || !isLive(train)) return train;
      return addSupport(train, ladder, option, action.who);
    }

    case 'CROWD_CHAT':
      return addChat(train, { kind: 'viewer', author: action.who.author, color: action.who.color, text: action.text });

    case 'START_CHALLENGE': {
      if (challengeStatus(train, action.level) !== 'owed' || isHeld(train)) return train;
      const level = getLevel(ladder, action.level);
      let next = { ...train, challenges: { ...train.challenges, [action.level]: 'live' } };
      next = addChat(next, {
        kind: 'system',
        text: `🔴 Live challenge: "${level.challenge}"${train.phase === 'running' ? '. The train waits at the station until it’s done.' : ''}`,
      });
      return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_REACTIONS[action.level] });
    }

    case 'FINISH_CHALLENGE': {
      if (challengeStatus(train, action.level) !== 'live') return train;
      const next = { ...train, challenges: { ...train.challenges, [action.level]: 'done' } };
      return addChat(next, {
        kind: 'system',
        text: `✅ Challenge done!${train.phase === 'running' ? ` The train leaves the station: ${formatTime(train.timeLeft)} left.` : ''}`,
      });
    }

    case 'TOGGLE_RECAP':
      return { ...train, recapOpen: !train.recapOpen };

    case 'TICK': {
      // A live challenge holds the train at the station.
      if (train.phase !== 'running' || isHeld(train)) return train;
      const timeLeft = Math.max(0, train.timeLeft - (action.seconds || 1));
      return timeLeft === 0 ? endTrain(train, ladder) : { ...train, timeLeft };
    }

    case 'TOGGLE_REMINDER':
      return { ...train, reminder: !train.reminder };

    case 'SHOW_NEXT_LEVEL_UP': {
      if (train.activeLevelUp || train.levelUpQueue.length === 0) return train;
      const [first, ...rest] = train.levelUpQueue;
      return { ...train, activeLevelUp: first, levelUpQueue: rest };
    }

    case 'DISMISS_LEVEL_UP':
      return { ...train, activeLevelUp: null };

    default:
      return train;
  }
}
