import { useState } from 'react';

export default function RequestForm({ level, dispatch }) {
  const [kind, setKind] = useState('emote');
  const [brief, setBrief] = useState('');

  return (
    <section className="editor-section">
      <p className="screen-intro">
        Fans will see this request and submit art. Mods shortlist the best ones, then you pick one for Goal {level}.
      </p>
      <h3 className="editor-heading">What should they make?</h3>
      <div className="segmented" role="radiogroup" aria-label="Reward type">
        {['emote', 'badge'].map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'is-active' : ''} onClick={() => setKind(k)}>
            {k === 'emote' ? 'Emote' : 'Badge'}
          </button>
        ))}
      </div>
      <h3 className="editor-heading">Brief</h3>
      <textarea
        className="text-input"
        rows={2}
        maxLength={80}
        value={brief}
        placeholder="e.g. An emote for the time the cat knocked over the mic"
        aria-label="Brief for fans"
        onChange={(e) => setBrief(e.target.value)}
      />
      <div className="char-count">{brief.length}/80</div>
      <button
        className="btn-primary btn-block"
        disabled={!brief.trim()}
        onClick={() => dispatch({ type: 'CREATE_REQUEST', level, kind, brief })}
      >
        Post request
      </button>
    </section>
  );
}
