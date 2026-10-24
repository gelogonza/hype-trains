import { CROWD, CROWD_LINES, CROWD_MIX, CROWD_RATE } from '../data/train.js';

// The simulated crowd. Picks what other viewers do this second; the reducer applies it.
// Randomness lives here so the reducers stay pure.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function pickOption() {
  let r = Math.random() * CROWD_MIX.reduce((n, [, w]) => n + w, 0);
  for (const [id, w] of CROWD_MIX) if ((r -= w) <= 0) return id;
  return CROWD_MIX[0][0];
}

export function crowdActions(train, outcome) {
  const actions = [];
  // Boarding fills quickly so the tester isn't left waiting; after that the outcome sets the pace.
  const rate = train.phase === 'boarding' ? 0.25 : CROWD_RATE[outcome];
  if (Math.random() < rate) actions.push({ type: 'CROWD_SUPPORT', who: pick(CROWD), optionId: pickOption() });
  if (Math.random() < 0.3) actions.push({ type: 'CROWD_CHAT', who: pick(CROWD), text: pick(CROWD_LINES[train.phase]) });
  return actions;
}
