import ArtTile from '../ArtTile.jsx';
import { STREAMER } from '../../data/climb.js';
import { mySubmissions, openRequests, pickedLevelOf, submissionsFor } from '../../state/reducer.js';

function statusText(state, s) {
  if (s.status === 'vault') return 'Saved to the vault for a future climb';
  if (s.status === 'picked') {
    const picked = pickedLevelOf(state, s.id);
    if (picked?.live) return `Live in Goal ${picked.level}! You're credited when it unlocks.`;
    if (picked) return `Picked for Goal ${picked.level} · goes live when ${STREAMER.name} publishes`;
  }
  return 'Submitted · waiting for mod review';
}

export default function FanHome({ state, dispatch }) {
  const requests = openRequests(state);
  const mine = mySubmissions(state);

  return (
    <div className="screen-body">
      <p className="screen-intro">
        Your art could become an emote or badge that supporters earn in {STREAMER.name}'s Community Climb. You're credited
        every time it unlocks, and you get the Creator badge.
      </p>

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
        <p className="muted small empty">No open requests right now.</p>
      )}

      <h3 className="editor-heading">Your submissions</h3>
      {mine.length ? (
        <ul className="sub-list">
          {mine.map((s) => (
            <li key={s.id} className={`sub-item${s.status === 'picked' ? ' sub-item--picked' : ''}`}>
              <ArtTile art={s.art} kind={s.kind} size={44} />
              <div className="sub-info">
                <div className="sub-name">{s.name}</div>
                <div className="small">{statusText(state, s)}</div>
                {s.status === 'picked' && <div className="muted small">You'll get the Creator badge and keep your {s.kind}.</div>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small empty">You haven't submitted anything yet.</p>
      )}
    </div>
  );
}
