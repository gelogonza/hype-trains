import { CROWD, CROWD_LINES, CROWD_MIX, CROWD_RATE } from '../data/climb.js';

// The simulated crowd. Picks what other viewers do this second; the reducer applies it.
// Randomness lives here so the reducers stay pure.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pickOption() {
  let r = Math.random() * CROWD_MIX.reduce((n, [, w]) => n + w, 0);
  for (const [id, w] of CROWD_MIX) if ((r -= w) <= 0) return id;
  return CROWD_MIX[0][0];
}

// Before the climb starts the crowd only chats (support wouldn't count yet). During it, the
// prototype outcome sets how often they support.
export function crowdActions(climb, outcome) {
  const actions = [];
  if (climb.phase === 'live' && Math.random() < CROWD_RATE[outcome]) {
    actions.push({ type: 'CROWD_SUPPORT', who: pick(CROWD), optionId: pickOption() });
  }
  if (Math.random() < 0.25) actions.push({ type: 'CROWD_CHAT', who: pick(CROWD), text: pick(CROWD_LINES[climb.phase]) });
  return actions;
}
