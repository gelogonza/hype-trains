import ArtTile from '../ArtTile.jsx';
import { canPublish, hasUnpublishedChanges, openRequestFor, submissionsFor } from '../../state/reducer.js';
import { isLive } from '../../state/climbReducer.js';
import { SEGMENT_MINUTES } from '../../data/climb.js';

export default function SetupHome({ state, dispatch }) {
  const dirty = hasUnpublishedChanges(state);
  const missing = state.draft.some((l) => !l.challenge.trim());

  return (
    <>
      <div className="screen-body">
        <h2 className="screen-title">Your Community Climb</h2>
        <p className="screen-intro">
          Plan a segment of your stream: a goal for each step, with a challenge you'll do live. Your community makes the
          rewards: fans submit art, mods shortlist it, you pick.
        </p>

        <section className="climb-settings" aria-label="Climb settings">
          <div className="climb-setting">
            <span>
              <b>Segment length</b>
              <span className="muted small">One countdown for the whole climb. You can end it early.</span>
            </span>
            <div className="segmented" role="radiogroup" aria-label="Segment length">
              {SEGMENT_MINUTES.map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={state.draftSettings.minutes === m}
                  className={state.draftSettings.minutes === m ? 'is-active' : ''}
                  onClick={() => dispatch({ type: 'SET_SETTING', settings: { minutes: m } })}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>
          <label className="climb-setting climb-setting--toggle">
            <span>
              <b>Mystery final goal</b>
              <span className="muted small">Hidden from viewers until the goal before it unlocks.</span>
            </span>
            <input
              type="checkbox"
              className="switch"
              checked={state.draftSettings.mystery}
              onChange={(e) => dispatch({ type: 'SET_SETTING', settings: { mystery: e.target.checked } })}
            />
          </label>
          <p className="muted small">Prototype: segments are shortened for testing. Real ones would run 15–60 minutes.</p>
        </section>

        <h3 className="editor-heading">Goals</h3>
        <ol className="ladder">
          {state.draft.map((l) => {
            const request = openRequestFor(state, l.level);
            const count = request ? submissionsFor(state, request.id).length : 0;
            const edited = JSON.stringify(l) !== JSON.stringify(state.published.find((p) => p.level === l.level));
            return (
              <li key={l.level}>
                <button className="ladder-card" onClick={() => dispatch({ type: 'STREAMER_OPEN_LEVEL', level: l.level })}>
                  <span className="ladder-top">
                    <span className="ladder-level">Goal {l.level}</span>
                    <span className="muted small">{l.threshold.toLocaleString()} hype</span>
                    {l.level === state.draft.length && state.draftSettings.mystery && <span className="tag tag--kind">Mystery</span>}
                    {edited && <span className="tag tag--draft">Edited</span>}
                    <span className="ladder-chevron" aria-hidden="true">›</span>
                  </span>
                  <span className="ladder-challenge">
                    {l.challenge.trim() ? l.challenge : <span className="warn">No challenge yet</span>}
                  </span>
                  <span className="ladder-reward">
                    <ArtTile art={l.reward.art} kind={l.reward.kind} size={22} gold={l.reward.gold} />
                    <span>{l.reward.name}</span>
                    <span className={`muted small${l.reward.credit ? ' fan-credit' : ''}`}>
                      {l.reward.credit ? `Fan art by ${l.reward.credit}` : 'Default reward'}
                    </span>
                  </span>
                  {request && <span className="ladder-request">📣 Request open · {count} submissions</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="screen-footer">
        <div className={`publish-status${dirty ? ' publish-status--dirty' : ''}`}>
          {missing
            ? 'Add a challenge for every goal to publish'
            : isLive(state.climb)
              ? 'Your climb is live. Publish changes after it ends.'
              : dirty
                ? '● Unpublished changes'
                : '✓ Viewers see this climb'}
        </div>
        <button className="btn-primary btn-block" disabled={!canPublish(state)} onClick={() => dispatch({ type: 'PUBLISH' })}>
          Publish climb
        </button>
      </div>
    </>
  );
}
