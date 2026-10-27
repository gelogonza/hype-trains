import { useState } from 'react';
import ArtTile from '../ArtTile.jsx';
import { ART_COLORS, ART_EMOJI } from '../../data/climb.js';

const NAME_RULE = /^[A-Za-z0-9]{3,20}$/;

export default function SubmitArt({ request, dispatch }) {
  const [emoji, setEmoji] = useState(ART_EMOJI[0]);
  const [bg, setBg] = useState(ART_COLORS[0]);
  const [name, setName] = useState('');
  const valid = NAME_RULE.test(name);

  return (
    <>
      <div className="screen-nav">
        <button className="back-btn" onClick={() => dispatch({ type: 'FAN_OPEN_REQUEST', requestId: null })}>‹ Requests</button>
        <span className="screen-nav-title">Submit {request.kind}</span>
      </div>
      <div className="screen-body">
        <div className="request-card">
          <div className="request-card-title">Goal {request.level} · {request.kind}</div>
          <p>"{request.brief}"</p>
        </div>

        <div className="art-preview">
          <ArtTile art={{ emoji, bg }} kind={request.kind} size={84} />
          <div className="art-preview-name">{name || 'YourName'}</div>
          <div className="proto-label">Prototype: placeholder art</div>
        </div>

        <h3 className="editor-heading">Picture</h3>
        <div className="emoji-grid" role="radiogroup" aria-label="Picture">
          {ART_EMOJI.map((e) => (
            <button key={e} role="radio" aria-checked={emoji === e} className={emoji === e ? 'is-active' : ''} onClick={() => setEmoji(e)}>
              {e}
            </button>
          ))}
        </div>

        <h3 className="editor-heading">Background</h3>
        <div className="color-row" role="radiogroup" aria-label="Background">
          {ART_COLORS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={bg === c}
              aria-label={`Color ${c}`}
              className={bg === c ? 'is-active' : ''}
              style={{ background: c }}
              onClick={() => setBg(c)}
            />
          ))}
        </div>

        <h3 className="editor-heading">Name</h3>
        <input
          className="text-input"
          value={name}
          maxLength={20}
          placeholder="e.g. CozyCrew"
          aria-label={`${request.kind} name`}
          onChange={(e) => setName(e.target.value)}
        />
        <div className={`char-count${name && !valid ? ' warn' : ''}`}>3–20 letters or numbers</div>

        <button
          className="btn-primary btn-block"
          disabled={!valid}
          onClick={() => dispatch({ type: 'FAN_SUBMIT', requestId: request.id, name, art: { emoji, bg } })}
        >
          Submit to {request.kind === 'emote' ? 'the emote' : 'the badge'} request
        </button>
      </div>
    </>
  );
}
