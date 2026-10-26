import { STREAMER } from '../data/climb.js';
import { challengeStatus, isHidden } from '../state/climbReducer.js';
import ArtTile from './ArtTile.jsx';

const LABEL = {
  locked: 'Locked',
  owed: `Unlocked · ${STREAMER.name} will do it`,
  live: '🔴 Happening now',
  done: '✅ Done on stream',
};

// Every goal: what it unlocks for everyone (the challenge) and for supporters (the reward), and
// where it stands. The mystery goal stays a "?" until it's revealed.
export default function GoalList({ climb, ladder }) {
  return (
    <ol className="goal-list">
      {ladder.map((l) => {
        const status = challengeStatus(climb, l.level);
        const hidden = isHidden(climb, ladder, l);
        const carried = climb.carried.includes(l.level) && climb.phase === 'scheduled';
        return (
          <li key={l.level} className={`goal-item goal-item--${status}${hidden ? ' goal-item--mystery' : ''}`}>
            <span className="goal-flag" aria-hidden="true">
              {hidden ? '?' : status === 'locked' ? l.level : '🚩'}
            </span>
            <span className="goal-text">
              <span className="goal-head">
                Goal {l.level} · {l.threshold.toLocaleString()} hype
                {carried && <span className="goal-tag">Back from last climb</span>}
              </span>
              <span className="goal-challenge">{hidden ? 'Mystery goal: revealed when Goal ' + (l.level - 1) + ' unlocks' : l.challenge}</span>
              <span className="goal-status">{LABEL[status]}</span>
            </span>
            {hidden ? (
              <span className="goal-reward goal-reward--mystery" aria-label="Mystery reward">?</span>
            ) : (
              <ArtTile art={l.reward.art} kind={l.reward.kind} size={30} gold={l.reward.gold} title={l.reward.name} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
