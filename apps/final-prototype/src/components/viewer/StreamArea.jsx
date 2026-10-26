import { formatTime, getLevel, liveChallenge, maxLevel } from '../../state/climbReducer.js';
import Icon from '../Icon.jsx';

// The big moments of the climb, shown on the stream itself like a streamer's overlay: the climb
// is a planned segment, so its milestones are part of the show.
function Moment({ moment, climb, ladder }) {
  const level = moment.level && getLevel(ladder, moment.level);
  const content = {
    start: { kicker: 'Community Climb', title: `${maxLevel(ladder)} goals · ${formatTime(climb.seconds)}` },
    unlock: { kicker: `🚩 Goal ${moment.level}`, title: level?.challenge },
    reveal: { kicker: '🎁 Mystery goal', title: level?.challenge },
    summit: { kicker: '⛰ Summit!', title: level?.challenge },
  }[moment.type];

  return (
    <div key={moment.key} className={`player-moment player-moment--${moment.type}`} role="status">
      <span className="player-moment-kicker">{content.kicker}</span>
      <span className="player-moment-title">{content.title}</span>
    </div>
  );
}

// The video player, as in the Twitch app. The stream stays the focus: when the streamer starts a
// challenge, a small lower-third says what's happening.
export default function StreamArea({ climb, ladder }) {
  const live = liveChallenge(climb);
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
      {climb.activeMoment && <Moment moment={climb.activeMoment} climb={climb} ladder={ladder} />}
      {level && !climb.activeMoment && (
        <div className="player-challenge" role="status">
          <span className="player-challenge-kicker">
            <span className="live-dot" aria-hidden="true" /> Live challenge · Goal {level.level}
          </span>
          <span className="player-challenge-text">{level.challenge}</span>
        </div>
      )}
    </section>
  );
}
