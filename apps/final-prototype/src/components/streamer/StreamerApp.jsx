import { STREAMER } from '../../data/train.js';
import SetupHome from './SetupHome.jsx';
import LevelEditor from './LevelEditor.jsx';
import LiveControl from './LiveControl.jsx';

const TABS = [
  { id: 'live', label: 'Stream Manager' },
  { id: 'setup', label: 'Challenge Train setup' },
];

export default function StreamerApp({ state, dispatch }) {
  return (
    <div className="role-screen">
      <header className="role-header">
        <span className="channel-avatar-img" aria-hidden="true">{STREAMER.avatar}</span>
        <div>
          <div className="role-header-title">Creator mode</div>
          <div className="role-header-sub">{STREAMER.name}</div>
        </div>
      </header>
      <div className="tw-tabs tw-tabs--underline" role="tablist" aria-label="Streamer">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={state.ui.streamerTab === t.id}
            className={state.ui.streamerTab === t.id ? 'is-active' : ''}
            onClick={() => dispatch({ type: 'STREAMER_TAB', tab: t.id })}
          >
            {t.label}
          </button>
        ))}
      </div>
      {state.ui.notice && <div className="notice" role="status">{state.ui.notice}</div>}
      {state.ui.streamerTab === 'live' ? (
        <LiveControl state={state} dispatch={dispatch} />
      ) : state.ui.streamerLevel ? (
        <LevelEditor state={state} dispatch={dispatch} />
      ) : (
        <SetupHome state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
