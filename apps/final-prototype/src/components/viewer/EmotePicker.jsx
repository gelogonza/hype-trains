import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import { STREAMER } from '../../data/climb.js';
import { hasDonated, isHidden } from '../../state/climbReducer.js';

function RewardTile({ level, earned, hidden, onUse }) {
  const r = level.reward;
  // The mystery goal's reward stays secret too.
  if (hidden) {
    return (
      <li>
        <span className="picker-tile is-locked">
          <span className="picker-art goal-reward goal-reward--mystery">?</span>
          <span className="picker-name">Mystery</span>
          <span className="picker-credit">Goal {level.level}</span>
        </span>
      </li>
    );
  }
  return (
    <li>
      <button
        className={`picker-tile${earned ? '' : ' is-locked'}`}
        disabled={!earned || !onUse}
        onClick={() => onUse?.(r.name)}
        aria-label={earned ? `${r.name}${onUse ? ', add to message' : ''}` : `${r.name}, locked until Goal ${level.level}`}
      >
        <span className="picker-art">
          <ArtTile art={r.art} kind={r.kind} size={40} gold={r.gold} />
          {!earned && (
            <span className="picker-lock">
              <Icon name="lock" size={14} />
            </span>
          )}
        </span>
        <span className="picker-name">{r.name}</span>
        <span className={`picker-credit${r.credit ? ' is-fan' : ''}`}>{r.credit ? `by ${r.credit}` : `Goal ${level.level}`}</span>
      </button>
    </li>
  );
}

// Twitch's emote picker. Community Climb rewards sit in their own section, most of them made by
// fans. Earned emotes go straight into your message; badges show next to your name in chat.
export default function EmotePicker({ climb, ladder, onUse, onClose }) {
  const emotes = ladder.filter((l) => l.reward.kind === 'emote');
  const badges = ladder.filter((l) => l.reward.kind === 'badge');
  const earned = (l) => climb.earnedLevels.includes(l.level);

  return (
    <BottomSheet title="Emotes" onClose={onClose}>
      <section className="picker-section">
        <h3 className="picker-heading">
          <span className="channel-avatar-img channel-avatar-img--sm" aria-hidden="true">{STREAMER.avatar}</span>
          Community Climb · {STREAMER.name}
        </h3>
        <p className="sheet-note">
          Supporters earn these when the community unlocks their goal. They're yours to keep.
          {!hasDonated(climb) && " You haven't supported this climb yet."}
        </p>
        <ul className="picker-grid">
          {emotes.map((l) => (
            <RewardTile key={l.level} level={l} earned={earned(l)} hidden={isHidden(climb, ladder, l)} onUse={onUse} />
          ))}
        </ul>
      </section>
      <section className="picker-section">
        <h3 className="picker-heading">Community Climb badges</h3>
        <p className="sheet-note">Earned badges show next to your name in {STREAMER.name}'s chat.</p>
        <ul className="picker-grid">
          {badges.map((l) => (
            <RewardTile key={l.level} level={l} earned={earned(l)} hidden={isHidden(climb, ladder, l)} />
          ))}
        </ul>
      </section>
    </BottomSheet>
  );
}
