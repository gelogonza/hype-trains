import { getLevel, liveChallenge } from '../../state/trainReducer.js';
import Icon from '../Icon.jsx';

// The video player, as in the Twitch app. The stream stays the focus: when the streamer starts a
// challenge, a small lower-third says what's happening.
export default function StreamArea({ train, ladder }) {
  const live = liveChallenge(train);
  const level = live && getLevel(ladder, live);

  return (
    <section className="player" aria-label="Stream">
      <div className="player-video" aria-hidden="true">
        <div className="stream-sun" />
        <div className="stream-hill stream-hill--back" />
        <div className="stream-hill stream-hill--front" />
      </div>
      <div className="player-top">
        <button className="player-btn" aria-label="Minimize player">
          <Icon name="chevron" />
        </button>
        <span className="player-spacer" />
        <button className="player-btn" aria-label="Settings">
          <Icon name="gear" />
        </button>
        <button className="player-btn" aria-label="More">
          <Icon name="dots" />
        </button>
      </div>
      <span className="player-live">LIVE</span>
      {level && (
        <div className="player-challenge" role="status">
          <span className="player-challenge-kicker">
            <span className="live-dot" aria-hidden="true" /> Live challenge · Level {level.level}
          </span>
          <span className="player-challenge-text">{level.challenge}</span>
        </div>
      )}
    </section>
  );
}
