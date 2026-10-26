import {
  ALMOST_PCT,
  CROWD,
  SEED_CHAT,
  STREAMER,
  STREAMER_END,
  STREAMER_REACTIONS,
  STREAMER_START,
  STREAMER_SUMMIT,
  SUPPORT_OPTIONS,
  USER_NAME,
} from '../data/climb.js';

// The Community Climb: a segment the streamer plans and runs. Goal content (challenge + reward)
// comes from the streamer's goals; in the data each goal is a `level`.
//
// Phases:
//   scheduled  announced; viewers can preview the goals, but nothing counts until it starts
//   live       the streamer started it; one countdown runs for the whole climb
//   complete   every goal reached (the summit)
//   ended      time ran out, or the streamer ended it; reached goals count, the rest carry over
//
// Reaching a goal unlocks its challenge; the streamer decides when to do it. While a challenge is
// live the clock pauses. With `settings.mystery`, the final goal stays hidden until the one
// before it is reached.

export function makeClimbState(settings, { carried = [], earnedLevels = [], extraChat = [] } = {}) {
  return {
    phase: 'scheduled',
    seconds: settings.minutes * 60,
    timeLeft: settings.minutes * 60,
    mystery: settings.mystery,
    endedBy: null,
    points: 0,
    levelReached: 0,
    // Rewards stay yours from one climb to the next.
    earnedLevels,
    donations: [],
    // Goals the last climb didn't reach; the preview marks them "back from last climb".
    carried,
    // The donor leaderboard: hype per person (gift subs count as subs).
    contributors: [],
    // Status of each reached goal's challenge: 'live' or 'done'. Reached goals not listed are owed.
    challenges: {},
    // Goals already called out as "almost there", so each is called out once.
    almost: [],
    recapOpen: true,
    chat: [...SEED_CHAT, ...extraChat],
    nextId: 1,
    // On-stream moments, played one at a time: start, unlock, reveal, summit.
    moments: [],
    activeMoment: null,
    lastGain: null,
    sheet: null,
    sheetTab: null,
    pendingSupport: null,
    reminder: false,
  };
}

// ---------- selectors ----------

export const getLevel = (ladder, n) => ladder.find((l) => l.level === n);
export const maxLevel = (ladder) => ladder.length;
export const hasDonated = (climb) => climb.donations.length > 0;
export const nextGoal = (climb, ladder) => getLevel(ladder, climb.levelReached + 1) || null;
export const isLive = (climb) => climb.phase === 'live';
export const isOver = (climb) => climb.phase === 'complete' || climb.phase === 'ended';

export function isFinished(climb) {
  return isOver(climb) && !climb.activeMoment && climb.moments.length === 0;
}

// The mystery goal stays hidden until the goal before it is reached.
export const isHidden = (climb, ladder, level) => climb.mystery && level.level === maxLevel(ladder) && climb.levelReached < level.level - 1;

// ----- the streamer's challenges -----

export function challengeStatus(climb, level) {
  if (level > climb.levelReached) return 'locked';
  return climb.challenges[level] || 'owed';
}
export const liveChallenge = (climb) => Number(Object.keys(climb.challenges).find((l) => climb.challenges[l] === 'live')) || null;
export const isHeld = (climb) => liveChallenge(climb) !== null;

// ----- the donor leaderboard -----

const total = (c) => c.bits + c.subs;
// Highest total first; ties keep whoever got there first.
export const leaderboard = (climb) => [...climb.contributors].sort((a, b) => total(b) - total(a));
// The top contributor leads the climb and wears the Lead Climber badge in chat.
export const leadClimber = (climb) => leaderboard(climb)[0] || null;

// Goals the climb didn't reach. They come back next climb.
export const missedLevels = (climb, ladder) => ladder.filter((l) => l.level > climb.levelReached);

export function progress(climb, ladder) {
  const next = nextGoal(climb, ladder);
  if (!next) return { from: 0, to: 1, pct: 100 };
  const prev = getLevel(ladder, climb.levelReached);
  const from = prev ? prev.threshold : 0;
  const pct = Math.max(0, Math.min(100, ((climb.points - from) / (next.threshold - from)) * 100));
  return { from, to: next.threshold, pct };
}

export const isAlmost = (climb, ladder) => isLive(climb) && progress(climb, ladder).pct >= ALMOST_PCT;

export const earnedRewards = (climb, ladder) =>
  climb.earnedLevels.map((n) => getLevel(ladder, n)?.reward).filter(Boolean);

