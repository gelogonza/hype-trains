import ArtTile from '../ArtTile.jsx';
import { canPublish, hasUnpublishedChanges, openRequestFor, submissionsFor } from '../../state/reducer.js';
import { creditText } from '../../state/trainReducer.js';

export default function SetupHome({ state, dispatch }) {
  const dirty = hasUnpublishedChanges(state);
  const missing = state.draft.some((l) => !l.challenge.trim());

  return (
    <>
      <div className="screen-body">
        <h2 className="screen-title">Your Challenge Train</h2>
        <p className="screen-intro">
          Write a challenge for each level. Your community makes the rewards: fans submit art, mods shortlist it, you pick.
        </p>
        <ol className="ladder">
          {state.draft.map((l) => {
            const request = openRequestFor(state, l.level);
            const count = request ? submissionsFor(state, request.id).length : 0;
            const edited = JSON.stringify(l) !== JSON.stringify(state.published.find((p) => p.level === l.level));
            return (
              <li key={l.level}>
                <button className="ladder-card" onClick={() => dispatch({ type: 'STREAMER_OPEN_LEVEL', level: l.level })}>
                  <span className="ladder-top">
                    <span className="ladder-level">Level {l.level}</span>
                    <span className="muted small">{l.threshold.toLocaleString()} pts</span>
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
          {missing ? 'Add a challenge for every level to publish' : dirty ? '● Unpublished changes' : '✓ Viewers see this train'}
        </div>
        <button className="btn-primary btn-block" disabled={!canPublish(state)} onClick={() => dispatch({ type: 'PUBLISH' })}>
          Publish train
        </button>
      </div>
    </>
  );
}
