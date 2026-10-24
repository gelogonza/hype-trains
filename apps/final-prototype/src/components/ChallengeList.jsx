import { STREAMER } from '../data/train.js';
import { challengeStatus } from '../state/trainReducer.js';

const LABEL = {
  locked: '🔒 Locked',
  owed: `⏳ ${STREAMER.name} will do it`,
  live: '🔴 Live now',
  done: '✅ Done',
};

// Every level's challenge and where it stands (the streamer starts them from Stream Manager).
export default function ChallengeList({ train, ladder }) {
  return (
    <ol className="challenge-list">
      {ladder.map((l) => {
        const status = challengeStatus(train, l.level);
        return (
          <li key={l.level} className={`challenge-item challenge-item--${status}`}>
            <span className="challenge-level">Lv {l.level}</span>
            <span className="challenge-text">
              {l.challenge}
              <span className="challenge-status">{LABEL[status]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
