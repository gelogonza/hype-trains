import { useEffect, useState } from 'react';
import ClimbCard from '../viewer/ClimbCard.jsx';
import Leaderboard from '../Leaderboard.jsx';
import Icon from '../Icon.jsx';
import { STREAMER } from '../../data/climb.js';
import { challengeStatus, formatTime, isHeld, isHidden, isLive, maxLevel } from '../../state/climbReducer.js';

const TILE = {
  owed: { icon: 'play', verb: 'Start' },
  live: { icon: 'check', verb: 'Done with' },
  done: { icon: 'check', verb: 'Done' },
  locked: { icon: 'lock', verb: 'Locked' },
};

// Ending a climb early is a two-tap action, so it can't happen by accident.
function EndButton({ onEnd }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button className={`tw-btn ${armed ? 'tw-btn--danger' : 'tw-btn--secondary'}`} onClick={() => (armed ? onEnd() : setArmed(true))}>
      {armed ? 'Tap again to end' : 'End climb'}
    </button>
  );
}

// The streamer's Stream Manager. The Community Climb is a planned segment: the streamer starts
// it, one countdown runs, and they can end it early. Reaching a goal only unlocks its challenge;
// the streamer starts each one from a quick action when it suits the stream, which pauses the
// clock until they tap it again to finish. Only one of the climb and the Hype Train runs at a time.
export default function LiveControl({ state, dispatch }) {
  const { climb, published: ladder } = state;
  const held = isHeld(climb);
  const activity = climb.chat.filter((l) => l.kind === 'support').slice(-6).reverse();
  const scheduled = climb.phase === 'scheduled';

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

      <section className="sm-climb">
        <ClimbCard climb={climb} ladder={ladder} />
        {scheduled && (
          <div className="sm-climb-start">
            <p className="sm-note">
              {maxLevel(ladder)} goals · {formatTime(climb.seconds)} segment{climb.mystery && ' · final goal is a mystery'}. Viewers can see
              it's coming up. Start it when you're ready for the segment.
            </p>
            <button className="tw-btn tw-btn--climb tw-btn--lg" onClick={() => dispatch({ type: 'START_CLIMB' })}>
              <Icon name="mountain" size={18} /> Start Community Climb
            </button>
            <button className="tw-btn tw-btn--secondary" onClick={() => dispatch({ type: 'STREAMER_TAB', tab: 'setup' })}>
              Edit goals
            </button>
          </div>
        )}
        {isLive(climb) && (
          <div className="sm-climb-row">
            <span className="sm-note">
              {held ? 'Clock paused while you do the challenge.' : `${formatTime(climb.timeLeft)} left in the segment.`}
            </span>
            <EndButton onEnd={() => dispatch({ type: 'END_CLIMB' })} />
          </div>
        )}
        {!scheduled && !isLive(climb) && (
          <div className="sm-climb-start">
            <p className="sm-note">
              Climb over. Unreached goals come back when you schedule the next one, and supporters keep their rewards.
            </p>
            <button className="tw-btn tw-btn--climb tw-btn--lg" onClick={() => dispatch({ type: 'NEXT_CLIMB' })}>
              Schedule the next climb
            </button>
          </div>
        )}
      </section>

      <div className="sm-hype">
        <Icon name="bits" size={16} />
        <span>
          <b>Hype Train</b> · {isLive(climb) ? 'off while the Community Climb runs' : 'on'}
        </span>
      </div>

      <section className="sm-section">
        <h2 className="sm-heading">Challenges</h2>
        <p className="sm-note">
          {held
            ? 'Tap the live challenge when you’re done to restart the clock.'
            : 'Unlocked challenges wait for you. Start one whenever it suits the stream; the clock pauses until you finish.'}
        </p>
        <div className="sm-tiles">
          {ladder.map((l) => {
            const status = challengeStatus(climb, l.level);
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
                  <span>Goal {l.level}</span>
                  {isHidden(climb, ladder, l) && <span className="sm-tag">Mystery</span>}
                  {status === 'live' && <span className="sm-live">LIVE</span>}
                </span>
                <span className="sm-tile-verb">{t.verb}</span>
                <span className="sm-tile-text">{l.challenge}</span>
              </button>
            );
          })}
        </div>
      </section>

      {!scheduled && (
        <section className="sm-section">
          <h2 className="sm-heading">Top climbers</h2>
          <p className="sm-note">For shout-outs. Viewers see the same list.</p>
          <Leaderboard climb={climb} />
        </section>
      )}

      {activity.length > 0 && (
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
      )}
    </div>
  );
}
