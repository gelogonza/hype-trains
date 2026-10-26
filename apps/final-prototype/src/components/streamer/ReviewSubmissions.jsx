import ArtTile from '../ArtTile.jsx';
import { MOD_NAME } from '../../data/climb.js';

function SubmissionList({ items, level, dispatch, note, locked }) {
  return (
    <ul className="sub-list">
      {items.map((s) => (
        <li key={s.id} className="sub-item">
          <ArtTile art={s.art} kind={s.kind} size={44} />
          <div className="sub-info">
            <div className="sub-name">{s.name}</div>
            <div className="muted small">
              {s.kind} by {s.author}
              {note && s.shortlisted ? ` · ${note}` : ''}
            </div>
          </div>
          <button className="btn-pick" disabled={locked} onClick={() => dispatch({ type: 'PICK_SUBMISSION', level, submissionId: s.id })} aria-label={`Pick ${s.name} by ${s.author}`}>
            Pick
          </button>
        </li>
      ))}
    </ul>
  );
}

// `locked` while a climb is live: rewards can't change mid-climb.
export default function ReviewSubmissions({ level, request, subs, vault, dispatch, locked }) {
  const waiting = subs.filter((s) => s.status === 'submitted');
  const shortlisted = waiting.filter((s) => s.shortlisted);
  const others = waiting.filter((s) => !s.shortlisted);

  return (
    <>
      {request && (
        <>
          <p className="screen-intro">"{request.brief}"</p>
          <h3 className="editor-heading">Shortlisted by mods</h3>
          {shortlisted.length ? (
            <SubmissionList items={shortlisted} level={level} dispatch={dispatch} note={`shortlisted by ${MOD_NAME}`} locked={locked} />
          ) : (
            <p className="muted small empty">None yet.</p>
          )}
          <h3 className="editor-heading">Other submissions</h3>
          {others.length ? (
            <SubmissionList items={others} level={level} dispatch={dispatch} locked={locked} />
          ) : (
            <p className="muted small empty">None.</p>
          )}
        </>
      )}
      <h3 className="editor-heading">From the vault</h3>
      {vault.length ? <SubmissionList items={vault} level={level} dispatch={dispatch} locked={locked} /> : <p className="muted small empty">Empty.</p>}
    </>
  );
}
