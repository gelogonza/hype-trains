import { LEADERBOARD_SIZE } from '../data/train.js';
import { conductors, leaderboard } from '../state/trainReducer.js';

const hype = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n));

// The donor leaderboard, as on the current Hype Train: two Conductors (top Bits, top Subs),
// then everyone ranked by total hype.
export default function Leaderboard({ train }) {
  const { bits, subs } = conductors(train);
  const ranked = leaderboard(train);
  const myRank = ranked.findIndex((c) => c.me) + 1;
  const shown = ranked.slice(0, LEADERBOARD_SIZE);

  return (
    <div className="board">
      <div className="board-conductors">
        {[
          ['Bits Conductor', bits, 'bits'],
          ['Subs Conductor', subs, 'subs'],
        ].map(([title, c, key]) => (
          <div key={key} className={`board-conductor${c?.me ? ' is-me' : ''}`}>
            <span className="board-crown" aria-hidden="true">👑</span>
            <span className="board-conductor-title">{title}</span>
            <span className="board-conductor-name">{c ? (c.me ? 'you' : c.name) : 'Nobody yet'}</span>
            {c && <span className="muted small">{hype(c[key])} {key === 'bits' ? 'Bits' : 'hype in subs'}</span>}
          </div>
        ))}
      </div>

      <ol className="board-list">
        {shown.map((c, i) => (
          <li key={c.name} className={c.me ? 'is-me' : ''}>
            <span className="board-rank">{i + 1}</span>
            <span className="board-name">{c.me ? 'you' : c.name}</span>
            <span className="board-hype">{hype(c.bits + c.subs)}</span>
          </li>
        ))}
        {myRank > LEADERBOARD_SIZE && (
          <li className="is-me">
            <span className="board-rank">{myRank}</span>
            <span className="board-name">you</span>
            <span className="board-hype">{hype(ranked[myRank - 1].bits + ranked[myRank - 1].subs)}</span>
          </li>
        )}
      </ol>
      <p className="board-note">
        Conductors wear the crown badge in chat until the next train.
        {myRank === 0 && ' Support to join the leaderboard.'}
      </p>
    </div>
  );
}
