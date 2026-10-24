import { useState } from 'react';

const OUTCOMES = [
  { id: 'auto', label: 'Auto' },
  { id: 'success', label: 'Make it' },
  { id: 'fail', label: 'Run out' },
];
const SPEEDS = [1, 2, 4];

export default function DevPanel({ onReset, sim, onSim, onSkip }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dev${open ? ' dev--open' : ''}`}>
      <button className="dev-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        dev
      </button>
      <div className="dev-body">
        <div className="dev-title">Prototype controls</div>

        <div className="dev-group" role="group" aria-label="Crowd">
          <span className="dev-label">Crowd</span>
          <div className="dev-seg">
            {OUTCOMES.map((o) => (
              <button key={o.id} aria-pressed={sim.outcome === o.id} onClick={() => onSim({ outcome: o.id })}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dev-group" role="group" aria-label="Speed">
          <span className="dev-label">Speed</span>
          <div className="dev-seg">
            {SPEEDS.map((s) => (
              <button key={s} aria-pressed={sim.speed === s} onClick={() => onSim({ speed: s })}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        <button className="btn-secondary" onClick={onSkip}>Skip 15 seconds</button>
        <button
          className="btn-secondary"
          onClick={() => {
            onReset();
            setOpen(false);
          }}
        >
          Reset everything
        </button>
      </div>
    </div>
  );
}