// Snapshot of a badge for a chat line, so the line keeps its look if the goals change later.
const badgeSnapshot = (r) => ({ name: r.name, art: r.art, gold: !!r.gold });

export const creditText = (reward) => (reward.credit ? `art by ${reward.credit}` : 'Default reward');

export const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ---------- reducer ----------

// Like Twitch badges, the Lead Climber badge is stamped on a message when it's sent.
function addChat(climb, line) {
  const lead = line.author && line.author === leadClimber(climb)?.name;
  return { ...climb, chat: [...climb.chat, { id: `c${climb.nextId}`, ...line, ...(lead && { lead }) }], nextId: climb.nextId + 1 };
}

const addMoment = (climb, moment) => ({ ...climb, moments: [...climb.moments, { ...moment, key: climb.nextId }] });

// Worded like Twitch's own chat notices.
function supportVerb(option) {
  if (option.group === 'bits') return `cheered ${option.label}`;
  if (option.group === 'gift') {
    const n = parseInt(option.label, 10);
    return n === 1 ? 'gifted a Tier 1 Sub to the community' : `is gifting ${n} Tier 1 Subs to the community`;
  }
  return `subscribed at ${option.short}`;
}

// One support from you or the crowd: hype, a chat line, and any goals it reaches.
function addSupport(climb, ladder, option, who) {
  const me = !who;
  const name = me ? USER_NAME : who.author;
  const key = option.group === 'bits' ? 'bits' : 'subs';
  const leaderBefore = leadClimber(climb);
  const existing = climb.contributors.find((c) => c.name === name);
  const contributors = existing
    ? climb.contributors.map((c) => (c === existing ? { ...c, [key]: c[key] + option.points } : c))
    : [...climb.contributors, { name, bits: 0, subs: 0, me, [key]: option.points }];
  let next = { ...climb, points: climb.points + option.points, contributors };
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
  const leader = leadClimber(next);
  if (leader.name !== leaderBefore?.name) {
    next = addChat(next, { kind: 'system', text: `⛰ ${me ? 'You' : leader.name} took the lead` });
  }

  // Reach every goal this support covers, in order.
  while (next.levelReached < maxLevel(ladder) && next.points >= getLevel(ladder, next.levelReached + 1).threshold) {
    const level = getLevel(ladder, next.levelReached + 1);
    next = { ...next, levelReached: level.level };
    next = addMoment(next, { type: level.level === maxLevel(ladder) ? 'summit' : 'unlock', level: level.level });
    next = addChat(next, { kind: 'system', text: `🚩 Goal ${level.level}: ${level.challenge}` });

    // The fan who made the emote shows off their creator version.
    const reward = level.reward;
    const creator = reward.kind === 'emote' && reward.credit && CROWD.find((c) => `@${c.author}` === reward.credit);
    if (creator) {
      next = addChat(next, { kind: 'viewer', author: creator.author, color: creator.color, text: `${reward.name} ${reward.name} 🥹` });
    }

    // Contributor reward: only for users who supported during this climb.
    if (hasDonated(next) && !next.earnedLevels.includes(level.level)) {
      next = { ...next, earnedLevels: [...next.earnedLevels, level.level] };
      next = addChat(next, { kind: 'system', text: `You got ${reward.name}` });
      next = addChat(next, {
        kind: 'you',
        author: USER_NAME,
        badges: myBadges(),
        // Emote codes render as the emote in chat.
        text: reward.kind === 'emote' ? `${reward.name} ${reward.name} ${reward.name}` : `new badge just dropped 🎉`,
      });
    }

    // Reaching the goal before the mystery one reveals it.
    const after = getLevel(ladder, level.level + 1);
    if (after && next.mystery && after.level === maxLevel(ladder)) {
      next = addMoment(next, { type: 'reveal', level: after.level });
      next = addChat(next, { kind: 'system', text: `🎁 Mystery goal: ${after.challenge}` });
    }
  }

  if (next.levelReached >= maxLevel(ladder)) {
    next = { ...next, phase: 'complete', endedBy: 'summit' };
    return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_SUMMIT });
  }

  // Call out the push to each goal once, when it gets close.
  const goal = nextGoal(next, ladder);
  if (progress(next, ladder).pct >= ALMOST_PCT && !next.almost.includes(goal.level)) {
    const left = goal.threshold - next.points;
    next = { ...next, almost: [...next.almost, goal.level] };
    next = addChat(next, { kind: 'system', text: `⛰ Almost! ${left.toLocaleString()} to Goal ${goal.level}` });
  }
  return next;
}

