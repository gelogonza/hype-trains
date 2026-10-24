import ArtTile from '../ArtTile.jsx';
import RequestForm from './RequestForm.jsx';
import ReviewSubmissions from './ReviewSubmissions.jsx';
import { COMMUNITY_PROMPTS } from '../../data/train.js';
import { openRequestFor, submissionsFor, vaultItems } from '../../state/reducer.js';

export default function LevelEditor({ state, dispatch }) {
  const n = state.ui.streamerLevel;
  const level = state.draft.find((l) => l.level === n);
  const panel = state.ui.streamerPanel;
  const request = openRequestFor(state, n);
  const subs = request ? submissionsFor(state, request.id) : [];
  const vault = vaultItems(state);
  const back = () =>
    panel === 'edit' ? dispatch({ type: 'STREAMER_OPEN_LEVEL', level: null }) : dispatch({ type: 'STREAMER_PANEL', panel: 'edit' });

  return (
    <>
      <div className="screen-nav">
        <button className="back-btn" onClick={back}>
          ‹ {panel === 'edit' ? 'All levels' : `Level ${n}`}
        </button>
        <span className="screen-nav-title">
          {panel === 'edit' ? `Level ${n}` : panel === 'request' ? 'Request art' : 'Pick a reward'}
        </span>
      </div>

      <div className="screen-body">
        {panel === 'request' && <RequestForm level={n} dispatch={dispatch} />}
        {panel === 'review' && <ReviewSubmissions level={n} request={request} subs={subs} vault={vault} dispatch={dispatch} />}
        {panel === 'edit' && (
          <>
            <section className="editor-section">
              <h3 className="editor-heading">
                Challenge <span className="muted">· the group gets this</span>
              </h3>
              <details className="prompts" open={!level.challenge.trim()}>
                <summary>Need ideas? Think about your community</summary>
                <ul>
                  {COMMUNITY_PROMPTS.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </details>
              <textarea
                className="text-input"
                rows={2}
                maxLength={80}
                value={level.challenge}
                placeholder="Write it the way you'd say it on stream"
                aria-label={`Challenge for level ${n}`}
                onChange={(e) => dispatch({ type: 'SET_CHALLENGE', level: n, text: e.target.value })}
              />
              <div className="char-count">{level.challenge.length}/80</div>
            </section>

            <section className="editor-section">
              <h3 className="editor-heading">
                Reward <span className="muted">· supporters earn this</span>
              </h3>
              <div className="current-reward">
                <ArtTile art={level.reward.art} kind={level.reward.kind} size={52} gold={level.reward.gold} />
                <div>
                  <div className="current-reward-name">{level.reward.name}</div>
                  <div className="muted small">
                    {level.reward.kind} · {level.reward.credit ? <span className="fan-credit">Fan art by {level.reward.credit}</span> : 'Default reward'}
                  </div>
                </div>
              </div>

              {request ? (
                <div className="request-card">
                  <div className="request-card-title">📣 Request open</div>
                  <p>"{request.brief}"</p>
                  <p className="muted small">
                    {subs.length} submissions · {subs.filter((s) => s.shortlisted).length} shortlisted by mods
                  </p>
                  <button className="btn-primary btn-block" onClick={() => dispatch({ type: 'STREAMER_PANEL', panel: 'review' })}>
                    Review submissions
                  </button>
                </div>
              ) : (
                <button className="btn-primary btn-block" onClick={() => dispatch({ type: 'STREAMER_PANEL', panel: 'request' })}>
                  Request art from the community
                </button>
              )}

              <div className="editor-actions">
                {!request && vault.length > 0 && (
                  <button className="btn-secondary" onClick={() => dispatch({ type: 'STREAMER_PANEL', panel: 'review' })}>
                    From the vault ({vault.length})
                  </button>
                )}
                {level.reward.credit && (
                  <button className="btn-secondary" onClick={() => dispatch({ type: 'USE_DEFAULT_REWARD', level: n })}>
                    Use default reward
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
