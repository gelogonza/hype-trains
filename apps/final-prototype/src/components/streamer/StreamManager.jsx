import { useEffect, useState } from 'react';
import ClimbCard from '../viewer/ClimbCard.jsx';
import Leaderboard from '../Leaderboard.jsx';
import Icon from '../Icon.jsx';
import GoalRow from './GoalRow.jsx';
import { SEGMENT_MINUTES, STREAMER } from '../../data/climb.js';
import { isLive } from '../../state/climbReducer.js';
import { canEditGoals } from '../../state/reducer.js';

// Ending a climb early is a two-tap action, so it can't happen by accident.
function EndButton({ onEnd }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button className={`tw-btn tw-btn--lg ${armed ? 'tw-btn--danger' : 'tw-btn--secondary'}`} onClick={() => (armed ? onEnd() : setArmed(true))}>
      {armed ? 'Tap again to end' : 'End climb'}
    </button>
  );
}

// The streamer's one screen for the Community Climb. The climb card carries its settings (length,
// mystery goal); the goals below are edited in place and also hold each challenge's Start / Done.
// Settings and goals lock while a climb is live.
export default function StreamManager({ state, dispatch }) {
  const { climb, goals, settings } = state;
  const editable = canEditGoals(state);
  const scheduled = climb.phase === 'scheduled';
  const activity = climb.chat.filter((l) => l.kind === 'support').slice(-6).reverse();

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
        <div className="sm-climb-card">
          <ClimbCard climb={climb} ladder={goals} />
          {editable && (
            <div className="sm-climb-settings">
              <div className="segmented" role="radiogroup" aria-label="Climb length">
                {SEGMENT_MINUTES.map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={settings.minutes === m}
                    className={settings.minutes === m ? 'is-active' : ''}
                    onClick={() => dispatch({ type: 'SET_SETTING', settings: { minutes: m } })}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <label className="sm-mystery">
                <span>Mystery</span>
                <input
                  type="checkbox"
                  className="switch"
                  checked={settings.mystery}
                  onChange={(e) => dispatch({ type: 'SET_SETTING', settings: { mystery: e.target.checked } })}
                />
              </label>
            </div>
          )}
        </div>
        {scheduled && (
          <button className="tw-btn tw-btn--climb tw-btn--lg" onClick={() => dispatch({ type: 'START_CLIMB' })}>
            <Icon name="mountain" size={18} /> Start Community Climb
          </button>
        )}
        {isLive(climb) && <EndButton onEnd={() => dispatch({ type: 'END_CLIMB' })} />}
        {!scheduled && !isLive(climb) && (
          <button className="tw-btn tw-btn--climb tw-btn--lg" onClick={() => dispatch({ type: 'NEXT_CLIMB' })}>
            Schedule next climb
          </button>
        )}
        {editable && <p className="proto-label">Prototype: lengths shortened for testing</p>}
      </section>

      <section className="sm-section">
        <h2 className="sm-heading">Goals</h2>
        <ol className="goal-rows">
          {goals.map((l) => (
            <GoalRow key={l.level} state={state} dispatch={dispatch} level={l} />
          ))}
        </ol>
      </section>

      {!scheduled && (
        <section className="sm-section">
          <h2 className="sm-heading">Top climbers</h2>
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
