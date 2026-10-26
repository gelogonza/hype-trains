import ArtTile from '../ArtTile.jsx';
import { mySubmissions, openRequests, pickedLevelOf, submissionsFor } from '../../state/reducer.js';

function statusText(state, s) {
  if (s.status === 'vault') return 'In the vault';
  if (s.status === 'picked') {
    const level = pickedLevelOf(state, s.id);
    if (level) return `Picked for Goal ${level}`;
  }
  return 'Waiting for review';
}

export default function FanHome({ state, dispatch }) {
  const requests = openRequests(state);
  const mine = mySubmissions(state);

  return (
    <div className="screen-body">
      <p className="screen-intro">Get picked and you keep a sparkle version only you can use.</p>

      <h3 className="editor-heading">Open requests</h3>
      {requests.length ? (
        <ul className="request-list">
          {requests.map((r) => (
            <li key={r.id}>
              <button className="request-item" onClick={() => dispatch({ type: 'FAN_OPEN_REQUEST', requestId: r.id })}>
                <span className="request-item-top">
                  <span className="tag tag--lead">Goal {r.level}</span>
                  <span className="tag tag--kind">{r.kind}</span>
                  <span className="muted small">{submissionsFor(state, r.id).length} submitted</span>
                  <span className="ladder-chevron" aria-hidden="true">›</span>
                </span>
                <span className="request-item-brief">{r.brief}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small empty">None right now.</p>
      )}

      <h3 className="editor-heading">Your submissions</h3>
      {mine.length ? (
        <ul className="sub-list">
          {mine.map((s) => (
            <li key={s.id} className={`sub-item${s.status === 'picked' ? ' sub-item--picked' : ''}`}>
              {/* Picked art shows the fan's creator version, with the sparkle. */}
              <ArtTile art={s.art} kind={s.kind} size={44} sparkle={s.status === 'picked'} />
              <div className="sub-info">
                <div className="sub-name">{s.name}</div>
                <div className="small">{statusText(state, s)}</div>
                {s.status === 'picked' && <div className="fan-credit small">✨ Creator version · only you</div>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small empty">Nothing yet.</p>
      )}
    </div>
  );
}
