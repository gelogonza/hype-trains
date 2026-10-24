import TrainBanner from '../viewer/TrainBanner.jsx';
import Leaderboard from '../Leaderboard.jsx';
import Icon from '../Icon.jsx';
import { STREAMER } from '../../data/train.js';
import { challengeStatus, isHeld, isLive } from '../../state/trainReducer.js';

const TILE = {
  owed: { icon: 'play', verb: 'Start' },
  live: { icon: 'check', verb: 'Done with' },
  done: { icon: 'check', verb: 'Done' },
  locked: { icon: 'lock', verb: 'Locked' },
};

// The streamer's Stream Manager while the train runs. Reaching a level only unlocks a challenge;
// the streamer starts it from a quick action when it suits the stream. Starting one holds the
// train (the clock stops) until they tap it again to finish.
export default function LiveControl({ state, dispatch }) {
  const { train, published: ladder } = state;
  const held = isHeld(train);
  const activity = train.chat.filter((l) => l.kind === 'support').slice(-6).reverse();

  return (
    <div className="screen-body">
      <div className="sm-preview">
        <span className="sm-preview-video" aria-hidden="true">
          <span className="stream-sun" />
        </span>
        <span className="sm-preview-text">
          <span className="sm-live">LIVE</span>
          <b>{STREAMER.game}</b>
          <span className="muted small">
            <Icon name="person" size={12} /> {STREAMER.viewers.toLocaleString()} viewers
          </span>
        </span>
      </div>

      <TrainBanner train={train} ladder={ladder} />

      <section className="sm-section">
        <h2 className="sm-heading">Challenges</h2>
        <p className="sm-note">
          {held
            ? 'The train is held while you do this. Tap it again when you’re done to send it off.'
            : isLive(train)
              ? 'Unlocked challenges wait for you. Start one whenever it suits the stream; the train holds until you finish.'
              : 'The train is over. You can still do any challenge you owe.'}
        </p>
        <div className="sm-tiles">
          {ladder.map((l) => {
            const status = challengeStatus(train, l.level);
            const t = TILE[status];
            const action =
              status === 'owed' && !held
                ? { type: 'START_CHALLENGE', level: l.level }
                : status === 'live'
                  ? { type: 'FINISH_CHALLENGE', level: l.level }
                  : null;
            return (
              <button key={l.level} className={`sm-tile sm-tile--${status}`} disabled={!action} onClick={() => action && dispatch(action)}>
                <span className="sm-tile-top">
                  <Icon name={t.icon} size={18} />
                  <span>Level {l.level}</span>
                  {status === 'live' && <span className="sm-live">LIVE</span>}
                </span>
                <span className="sm-tile-verb">{t.verb}</span>
                <span className="sm-tile-text">{l.challenge}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sm-section">
        <h2 className="sm-heading">Top contributors</h2>
        <p className="sm-note">For shout-outs. Viewers see the same list.</p>
        <Leaderboard train={train} />
      </section>

      <section className="sm-section">
        <h2 className="sm-heading">Activity feed</h2>
        <ul className="sm-feed">
          {activity.map((a) => (
            <li key={a.id}>
              <Icon name={/^cheered/.test(a.text) ? 'bits' : /gift/.test(a.text) ? 'gift' : 'star'} size={16} />
              <span>
                <b>{a.me ? 'You' : a.author}</b> {a.me ? a.text.replace(/^is /, 'are ') : a.text}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
