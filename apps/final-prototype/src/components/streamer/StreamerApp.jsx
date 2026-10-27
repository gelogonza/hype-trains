import { STREAMER } from '../../data/climb.js';
import StreamManager from './StreamManager.jsx';
import ArtSheet from './ArtSheet.jsx';

export default function StreamerApp({ state, dispatch }) {
  return (
    <div className="role-screen">
      <header className="role-header">
        <span className="channel-avatar-img" aria-hidden="true">{STREAMER.avatar}</span>
        <div>
          <div className="role-header-title">Stream Manager</div>
          <div className="role-header-sub">{STREAMER.name}</div>
        </div>
      </header>
      {state.ui.notice && <div className="notice" role="status">{state.ui.notice}</div>}
      <StreamManager state={state} dispatch={dispatch} />
      {state.ui.artSheet && <ArtSheet state={state} dispatch={dispatch} />}
    </div>
  );
}
