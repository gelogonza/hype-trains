import BottomSheet from '../BottomSheet.jsx';
import ArtTile from '../ArtTile.jsx';
import Icon from '../Icon.jsx';
import { STREAMER } from '../../data/train.js';
import { hasDonated } from '../../state/trainReducer.js';

function RewardTile({ level, earned, onUse }) {
  const r = level.reward;
  return (
    <li>
      <button
        className={`picker-tile${earned ? '' : ' is-locked'}`}
        disabled={!earned || !onUse}
        onClick={() => onUse?.(r.name)}
        aria-label={earned ? `${r.name}${onUse ? ', add to message' : ''}` : `${r.name}, locked until Level ${level.level}`}
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
        <span className={`picker-credit${r.credit ? ' is-fan' : ''}`}>{r.credit ? `by ${r.credit}` : `Level ${level.level}`}</span>
      </button>
    </li>
  );
}

// Twitch's emote picker. Challenge Train rewards sit in their own section, most of them made by
// fans. Earned emotes go straight into your message; badges show next to your name in chat.
export default function EmotePicker({ train, ladder, onUse, onClose }) {
  const emotes = ladder.filter((l) => l.reward.kind === 'emote');
  const badges = ladder.filter((l) => l.reward.kind === 'badge');
  const earned = (l) => train.earnedLevels.includes(l.level);

  return (
    <BottomSheet title="Emotes" onClose={onClose}>
      <section className="picker-section">
        <h3 className="picker-heading">
          <span className="channel-avatar-img channel-avatar-img--sm" aria-hidden="true">{STREAMER.avatar}</span>
          Challenge Train · {STREAMER.name}
        </h3>
        <p className="sheet-note">
          Supporters earn these when the train reaches their level.
          {!hasDonated(train) && " You haven't supported this train yet."}
        </p>
        <ul className="picker-grid">
          {emotes.map((l) => (
            <RewardTile key={l.level} level={l} earned={earned(l)} onUse={onUse} />
          ))}
        </ul>
      </section>
      <section className="picker-section">
        <h3 className="picker-heading">Challenge Train badges</h3>
        <p className="sheet-note">Earned badges show next to your name in {STREAMER.name}'s chat.</p>
        <ul className="picker-grid">
          {badges.map((l) => (
            <RewardTile key={l.level} level={l} earned={earned(l)} />
          ))}
        </ul>
      </section>
    </BottomSheet>
  );
}
