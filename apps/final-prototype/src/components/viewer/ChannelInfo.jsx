import { useState } from 'react';
import { STREAMER } from '../../data/climb.js';
import Icon from '../Icon.jsx';

// The row under the player in the Twitch app: avatar with a live ring, name, title, category,
// red viewer count, then Follow and Subscribe.
export default function ChannelInfo({ onSubscribe }) {
  const [following, setFollowing] = useState(false);

  return (
    <section className="channel" aria-label="Channel">
      <span className="channel-avatar" aria-hidden="true">
        <span className="channel-avatar-img">{STREAMER.avatar}</span>
        <span className="channel-avatar-live">LIVE</span>
      </span>
      <div className="channel-text">
        <div className="channel-name">
          {STREAMER.name}
          <span className="channel-verified">
            <Icon name="verified" size={14} title="Verified" />
          </span>
        </div>
        <div className="channel-title">{STREAMER.title}</div>
        <div className="channel-meta">
          <span className="channel-game">{STREAMER.game}</span>
          <span className="channel-viewers">
            <Icon name="person" size={13} /> {STREAMER.viewers.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="channel-actions">
        <button
          className={`tw-btn tw-btn--icon${following ? ' tw-btn--secondary' : ' tw-btn--primary'}`}
          aria-pressed={following}
          aria-label={following ? 'Unfollow' : 'Follow'}
          onClick={() => setFollowing((f) => !f)}
        >
          <Icon name={following ? 'heart' : 'heartLine'} />
        </button>
        <button className="tw-btn tw-btn--secondary" onClick={onSubscribe}>
          <Icon name="star" size={16} /> Subscribe
        </button>
      </div>
    </section>
  );
}
