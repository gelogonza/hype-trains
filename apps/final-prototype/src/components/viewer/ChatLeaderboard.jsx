import { leaderboard } from '../../state/climbReducer.js';
import Icon from '../Icon.jsx';

const hype = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n));

// Twitch pins a leaderboard of top gifters and cheerers to the top of chat. During the climb it
// shows this climb's top contributors; the Lead Climber wears the mountain badge.
export default function ChatLeaderboard({ climb, onOpen }) {
  const top = leaderboard(climb).slice(0, 3);
  if (!top.length) return null;

  return (
    <button className="chat-board" onClick={onOpen} aria-label="Community Climb leaderboard. Open the full list">
      {top.map((c, i) => (
        <span key={c.name} className={`chat-board-chip${c.me ? ' is-me' : ''}`}>
          <span className={`chat-board-rank${i === 0 ? ' is-lead' : ''}`}>{i === 0 ? <Icon name="mountain" size={12} /> : i + 1}</span>
          <b>{c.me ? 'you' : c.name}</b>
          <span className="chat-board-hype">{hype(c.bits + c.subs)}</span>
        </span>
      ))}
    </button>
  );
}
