import DevPanel from './DevPanel.jsx';

const ROLES = [
  { id: 'viewer', label: 'Viewer' },
  { id: 'streamer', label: 'Streamer' },
  { id: 'fan', label: 'Fan' },
];

export default function RoleSwitch({ role, onChange, onReset, ...devProps }) {
  return (
    <div className="role-bar">
      <span className="role-label">Prototype: view as</span>
      <div className="role-switch" role="tablist" aria-label="Prototype: view as">
        {ROLES.map((r) => (
          <button key={r.id} role="tab" aria-selected={role === r.id} className={role === r.id ? 'is-active' : ''} onClick={() => onChange(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <DevPanel onReset={onReset} {...devProps} />
    </div>
  );
}
