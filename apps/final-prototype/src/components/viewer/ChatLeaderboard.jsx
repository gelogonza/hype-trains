import { conductors, leaderboard } from '../../state/trainReducer.js';
import Icon from '../Icon.jsx';

const hype = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K` : String(n));

// Twitch pins a leaderboard of top gifters and cheerers to the top of chat. During the train it
// shows this train's top contributors; the Conductors (top Bits, top Subs) wear the crown.
export default function ChatLeaderboard({ train, onOpen }) {
  const top = leaderboard(train).slice(0, 3);
  const { bits, subs } = conductors(train);
  if (!top.length) return null;

  return (
    <button className="chat-board" onClick={onOpen} aria-label="Challenge Train leaderboard. Open the full list">
      {top.map((c, i) => {
        const crown = c.name === bits?.name || c.name === subs?.name;
        return (
          <span key={c.name} className={`chat-board-chip${c.me ? ' is-me' : ''}`}>
            <span className={`chat-board-rank${crown ? ' is-crown' : ''}`}>{crown ? <Icon name="crown" size={12} /> : i + 1}</span>
            <b>{c.me ? 'you' : c.name}</b>
            <span className="chat-board-hype">{hype(c.bits + c.subs)}</span>
          </span>
        );
      })}
    </button>
  );
}
