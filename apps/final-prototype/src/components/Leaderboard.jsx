import { LEADERBOARD_SIZE } from '../data/climb.js';
import { leaderboard } from '../state/climbReducer.js';
import Icon from './Icon.jsx';

const hype = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n));

// This climb's donor leaderboard. All support is pooled, so it ranks total hype; the top
// contributor is the Lead Climber.
export default function Leaderboard({ climb }) {
  const ranked = leaderboard(climb);
  const lead = ranked[0];
  const myRank = ranked.findIndex((c) => c.me) + 1;
  const shown = ranked.slice(0, LEADERBOARD_SIZE);

  return (
    <div className="board">
      <div className={`board-lead${lead?.me ? ' is-me' : ''}`}>
        <span className="board-lead-icon" aria-hidden="true">
          <Icon name="mountain" size={18} />
        </span>
        <span>
          <span className="board-lead-title">Lead Climber</span>
          <span className="board-lead-name">{lead ? (lead.me ? 'you' : lead.name) : 'Nobody yet'}</span>
        </span>
        {lead && <span className="board-hype">{hype(lead.bits + lead.subs)} hype</span>}
      </div>

      {shown.length > 0 && (
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
      )}
      <p className="board-note">
        Subs, gift subs and Bits all count. The Lead Climber wears the mountain badge in chat.
        {myRank === 0 && ' Support to join the leaderboard.'}
      </p>
    </div>
  );
}