// The climb ends early: time ran out, or the streamer ended it. Reached goals count; the rest carry over.
function endClimb(climb, by) {
  let next = { ...climb, phase: 'ended', endedBy: by, sheet: null, pendingSupport: null };
  const reached = climb.levelReached;
  next = addChat(next, {
    kind: 'system',
    text: `${by === 'time' ? "⏰ Time's up" : '⛰ Climb ended'} · ${reached ? `reached Goal ${reached}` : 'no goals this time'}`,
  });
  return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_END[reached] });
}

export function climbReducer(climb, action, ladder) {
  switch (action.type) {
    case 'OPEN_SHEET':
      return { ...climb, sheet: action.sheet, sheetTab: action.tab || null, pendingSupport: null };

    case 'CLOSE_SHEET':
      return { ...climb, sheet: null, pendingSupport: null };

    case 'SEND_CHAT': {
      const text = action.text.trim().slice(0, 200);
      if (!text) return climb;
      const badges = earnedRewards(climb, ladder).filter((r) => r.kind === 'badge').map(badgeSnapshot);
      return addChat(climb, { kind: 'you', author: USER_NAME, badges, text });
    }

    case 'SELECT_SUPPORT':
      return { ...climb, pendingSupport: action.optionId };

    case 'CANCEL_SUPPORT':
      return { ...climb, pendingSupport: null };

    case 'CONFIRM_SUPPORT': {
      const option = SUPPORT_OPTIONS.find((o) => o.id === climb.pendingSupport);
      if (!option) return climb;
      const closed = { ...climb, sheet: null, pendingSupport: null };
      // Outside a live climb, support still shows in chat but doesn't move anything.
      if (!isLive(climb)) return addChat(closed, { kind: 'support', me: true, author: USER_NAME, text: supportVerb(option) });
      return addSupport(closed, ladder, option, null);
    }

    case 'CROWD_SUPPORT': {
      const option = SUPPORT_OPTIONS.find((o) => o.id === action.optionId);
      if (!option || !isLive(climb)) return climb;
      return addSupport(climb, ladder, option, action.who);
    }

    case 'CROWD_CHAT':
      return addChat(climb, { kind: 'viewer', author: action.who.author, color: action.who.color, text: action.text });

    // ----- the streamer runs the climb -----

    case 'START_CLIMB': {
      if (climb.phase !== 'scheduled') return climb;
      let next = addMoment({ ...climb, phase: 'live', timeLeft: climb.seconds }, { type: 'start' });
      next = addChat(next, { kind: 'system', text: `⛰ Community Climb started · ${formatTime(climb.seconds)}` });
      return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_START });
    }

    case 'END_CLIMB':
      return isLive(climb) ? endClimb(climb, 'streamer') : climb;

    case 'START_CHALLENGE': {
      if (challengeStatus(climb, action.level) !== 'owed' || isHeld(climb)) return climb;
      const level = getLevel(ladder, action.level);
      let next = { ...climb, challenges: { ...climb.challenges, [action.level]: 'live' } };
      next = addChat(next, { kind: 'system', text: `🔴 Live: ${level.challenge}` });
      return addChat(next, { kind: 'streamer', author: STREAMER.name, text: STREAMER_REACTIONS[action.level] });
    }

    case 'FINISH_CHALLENGE': {
      if (challengeStatus(climb, action.level) !== 'live') return climb;
      const next = { ...climb, challenges: { ...climb.challenges, [action.level]: 'done' } };
      return addChat(next, { kind: 'system', text: '✅ Challenge done' });
    }

    case 'TICK': {
      // A live challenge pauses the clock.
      if (!isLive(climb) || isHeld(climb)) return climb;
      const timeLeft = Math.max(0, climb.timeLeft - (action.seconds || 1));
      return timeLeft === 0 ? endClimb({ ...climb, timeLeft }, 'time') : { ...climb, timeLeft };
    }

    case 'TOGGLE_RECAP':
      return { ...climb, recapOpen: !climb.recapOpen };

    case 'TOGGLE_REMINDER':
      return { ...climb, reminder: !climb.reminder };

    case 'SHOW_NEXT_MOMENT': {
      if (climb.activeMoment || climb.moments.length === 0) return climb;
      const [first, ...rest] = climb.moments;
      return { ...climb, activeMoment: first, moments: rest };
    }

    case 'DISMISS_MOMENT':
      return { ...climb, activeMoment: null };

    default:
      return climb;
  }
}
